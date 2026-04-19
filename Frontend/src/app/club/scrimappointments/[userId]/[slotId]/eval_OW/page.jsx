"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import LeftSidebar, { SIDEBAR_WIDTH } from "../../../../../Components/LeftSidebar";
import Particles from "../../../../../Components/Particles";
import { auth } from "../../../../../../../lib/firebaseClient";
import { onAuthStateChanged } from "firebase/auth";
import { authedFetch } from "../../../../../../../lib/authedFetch";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000/api";

// ---- Overwatch numeric fields (60%) ----
const OW_NUMERIC_FIELDS = [
  { key: "eliminations", label: "Eliminations" },
  { key: "damageDone", label: "Damage Done" },
  { key: "healingDone", label: "Healing Done" },
  { key: "damageMitigated", label: "Damage Mitigated" },
  { key: "deaths", label: "Deaths" },
];

// ---- Overwatch star fields (40%) ----
const OW_STAR_FIELDS = [
  { key: "aimTracking", label: "Aim Tracking" },
  { key: "flickShot", label: "Flick Shot" },
  { key: "positioning", label: "Positioning" },
  { key: "ultimateEconomy", label: "Ultimate Economy" },
  { key: "cooldownManagement", label: "Cooldown Management" },
  { key: "animationCancel", label: "Animation Cancel" },
  { key: "oneFrameReflex", label: "One Frame Reflex" },
  { key: "ultimateEfficiency", label: "Ultimate Efficiency" },
  { key: "peekCoverDiscipline", label: "Peek / Cover Discipline" },
];

