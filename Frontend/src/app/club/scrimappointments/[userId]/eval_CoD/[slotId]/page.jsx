"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import LeftSidebar, { SIDEBAR_WIDTH } from "../../../../../Components/LeftSidebar";
import Particles from "../../../../../Components/Particles";
import { auth } from "../../../../../../../lib/firebaseClient";
import { onAuthStateChanged } from "firebase/auth";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000/api";

// Manual rating fields for CoD (0–5 stars)
const COD_RATING_FIELDS = [
  { key: "mapAwareness", label: "Map Awareness" },
  { key: "aimControl", label: "Aim Control" },
  { key: "movementControl", label: "Movement Control" },
  { key: "soundAwareness", label: "Sound Awareness" },
];

function makeEmptyEvaluation() {
  return {
    eliminations: "",
    deaths: "",
    objectiveValue: "",
    result: "win", // default match result
    // manual ratings default to 0 stars
    mapAwareness: 0,
    aimControl: 0,
    movementControl: 0,
    soundAwareness: 0,
  };
}

export default function ClubEvaluateCoDPage() {
  const router = useRouter();
  const params = useParams();

  const rawUserId = params?.userId;
  const rawSlotId = params?.slotId;

  const clubId = Array.isArray(rawUserId) ? rawUserId[0] : rawUserId;
  const slotId = Array.isArray(rawSlotId) ? rawSlotId[0] : rawSlotId;

  const [authed, setAuthed] = useState(false);

  const [items, setItems] = useState([]); // gamers from GET /evaluation/:clubId/slot/:slotId
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState("");

  // validation errors for numeric fields
  const [fieldErrors, setFieldErrors] = useState({});

  // per-gamer evaluations, keyed by userId
  const [gamerEvaluations, setGamerEvaluations] = useState({});
  // which gamers already have an evaluation saved locally
  const [evaluatedMap, setEvaluatedMap] = useState({});

  // current form inside the modal
  const [currentEval, setCurrentEval] = useState(makeEmptyEvaluation());

  // modal state
  const [evaluationModal, setEvaluationModal] = useState({
    open: false,
    userId: null,
    gamer: null,
    loading: false,
  });

  // confirmation modals
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [showBackConfirm, setShowBackConfirm] = useState(false);

  // --- Auth listener ---
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setAuthed(!!u));
    return () => unsub();
  }, []);

  // --- Load accepted gamers from CoD backend endpoint ---
  async function load() {
    if (!authed || !clubId || !slotId) return;

    setLoading(true);
    setErrMsg("");

    try {
      const user = auth.currentUser;
      if (!user) throw new Error("User not authenticated");
      const token = await user.getIdToken();

      const res = await fetch(
        `${API_BASE}/evaluation/${encodeURIComponent(
          clubId
        )}/slot/${encodeURIComponent(slotId)}?_ts=${Date.now()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        }
      );

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || "Failed to load evaluation data.");
      }

      const json = await res.json().catch(() => ({}));

      // backend returns { clubId, slotId, count, gamers: [...] }
      const list = Array.isArray(json.items)
        ? json.items
        : Array.isArray(json.gamers)
        ? json.gamers
        : [];

      setItems(list);
    } catch (e) {
      console.error(e);
      setErrMsg(e?.message || "Failed to load evaluation data.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [authed, clubId, slotId]);

  // --- Modal open/close ---

  function openEvaluationModal(gamer) {
    const existing = gamerEvaluations[gamer.userId] || makeEmptyEvaluation();
    setCurrentEval(existing);
    setFieldErrors({});

    setEvaluationModal({
      open: true,
      userId: gamer.userId,
      gamer,
      loading: false,
    });
  }

  function closeEvaluationModal() {
    setFieldErrors({});
    setEvaluationModal({
      open: false,
      userId: null,
      gamer: null,
      loading: false,
    });
  }

  // --- Form helpers ---

  function updateNumericField(field, value) {
    setCurrentEval((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function updateRatingField(key, value) {
    setCurrentEval((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  function updateResult(value) {
    setCurrentEval((prev) => ({
      ...prev,
      result: value,
    }));
  }

  // --- Save one gamer evaluation into local state ---

  async function handleSaveEvaluation() {
    if (!evaluationModal.userId) {
      closeEvaluationModal();
      return;
    }

    // validate numeric fields
    const numericFields = ["eliminations", "deaths", "objectiveValue"];
    const newErrors = {};

    numericFields.forEach((field) => {
      const val = currentEval[field];
      if (val === undefined || val === null || val === "") {
        newErrors[field] = "Required.";
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setFieldErrors(newErrors);
      return;
    }

    try {
      setEvaluationModal((p) => ({ ...p, loading: true }));
      setErrMsg("");

      setGamerEvaluations((prev) => ({
        ...prev,
        [evaluationModal.userId]: { ...currentEval },
      }));

      setEvaluatedMap((prev) => ({
        ...prev,
        [evaluationModal.userId]: true,
      }));

      console.log(
        "Saved CoD evaluation for:",
        evaluationModal.userId,
        currentEval
      );

      closeEvaluationModal();
    } catch (e) {
      console.error(e);
      setErrMsg(e.message || "Saving evaluation failed.");
      setEvaluationModal((p) => ({ ...p, loading: false }));
    }
  }

  // --- Top "End Evaluation" button ---

  function handleEndEvaluation() {
    setShowEndConfirm(true);
  }

  // --- Confirm final save: POST all evaluations to CoD endpoint ---

  async function confirmEndEvaluation() {
    if (!authed || !clubId || !slotId) return;

    try {
      setShowEndConfirm(false);

      const user = auth.currentUser;
      if (!user) throw new Error("User not authenticated");
      const token = await user.getIdToken();

      // build payload for backend service
      const payload = Object.entries(gamerEvaluations).map(
        ([userId, data]) => ({
          userId,
          eliminations: Number(data.eliminations || 0),
          deaths: Number(data.deaths || 0),
          objectiveValue: Number(data.objectiveValue || 0),
          result: data.result || "loss",
          mapAwareness: Number(data.mapAwareness || 0),
          aimControl: Number(data.aimControl || 0),
          movementControl: Number(data.movementControl || 0),
          soundAwareness: Number(data.soundAwareness || 0),
        })
      );

      const res = await fetch(
        `${API_BASE}/evaluation/${encodeURIComponent(
          clubId
        )}/slot/${encodeURIComponent(slotId)}?_ts=${Date.now()}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ evaluations: payload }),
        }
      );

      const json = await res.json().catch(() => ({}));

      if (!res.ok || json?.ok === false) {
        throw new Error(json?.error || "Saving your changes failed.");
      }

      router.back();
    } catch (e) {
      console.error(e);
      setErrMsg(e?.message || "Saving your changes failed.");
    }
  }

  return (
    <>
      {/* custom scrollbar like RL page */}
      <style jsx global>{`
        ::-webkit-scrollbar {
          width: 90%;
        }
        ::-webkit-scrollbar-track {
          background: #0c0817;
          border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb {
          background: #fccc22;
          border-radius: 10px;
          border: 2px solid #0c0817;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #d4ad1d;
        }
        * {
          scrollbar-width: thin;
          scrollbar-color: #fccc22 #0c0817;
        }
      `}</style>

      {/* background */}
      <div className="absolute inset-2 z-0 pointer-events-none">
        <Particles
          particleColors={["#ffffff"]}
          particleCount={200}
          particleSpread={10}
          speed={0.1}
          particleBaseSize={100}
        />
      </div>

      {/* sidebar */}
      <LeftSidebar
        role="club"
        active="scrimsarena"
        fixed
        userId={clubId}
        clubDynamic
      />

      <main
        className="relative z-10 pt-8 pointer-events-auto font-barlow"
        style={{ marginLeft: SIDEBAR_WIDTH + 20, marginRight: 24 }}
      >
        <div className="mx-auto w-full max-w-7xl">
          <h1 className="text-6xl font-bold text-[#FCCC22] mb-6 mt-9 text-center">
            GAMERS’ SCRIM EVALUATION
          </h1>

          <section className="bg-[#1c1430] rounded-xl p-6 md:p-8">
            {/* top row – End Evaluation button */}
            <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
              <button
                type="button"
                onClick={handleEndEvaluation}
                className="rounded-md bg-[#FCCC22] text-[#0C0817] text-2xl font-bold px-4 py-2 hover:opacity-90 active:opacity-80"
              >
                End Evaluation
              </button>
              <div />
            </div>

            {errMsg && (
              <div className="mt-4 text-red-300 font-semibold bg-[#2b1f47] border border-red-400/30 px-4 py-2 rounded">
                {errMsg}
              </div>
            )}

            {/* gamers list */}
            <div
              className="mt-6 rounded-lg border border-[#3b2d5e] bg-[#1C1633]/40 min-h-[140px] min-w-[200px]"
              style={{ maxHeight: "36rem", overflowY: "auto" }}
            >
              {loading ? (
                <div className="p-6">
                  <div className="animate-pulse h-10 rounded bg-[#120c23]" />
                </div>
              ) : items.length === 0 ? (
                <div className="p-6 text-gray-500 text-xl font-bold">
                  No gamers to evaluate.
                </div>
              ) : (
                <ul className="divide-y divide-[#3b2d5e]">
                  {items.map((g) => {
                    const evaluated = !!evaluatedMap[g.userId];

                    return (
                      <li key={g.userId} className="p-0">
                        <div className="flex items-center justify-between gap-4">
                          {/* left: avatar + names */}
                          <div className="flex items-center gap-6 px-6 py-5 rounded-lg hover:bg-[#1C1633]/60 transition min-w-0">
                            <div className="relative h-24 w-24 rounded-full overflow-hidden bg-[#1C1633] border-4 border-[#5f4a87] shadow-[0_0_12px_#5f4a87]">
                              <img
                                src={g.profilePhoto || "/avatar-fallback.png"}
                                alt={g.username || g.userId}
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <div className="min-w-0">
                              <div className="text-white text-[30px] font-bold truncate">
                                {g.firstName} {g.lastName}
                              </div>
                              <div className="text-gray text-[21px] truncate">
                                @{g.username}
                              </div>
                            </div>
                          </div>

                          {/* right: Evaluate / Edit button */}
                          <div className="flex items-center gap-2 shrink-0 pr-6">
                            <button
                              type="button"
                              onClick={() => openEvaluationModal(g)}
                              className="bg-[#FCCC22] text-xl text-[#1c1430] font-bold px-4 py-2 rounded hover:shadow-[0_0_14px_rgba(252,204,34,0.7)] transition"
                            >
                              {evaluated ? "Edit" : "Evaluate"}
                            </button>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* back button */}
            <div className="flex justify-end mt-4">
              <button
                type="button"
                className="text-red-400 font-bold px-3 py-1 rounded text-xl disabled:opacity-60 hover:bg-[#3b2d5e] transition-shadow"
                onClick={() => setShowBackConfirm(true)}
              >
                Back
              </button>
            </div>
          </section>
        </div>
      </main>

      {/* evaluation modal with numeric fields + stars (CoD version) */}
      {evaluationModal.open && evaluationModal.gamer && (
        <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 z-[2147483647]">
          <div
            className="bg-[#1d1530] text-white p-6 rounded-xl shadow-2xl w-[520px] max-h-[90vh] overflow-y-auto relative font-barlow"
            style={{
              scrollbarWidth: "thin",
              scrollbarColor: "#FCCC22 #0C0817",
            }}
          >
            {/* close X */}
            <button
              onClick={closeEvaluationModal}
              className="absolute top-3 right-3 text-gray-400 hover:text-white text-4xl leading-none"
            >
              ×
            </button>

            <h3 className="text-3xl font-bold mb-3 text-center text-[#FCCC22]">
          Evaluate{" "}
  {evaluationModal.gamer.firstName}{" "}
  {evaluationModal.gamer.lastName}
  {" | @"}
  {evaluationModal.gamer.username}
            </h3>

            {/* numeric + result fields */}
            <div className="text-left mb-6">
              <h4 className="text-2xl font-semibold mb-3">Game Stats (60%)</h4>

              <div className="grid grid-cols-2 gap-4">
                {/* Eliminations */}
                <div className="mb-2">
                  <label className="block text-xl mb-1">Eliminations</label>
                  <input
                    type="number"
                    required
                    min={0}
                    onKeyDown={(e) =>
                      ["e", "E", "+", "-"].includes(e.key) &&
                      e.preventDefault()
                    }
                    className={`w-full bg-[#0C0817] rounded px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-[#FCCC22]/60 border ${
                      fieldErrors.eliminations
                        ? "border-red-500"
                        : "border-[#3b2d5e]"
                    }`}
                    value={currentEval.eliminations ?? ""}
                    onChange={(e) => {
                      updateNumericField("eliminations", e.target.value);
                      if (fieldErrors.eliminations) {
                        setFieldErrors((prev) => ({
                          ...prev,
                          eliminations: "",
                        }));
                      }
                    }}
                  />
                  {fieldErrors.eliminations && (
                    <p className="text-red-500 text-lg mt-1">Required.</p>
                  )}
                </div>

                {/* Deaths */}
                <div className="mb-2">
                  <label className="block text-xl mb-1">Deaths</label>
                  <input
                    type="number"
                    required
                    min={0}
                    onKeyDown={(e) =>
                      ["e", "E", "+", "-"].includes(e.key) &&
                      e.preventDefault()
                    }
                    className={`w-full bg-[#0C0817] rounded px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-[#FCCC22]/60 border ${
                      fieldErrors.deaths ? "border-red-500" : "border-[#3b2d5e]"
                    }`}
                    value={currentEval.deaths ?? ""}
                    onChange={(e) => {
                      updateNumericField("deaths", e.target.value);
                      if (fieldErrors.deaths) {
                        setFieldErrors((prev) => ({ ...prev, deaths: "" }));
                      }
                    }}
                  />
                  {fieldErrors.deaths && (
                    <p className="text-red-500 text-lg mt-1">Required.</p>
                  )}
                </div>

                {/* Objective */}
                <div className="mb-2">
                  <label className="block text-xl mb-1">Objective</label>
                  <input
                    type="number"
                    required
                    min={0}
                    onKeyDown={(e) =>
                      ["e", "E", "+", "-"].includes(e.key) &&
                      e.preventDefault()
                    }
                    className={`w-full bg-[#0C0817] rounded px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-[#FCCC22]/60 border ${
                      fieldErrors.objectiveValue
                        ? "border-red-500"
                        : "border-[#3b2d5e]"
                    }`}
                    value={currentEval.objectiveValue ?? ""}
                    onChange={(e) => {
                      updateNumericField("objectiveValue", e.target.value);
                      if (fieldErrors.objectiveValue) {
                        setFieldErrors((prev) => ({
                          ...prev,
                          objectiveValue: "",
                        }));
                      }
                    }}
                  />
                  {fieldErrors.objectiveValue && (
                    <p className="text-red-500 text-lg mt-1">Required.</p>
                  )}
                </div>

                {/* Result (win/loss) */}
                <div className="mb-2">
                  <label className="block text-xl mb-1">Result</label>
                  <select
                    className="w-full bg-[#0C0817] rounded px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-[#FCCC22]/60 border border-[#3b2d5e]"
                    value={currentEval.result || "win"}
                    onChange={(e) => updateResult(e.target.value)}
                  >
                    <option value="win">Win</option>
                    <option value="loss">Loss</option>
                  </select>
                </div>
              </div>
            </div>

            {/* star rating fields */}
            <div className="text-left">
              <h4 className="text-2xl font-semibold mb-3">
                Gamer's Skill Evaluation (40%){" "}
                <span className="text-base text-gray-400">(0–5)</span>
              </h4>

              <div className="grid grid-cols-2 gap-4">
                {COD_RATING_FIELDS.map(({ key, label }) => {
                  const val = currentEval[key] ?? 0;
                  return (
                    <div key={key} className="mb-2">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-xl">{label}</span>
                        <span className="text-xl font-bold text-[#FCCC22]">{val}/5</span>
                      </div>

                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => updateRatingField(key, star)}
                            className={`text-3xl leading-none transition-transform duration-150 ${
                              star <= val
                                ? "text-[#FCCC22] drop-shadow-[0_0_4px_rgba(252,204,34,0.8)] scale-105"
                                : "text-gray-600 hover:text-[#FCCC22] hover:scale-105"
                            }`}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* save button */}
            <div className="flex justify-center mt-8">
              <button
                type="button"
                onClick={handleSaveEvaluation}
                disabled={evaluationModal.loading}
                className="bg-[#FCCC22] text-[#1d1530] -mt-5 px-6 py-2 rounded text-2xl font-bold hover:shadow-[0_0_14px_rgba(252,204,34,0.8)] disabled:opacity-70"
              >
                {evaluationModal.loading ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* End evaluation confirmation modal */}
      {showEndConfirm && (
        <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 z-[2147483647]">
          <div className="bg-[#1C1633] text-white p-6 rounded-xl shadow-2xl font-barlow text-center w-[430px]">
            <div className="text-2xl font-bold mb-3 text-red-400 text-center">
              Are you sure you want to end the evaluation?
            </div>
            <p className="text-2xl text-gray-300 mb-6 text-center font-bold">
              This action will lock all scores and disable further evaluations
              for this scrim. You will not be able to edit or update any
              results after this.
            </p>
            <div className="flex gap-3">
              <button
                onClick={confirmEndEvaluation}
                className="flex-1 bg-red-600 hover:bg-red-500 px-4 py-2 rounded text-2xl text-center font-bold"
              >
                End 
              </button>
              <button
                onClick={() => setShowEndConfirm(false)}
                className="flex-1 bg-gray-500 hover:bg-gray-400 px-4 py-2 rounded text-2xl text-center font-bold"
              >
                Keep
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Back confirmation modal */}
      {showBackConfirm && (
        <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 z-50">
          <div className="bg-[#1C1633] text-white p-6 font-barlow rounded-xl shadow-2xl w-[350px] text-center">
            <p className="text-2xl font-bold mb-4">
              Are you sure you want to go back? Your evaluations will not be saved
            </p>
            <div className="flex w-full space-x-2">
              <button
                onClick={() => {
                  setShowBackConfirm(false);
                  router.back();
                }}
                className="w-1/2 bg-red-600 hover:bg-red-500 px-4 py-2 rounded text-xl font-bold"
              >
                Yes
              </button>
              <button
                onClick={() => setShowBackConfirm(false)}
                className="w-1/2 bg-gray-500 hover:bg-gray-400 px-4 py-2 rounded text-xl font-bold"
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}