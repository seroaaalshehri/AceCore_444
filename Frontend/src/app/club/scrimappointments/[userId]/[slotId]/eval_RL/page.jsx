"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import LeftSidebar, { SIDEBAR_WIDTH } from "../../../../../Components/LeftSidebar";
import Particles from "../../../../../Components/Particles";
import { auth } from "../../../../../../../lib/firebaseClient";
import { onAuthStateChanged } from "firebase/auth";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000/api";

const RL_STAR_FIELDS = [
  "Fast Kickoff",
  "Air Dribble",
  "Flip Reset",
  "Jump Reset",
  "Pop Reset",
  "Double Reset",
  "Woof Dash",
  "Ground Freestyle",
  "Ground Punch",
  "Musty Flick",
  "Tornado Spin",
];

function makeEmptyRLEvaluation() {
  const base = {
    goals: "",
    assists: "",
    saves: "",
    shots: "",
  };

  RL_STAR_FIELDS.forEach((label) => {
    const key = label.replace(/\s+/g, "_").toLowerCase();
    base[key] = 0;
  });

  return base;
}

export default function ClubEvaluateRLPage() {
  const router = useRouter();
  const params = useParams();

  const clubId = Array.isArray(params?.userId) ? params.userId[0] : params?.userId;
  const slotId = Array.isArray(params?.slotId) ? params.slotId[0] : params?.slotId;

  const [authed, setAuthed] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});


  const [evaluatedMap, setEvaluatedMap] = useState({});
  const [gamerEvaluations, setGamerEvaluations] = useState({});
  const [currentEval, setCurrentEval] = useState(makeEmptyRLEvaluation());
  const [evaluationModal, setEvaluationModal] = useState({
    open: false,
    requestId: null,
    gamer: null,
    loading: false,
  });

  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [showBackConfirm, setShowBackConfirm] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setAuthed(!!u));
    return () => unsub();
  }, []);

  async function load() {
    if (!authed || !clubId || !slotId) return;
    setLoading(true);
    setErrMsg("");

    try {
      const url = new URL(`${API_BASE}/club/${clubId}/schedule/${slotId}/requests`);
      url.searchParams.set("status", "accepted");
      url.searchParams.set("_ts", String(Date.now()));

      const user = auth.currentUser;
      if (!user) throw new Error("User not authenticated");
      const token = await user.getIdToken();

      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });

      const json = await res.json().catch(() => ({}));
      const arr = Array.isArray(json.items) ? json.items : [];
      setItems(arr);

    } catch (e) {
      console.error(e);
      setErrMsg("Failed to load gamers for evaluation.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [authed, clubId, slotId]);

  function openEvaluationModal(request) {
    const existing = gamerEvaluations[request.id] || makeEmptyRLEvaluation();
    setCurrentEval(existing);
    setFieldErrors({});

    setEvaluationModal({
      open: true,
      requestId: request.id,
      gamer: request,
      loading: false,
    });
  }


  function updateNumericField(field, value) {
    setCurrentEval((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function updateStarField(fieldKey, value) {
    setCurrentEval((prev) => ({
      ...prev,
      [fieldKey]: value,
    }));
  }
  async function handleSaveEvaluation() {
    if (!evaluationModal.requestId) {
      setEvaluationModal({ open: false, requestId: null, gamer: null, loading: false });
      return;
    }

    try {
      setEvaluationModal((p) => ({ ...p, loading: true }));
      setErrMsg("");
      setGamerEvaluations((prev) => ({
        ...prev,
        [evaluationModal.requestId]: currentEval,
      }));

      setEvaluatedMap((prev) => ({
        ...prev,
        [evaluationModal.requestId]: true,
      }));


      setEvaluationModal({
        open: false,
        requestId: null,
        gamer: null,
        loading: false,
      });
    } catch (e) {
      console.error(e);
      setErrMsg(e.message || "Saving evaluation failed.");
      setEvaluationModal((p) => ({ ...p, loading: false }));
    }
  }

  async function handleSavePage() {
    setShowSaveConfirm(true);
  }

  async function confirmSavePage() {
    setShowSaveConfirm(false);

    const success = await submitAllEvaluations();

    if (success) {
      router.push(`/club/scrimappointments/${clubId}`);
    }
  }



  async function submitAllEvaluations() {
    try {
      const user = auth.currentUser;
      const token = await user.getIdToken();

      const evaluationsArray = items.map((gamer) => {
        const ev = gamerEvaluations[gamer.id];
        return {
          requestId: gamer.id,
          userid: gamer.userid,
          username: gamer.username,
          ...ev
        };
      });

      const res = await fetch(`${API_BASE}/evaluation/rocket-league`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          clubId,
          slotId,
          evaluations: evaluationsArray
        })
      });

      if (!res.ok) {
        throw new Error("Failed to save evaluations");
      }

      const data = await res.json();
      return true;
    } catch (err) {
      console.error("Submit error:", err);
      setErrMsg("Failed to save evaluations.");
      return false;
    }
  }

  return (
    <>
      <style jsx global>{`
      /* Chrome, Edge, Safari */
      ::-webkit-scrollbar {
        width: 90%;
      }

      ::-webkit-scrollbar-track {
        background: #0C0817;
        border-radius: 10px;
      }

      ::-webkit-scrollbar-thumb {
        background: #FCCC22;
        border-radius: 10px;
        border: 2px solid #0C0817;
      }

      ::-webkit-scrollbar-thumb:hover {
        background: #d4ad1d;
      }

      /* Firefox */
      * {
        scrollbar-width: thin;
        scrollbar-color: #FCCC22 #0C0817;
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
            {/* Top row: Save button only (no tabs) */}
            <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
              <button
                type="button"
                onClick={handleSavePage}
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
                  {items.map((r) => {
                    const evaluated = !!evaluatedMap[r.id];
                    return (
                      <li key={r.id} className="p-0">
                        <div className="flex items-center justify-between gap-4">
                          {/* Left: avatar + text (same as your manage page) */}
                          <div className="flex items-center gap-6 px-6 py-5 rounded-lg hover:bg-[#1C1633]/60 transition min-w-0">
                            <div className="relative h-24 w-24 rounded-full overflow-hidden bg-[#1C1633] border-4 border-[#5f4a87] shadow-[0_0_12px_#5f4a87]">
                              <img
                                src={r.profilePhoto || "/avatar-fallback.png"}
                                alt={r.username || r.userid}
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <div className="min-w-0">
                              <div className="text-white text-[30px] font-bold truncate">
                                {r.firstName} {r.lastName}
                              </div>
                              <div className="text-gray text-[21px] truncate">
                                @{r.username}
                              </div>
                            </div>
                          </div>

                          {/* Right: single Evaluate/Edit button */}
                          <div className="flex items-center gap-2 shrink-0 pr-6">
                            <button
                              type="button"
                              onClick={() => openEvaluationModal(r)}
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

              {/* Evaluation popup modal – Rocket League form */}
              {evaluationModal.open && evaluationModal.gamer && (
                <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 z-50">

                  <div
                    className="bg-[#1d1530] text-white p-6 rounded-xl shadow-2xl w-[520px] max-h-[90vh] overflow-y-auto relative font-barlow"
                    style={{
                      scrollbarWidth: "thin",
                      scrollbarColor: "#FCCC22 #0C0817",
                    }}
                  >

                    {/* Close X */}
                    <button
                      onClick={() => {
                        setFieldErrors({});
                        setEvaluationModal({
                          open: false,
                          requestId: null,
                          gamer: null,
                          loading: false,
                        });
                      }}
                      className="absolute top-3 right-3 text-gray-400 hover:text-white text-4xl leading-none"
                    >
                      ×
                    </button>

                    <h3 className="text-3xl font-bold mb-3 text-center text-[#FCCC22]">
                      Evaluate {evaluationModal.gamer.firstName}{" "}
                      {evaluationModal.gamer.lastName}{" | @"}{evaluationModal.gamer.username}
                    </h3>

                    {/* NUMERIC FIELDS */}
                    <div className="text-left mb-6">
                      <h4 className="text-2xl font-semibold mb-3">Game Stats (60%)</h4>

                      <div className="grid grid-cols-2 gap-4">
                        {["goals", "assists", "saves", "shots"].map((field) => (
                          <div key={field} className="mb-2">
                            <label className="block text-xl mb-1 capitalize">{field}</label>

                            <input
                              type="number"
                              required
                              min={0}
                              onKeyDown={(e) =>
                                ["e", "E", "+", "-"].includes(e.key) && e.preventDefault()
                              }
                              className={`w-full bg-[#0C0817] rounded px-3 py-2 text-base 
                  focus:outline-none focus:ring-2 focus:ring-[#FCCC22]/60 border ${fieldErrors[field] ? "border-red-500" : "border-[#3b2d5e]"
                                }`}
                              value={currentEval[field] ?? ""}
                              onChange={(e) => {
                                updateNumericField(field, e.target.value);
                                if (fieldErrors[field]) {
                                  setFieldErrors((prev) => ({ ...prev, [field]: "" }));
                                }
                              }}
                            />
                            {fieldErrors[field] && (
                              <p className="text-red-500 text-lg mt-1">Required.</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* STAR FIELDS */}
                    <div className="text-left">
                      <h4 className="text-2xl font-semibold mb-3">
                        Gamer's Skill Evaluation (40%){" "}
                        <span className="text-base text-gray-400">(0–5)</span>
                      </h4>

                      <div className="grid grid-cols-2 gap-4">
                        {RL_STAR_FIELDS.map((label) => {
                          const key = label.replace(/\s+/g, "_").toLowerCase();
                          const val = currentEval[key] ?? 0;
                          const isError = fieldErrors[key];

                          return (
                            <div key={key} className="mb-2">
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-xl">{label}</span>
                                <span
                                  className={`text-xl font-bold`}
                                >
                                  {val}/5
                                </span>
                              </div>

                              <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <button
                                    key={star}
                                    type="button"
                                    onClick={() => {
                                      updateStarField(key, star);
                                      setFieldErrors((prev) => ({ ...prev, [key]: false }));
                                    }}
                                    className={`text-3xl leading-none transition-transform duration-150 ${star <= val
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

                    {/* SAVE BUTTON */}
                    <div className="flex justify-center mt-8">
                      <button
                        type="button"
                        onClick={() => {
                          const numericFields = ["goals", "assists", "saves", "shots"];
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

                          setFieldErrors({});
                          handleSaveEvaluation();
                        }}
                        disabled={evaluationModal.loading}
                        className="bg-[#FCCC22] text-[#1d1530] -mt-5 px-6 py-2 rounded text-2xl font-bold hover:shadow-[0_0_14px_rgba(252,204,34,0.8)] disabled:opacity-70"
                      >
                        {evaluationModal.loading ? "Saving..." : "Save"}
                      </button>

                    </div>
                  </div>
                </div>
              )}
            </div>

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

      {/* Save confirmation modal */}
      {showSaveConfirm && (
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
                onClick={confirmSavePage}
                className="flex-1 bg-red-600 hover:bg-red-500 px-4 py-2 rounded text-2xl text-center font-bold"
              >
                End
              </button>
              <button
                onClick={() => setShowSaveConfirm(false)}

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