// Empty form helper
function makeEmptyOwForm() {
  const skills = {};
  OW_STAR_FIELDS.forEach((f) => {
    skills[f.key] = 0;
  });

  return {
    role: "",
    eliminations: "",
    damageDone: "",
    healingDone: "",
    damageMitigated: "",
    deaths: "",
    skills,
  };
}

 export default function ClubEvaluateOWPage() {
  const router = useRouter();
  const params = useParams();

  const clubId = Array.isArray(params?.userId)
    ? params.userId[0]
    : params?.userId;
  const slotId = Array.isArray(params?.slotId)
    ? params.slotId[0]
    : params?.slotId;

  const [authed, setAuthed] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState("");

  // which gamers already evaluated (for button text)
  const [evaluatedMap, setEvaluatedMap] = useState({});

  // stores evaluation forms per requestId
  const [evaluationDataMap, setEvaluationDataMap] = useState({});

  const [evaluationModal, setEvaluationModal] = useState({
    open: false,
    requestId: null,
    gamer: null,
    loading: false,
  });

  const [owForm, setOwForm] = useState(makeEmptyOwForm());
  const [fieldErrors, setFieldErrors] = useState({});

  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [showBackConfirm, setShowBackConfirm] = useState(false);

  // ==== AUTH GATE ====
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setAuthed(!!u));
    return () => unsub();
  }, []);

  // ==== LOAD ACCEPTED GAMERS ====
  async function load() {
    if (!authed || !clubId || !slotId) return;
    setLoading(true);
    setErrMsg("");

    try {
      const url = new URL(
        `${API_BASE}/club/${clubId}/schedule/${slotId}/requests`
      );
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

  // ==== OPEN MODAL ====
  function openEvaluationModal(request) {
    const existing = evaluationDataMap[request.id];

    setOwForm(existing ? { ...existing } : makeEmptyOwForm());
    setFieldErrors({});

    setEvaluationModal({
      open: true,
      requestId: request.id,
      gamer: request,
      loading: false,
    });
  }

  // ==== SAVE EVALUATION (LOCAL ONLY) ====
  function handleSaveEvaluationLocal() {
    if (!evaluationModal.requestId || !evaluationModal.gamer) {
      setEvaluationModal({
        open: false,
        requestId: null,
        gamer: null,
        loading: false,
      });
      return;
    }

    // validate first
    const newErrors = {};
    if (!owForm.role) newErrors.role = "Required.";
    OW_NUMERIC_FIELDS.forEach(({ key }) => {
      const val = owForm[key];
      if (val === undefined || val === null || val === "") {
        newErrors[key] = "Required.";
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setFieldErrors(newErrors);
      return;
    }

    // store in map
    setEvaluationDataMap((prev) => ({
      ...prev,
      [evaluationModal.requestId]: { ...owForm },
    }));

    // mark as evaluated
    setEvaluatedMap((prev) => ({
      ...prev,
      [evaluationModal.requestId]: true,
    }));

    // close modal
    setFieldErrors({});
    setEvaluationModal({
      open: false,
      requestId: null,
      gamer: null,
      loading: false,
    });
  }

  // ==== GLOBAL SAVE (SEND TO BACKEND) ====
  async function confirmSavePage() {
    setShowSaveConfirm(false);

    try {
      setErrMsg("");

      const entries = Object.entries(evaluationDataMap);
      if (entries.length === 0) {
        // nothing to save
        return;
      }

      for (const [requestId, form] of entries) {
        const gamer = items.find((g) => g.id === requestId);
        if (!gamer) continue;

        const payload = {
          clubId,
          slotId,
          requestId,
          userId: gamer.userid || gamer.userId || gamer.id,
          username: gamer.username,
          role: form.role,
          stats: {
            eliminations: Number(form.eliminations),
            damageDone: Number(form.damageDone),
            healingDone: Number(form.healingDone),
            damageMitigated: Number(form.damageMitigated),
            deaths: Number(form.deaths),
          },
          skills: form.skills,
        };

        const res = await authedFetch(`${API_BASE}/evaluation/overwatch`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!data.success) {
          console.error("Evaluation failed for", requestId, data.error);
          throw new Error(data.error || "Evaluation failed");
        }
      }

      console.log("All evaluations saved to backend.");

      // ✅ After successful save, go back to Scrim Appointments page
      router.push(`/club/scrimappointments/${clubId}`);
} catch (e) {
      console.error(e);
      setErrMsg(e.message || "Saving evaluations failed.");
    }
  }



  function handleSavePage() {
    setShowSaveConfirm(true);
  }

  return (
    <>
      {/* Global scrollbar styling */}
      <style jsx global>{`
        ::-webkit-scrollbar {
          width: 12px;
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

              {/* EVALUATION MODAL */}
              {evaluationModal.open && evaluationModal.gamer && (
                <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 z-50">
                  <div className="bg-[#1d1530] text-white p-6 rounded-xl shadow-2xl w-[520px] max-h-[90vh] overflow-y-auto relative font-barlow">
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

                    {/* ROLE */}
                    <div className="text-left mb-6">
                      <h4 className="text-2xl font-semibold mb-3">Role</h4>
                      <select
                        value={owForm.role}
                        onChange={(e) => {
                          const value = e.target.value;
                          setOwForm((prev) => ({ ...prev, role: value }));
                          if (fieldErrors.role) {
                            setFieldErrors((prev) => ({ ...prev, role: "" }));
                          }
                        }}
                        className={`w-full bg-[#0C0817] text-white rounded px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-[#FCCC22]/60 border ${
                          fieldErrors.role
                            ? "border-red-500"
                            : "border-[#3b2d5e]"
                        }`}
                      >
                        <option value="">Select role</option>
                        <option value="DPS">DPS</option>
                        <option value="Tank">Tank</option>
                        <option value="Support">Support</option>
                      </select>
                      {fieldErrors.role && (
                        <p className="text-red-500 text-lg mt-1">Required.</p>
                      )}
                    </div>

                    {/* 60% STATS */}
                    <div className="text-left mb-6">
                      <h4 className="text-2xl font-semibold mb-3">
                        Game Stats (60%)
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        {OW_NUMERIC_FIELDS.map(({ key, label }) => (
                          <div key={key} className="mb-2">
                            <label className="block text-xl mb-1">
                              {label}
                            </label>
                            <input
                              type="number"
                              required
                              min={0}
                              onKeyDown={(e) =>
                                ["e", "E", "+", "-"].includes(e.key) &&
                                e.preventDefault()
                              }
                              className={`w-full bg-[#0C0817] rounded px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-[#FCCC22]/60 border ${
                                fieldErrors[key]
                                  ? "border-red-500"
                                  : "border-[#3b2d5e]"
                              }`}
                              value={owForm[key] ?? ""}
                              onChange={(e) => {
                                const value = e.target.value;
                                setOwForm((prev) => ({ ...prev, [key]: value }));
                                if (fieldErrors[key]) {
                                  setFieldErrors((prev) => ({
                                    ...prev,
                                    [key]: "",
                                  }));
                                }
                              }}
                            />
                            {fieldErrors[key] && (
                              <p className="text-red-500 text-lg mt-1">
                                Required.
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 40% STARS */}
                    <div className="text-left">
                      <h4 className="text-2xl font-semibold mb-3">
                        Gamer&apos;s Skill Evaluation (40%){" "}
                        <span className="text-base text-gray-400">(0–5)</span>
                      </h4>

                      <div className="grid grid-cols-2 gap-4">
                        {OW_STAR_FIELDS.map(({ key, label }) => {
                          const val = owForm.skills[key] ?? 0;
                          return (
                            <div key={key} className="mb-2">
                              <div className="flex gap-3 items-center mb-1">
                                <span className="text-xl">{label}</span>
                                <span className="text-xl font-bold text-[#FCCC22]">
                                  {val}/5
                                </span>
                              </div>
                              <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <button
                                    key={star}
                                    type="button"
                                    onClick={() =>
                                      setOwForm((prev) => ({
                                        ...prev,
                                        skills: {
                                          ...prev.skills,
                                          [key]: star,
                                        },
                                      }))
                                    }
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

                    {/* SAVE (LOCAL) */}
                    <div className="flex justify-center mt-8">
                      <button
                        type="button"
                        onClick={handleSaveEvaluationLocal}
                        disabled={evaluationModal.loading}
                        className="bg-[#FCCC22] text-[#1d1530] -mt-5 px-6 py-2 rounded text-2xl font-bold hover:shadow-[0_0_14px_rgba(252,204,34,0.8)] disabled:opacity-70"
                      >
                        Save
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
      {/* Save / End evaluation confirmation modal */}
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
              Are you sure you want to go back? Your evaluations will not be
              saved
            </p>
            <div className="flex w-full space-x-2">
              <button
                onClick={() => {
                  setShowBackConfirm(false);
router.push(`/club/scrimappointments/${clubId}`);
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
