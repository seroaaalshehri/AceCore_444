"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import LeftSidebar, { SIDEBAR_WIDTH } from "../../../../Components/LeftSidebar";
import Particles from "../../../../Components/Particles";
import { auth } from "../../../../../../lib/firebaseClient";
import { onAuthStateChanged } from "firebase/auth";
import { authedFetch } from "../../../../../../lib/authedFetch";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000/api";

const TAB = "px-3 py-2 text-2xl font-bold border-b-2 border-transparent text-[#dee1e6] hover:text-[#FCCC22] hover:border-[#FCCC22] transition-colors";
const TAB_ACTIVE = "px-3 py-2 text-2xl font-bold border-b-2 border-[#FCCC22] text-[#FCCC22]";

export default function ClubSlotRequestsPage() {
    const router = useRouter();
    const params = useParams();
    const clubId = Array.isArray(params?.id) ? params.id[0] : params?.id;
    const slotId = Array.isArray(params?.slotId) ? params.slotId[0] : params?.slotId;
    const [tab, setTab] = useState("on_hold");
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errMsg, setErrMsg] = useState("");
    const [authed, setAuthed] = useState(false);
    const [slotFullOpen, setSlotFullOpen] = useState(false); // ⬅️ NEW
    const [confirmAction, setConfirmAction] = useState({
        open: false,
        requestId: null,
        action: null,          // "accept" | "decline"
        loading: false,
    });

    const [cancelModal, setCancelModal] = useState({ open: false, loading: false, mode: "confirm" });
    const [tooLate, setTooLate] = useState(false);

    // Wait for Firebase auth
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
            if (tab) url.searchParams.set("status", tab);
            url.searchParams.set("_ts", String(Date.now()));

            const user = auth.currentUser;
            if (!user) throw new Error("User not authenticated");
            const token = await user.getIdToken();

            const res = await fetch(url.toString(), {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                cache: "no-store",
            });

            const json = await res.json().catch(() => ({}));
            setItems(Array.isArray(json.items) ? json.items : []);

            const user2 = auth.currentUser;
            const token2 = await user2.getIdToken();

            const resSlots = await fetch(
                `${API_BASE}/club/${clubId}/schedule?_ts=${Date.now()}`,
                { headers: { Authorization: `Bearer ${token2}` }, cache: "no-store" }
            );
            const slotsJson = await resSlots.json().catch(() => ({}));
            const slotsArr = Array.isArray(slotsJson?.slots) ? slotsJson.slots : [];
            const current = slotsArr.find((s) => String(s.id) === String(slotId)) || null;

            if (current?.scrimTime) {
                const startMs = current.scrimTime?._seconds
                    ? current.scrimTime._seconds * 1000
                    : new Date(current.scrimTime).getTime();
                const diff = startMs - Date.now();
                setTooLate(Number.isFinite(startMs) && diff < 24 * 60 * 60 * 1000);
            } else {
                setTooLate(false);
            }

        } catch (e) {
            console.error(e);
            setErrMsg("Failed to load requests.");
        } finally {
            setLoading(false);
        }
    }


    useEffect(() => { load(); }, [authed, clubId, slotId, tab]);

    async function doAction(requestId, action) {
        if (!authed || !clubId || !slotId || !requestId) return;
        setErrMsg("");

        const path = `${API_BASE}/club/${clubId}/schedule/${slotId}/requests/${requestId}`;

        try {
            const user = auth.currentUser;
            if (!user) throw new Error("User not authenticated");
            const token = await user.getIdToken();

            const res = await fetch(`${path}?_ts=${Date.now()}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    status: action === "accept" ? "accepted" : "declined",
                }),
                cache: "no-store",
            });


            // Try to read JSON but don't crash if body isn't JSON
            let json = {};
            try {
                json = await res.clone().json();
            } catch { }

            // Handle error either via HTTP status or JSON payload
            if (!res.ok || json?.ok === false) {
                const code =
                    json?.code ||
                    json?.errorCode ||
                    (typeof json?.error === "string" && json.error.includes("SLOT_FULL") && "SLOT_FULL");

                if (code === "SLOT_FULL") {
                    setSlotFullOpen(true);
                    await load(); // keep the item in On hold
                    return;
                }

                // Fallback: try reading text to surface a useful message
                let msg = json?.error;
                if (!msg) {
                    try {
                        msg = await res.text();
                    } catch { }
                }
                throw new Error(msg || "Action failed");
            }

            // success → move to the new tab and refresh
            setTab(action === "accept" ? "accepted" : "declined");
            await load();
        } catch (e) {
            // If authedFetch threw on 409 (or similar), detect SLOT_FULL here as well
            const m = String(e?.message || "");
            if (m.includes("SLOT_FULL") || m.includes("Slot is full")) {
                +      setSlotFullOpen(true);
                await load(); // stay on On hold
                return;
            }

            console.error(e);
            setErrMsg(m || "Action failed.");
            await load(); // restore list just in case
        } finally {
            setConfirmAction({ open: false, requestId: null, action: null, loading: false });
        }
    }

    async function cancelSlot() {
        if (!authed || !clubId || !slotId) return;

        // If < 24h → show a popup with the "not allowed" message (no confirm buttons)
        if (tooLate) {
            setCancelModal({ open: true, loading: false, mode: "blocked" });
            return;
        }

        // If ≥ 24h → show the normal confirm/cancel popup
        setCancelModal({ open: true, loading: false, mode: "confirm" });
    }



    async function confirmCancel() {
        if (!authed || !clubId || !slotId) return;
        try {
            setCancelModal((p) => ({ ...p, loading: true }));

            const user = auth.currentUser;
            if (!user) throw new Error("User not authenticated");
            const token = await user.getIdToken();

            const res = await fetch(
                `${API_BASE}/club/${encodeURIComponent(clubId)}/schedule/${encodeURIComponent(slotId)}?_ts=${Date.now()}`,
                {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            const json = await res.json().catch(() => ({}));

            if (!res.ok || json?.ok === false) {
                throw new Error(json?.error || "Cancel failed");
            }

            setCancelModal({ open: false, loading: false });
            router.back();
        } catch (e) {
            console.error(e);
            setErrMsg(e.message || "Cancel failed.");
            setCancelModal({ open: false, loading: false });
        }
    }

    return (
        <>
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
            <div className="relative z-10 pointer-events-auto">
                <LeftSidebar role="club" active="profile" userId={clubId} clubDynamic />
            </div>

            <main
                className="relative z-10 pt-8 pointer-events-auto font-barlow"
                style={{ marginLeft: SIDEBAR_WIDTH + 20, marginRight: 24 }}
            >
                <div className="mx-auto w-full max-w-7xl">
                    <h1 className="text-6xl font-bold text-[#FCCC22] mb-6 mt-9 text-center ">
                        GAMERS’ REQUESTS
                    </h1>

                    <section className="bg-[#1c1430] rounded-xl p-6 md:p-8">

                        <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
                            {/* left side: Cancel button */}
                            <button
                                type="button"
                                onClick={cancelSlot}
                                className="rounded-md bg-[#FCCC22] text-[#0C0817] text-2xl font-bold px-4 py-2 hover:opacity-90 active:opacity-80"
                            >
                                Cancel time slot
                            </button>

                            {/* right side: tabs */}
                            <div
                                className="flex gap-6"
                                role="tablist"
                                aria-label="Request filters"
                            >
                                {["on_hold", "accepted", "declined"].map((key) => (
                                    <button
                                        key={key}
                                        role="tab"
                                        aria-selected={tab === key}
                                        onClick={() => setTab(key)}
                                        className={tab === key ? TAB_ACTIVE : TAB}
                                        type="button"
                                    >
                                        {key.replace("_", " ").replace(/^\w/, (c) => c.toUpperCase())}
                                    </button>
                                ))}
                            </div>
                        </div>


                        {errMsg && (
                            <div className="mt-4 text-red-300 font-semibold bg-[#2b1f47] border border-red-400/30 px-4 py-2 rounded">
                                {errMsg}
                            </div>
                        )}

                        <div
                            className="mt-6 rounded-lg border border-[#3b2d5e] bg-[#1C1633]/40 min-h-[140px] min-w-[200]"
                            style={{ maxHeight: "36rem", overflowY: "auto" }}
                        >
                            {loading ? (
                                <div className="p-6">
                                    <div className="animate-pulse h-10 rounded bg-[#120c23]" />
                                </div>
                            ) : items.length === 0 ? (
                                <div className="p-6 text-gray-500 text-xl font-bold">
                                    No requests in this state.
                                </div>
                            ) : (
                                <ul className="divide-y divide-[#3b2d5e]">
                                    {items.map((r) => (
                                        <li key={r.id} className="p-0"> {/* p-0 since inner row has its own padding */}
                                            <div className="flex items-center justify-between gap-4">
                                                {/* Left: avatar + text (same as PersonRow) */}
                                                <div className="flex items-center gap-6 px-6 py-5 rounded-lg hover:bg-[#1C1633]/60 transition min-w-0">
                                                    <div className="relative h-24 w-24 rounded-full overflow-hidden bg-[#1C1633] border-3 border-[#5f4a87] shadow-[0_0_12px_#5f4a87]">
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

                                                {/* Right: actions (keep your styles) */}
                                                {tab === "on_hold" && (
                                                    <div className="flex items-center gap-2 shrink-0 pr-6">
                                                        <button
                                                            type="button"
                                                            onClick={() => setConfirmAction({ open: true, requestId: r.id, action: "accept", loading: false })}
                                                            className="bg-green-400/90 text-xl text-[#1c1430] font-bold px-4 py-2 rounded hover:shadow-[0_0_14px_rgba(74,222,128,0.6)] transition"
                                                        >
                                                            Accept
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() => setConfirmAction({ open: true, requestId: r.id, action: "decline", loading: false })}
                                                            className="bg-red-400/90 text-xl text-[#1c1430] font-bold px-4 py-2 rounded hover:shadow-[0_0_14px_rgba(248,113,113,0.6)] transition"
                                                        >
                                                            Decline
                                                        </button>
                                                    </div>
                                                )}

                                            </div>
                                        </li>


                                    ))}
                                </ul>
                            )}
                            {/* Slot Full Alert — same style as DateAlert */}
                            {slotFullOpen && (
                                <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 z-[2147483647]">
                                    <div className="bg-[#1C1633] text-white p-6 rounded-xl shadow-2xl w-[350px] text-center">
                                        <p className="text-lg font-bold mb-4 text-red-500">
                                            Acceptnce Limit  </p>
                                        <p className="text-sm text-gray-300 mb-6">
                                            This slot is already full. You cannot accept more gamers.
                                        </p>
                                        <div className="flex w-full">
                                            <button
                                                onClick={() => setSlotFullOpen(false)}
                                                className="flex-1 bg-[#5f4a87] hover:bg-[#7a66c7] px-4 py-2 rounded text-sm"
                                            >
                                                OK
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {confirmAction.open && (
                                <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 z-50">
                                    <div className="bg-[#1C1633] text-white p-6 rounded-xl shadow-2xl w-[350px] text-center">
                                        <p className="text-lg font-bold mb-4">
                                            {confirmAction.action === "accept"
                                                ? "Are you sure you want to accept this request?"
                                                : "Are you sure you want to decline this request?"}
                                        </p>

                                        <div className="flex w-full space-x-2">
                                            <button
                                                onClick={async () => {
                                                    try {
                                                        setConfirmAction((p) => ({ ...p, loading: true }));
                                                        await doAction(confirmAction.requestId, confirmAction.action);
                                                        setConfirmAction({ open: false, requestId: null, action: null, loading: false });
                                                    } catch (e) {
                                                        // keep same behavior as your other modals; adjust if you show alerts
                                                        setConfirmAction({ open: false, requestId: null, action: null, loading: false });
                                                    }
                                                }}
                                                disabled={confirmAction.loading}
                                                className="w-1/2 bg-[#4682B4] hover:neon-btn-blue px-3 py-1 rounded text-sm"
                                            >
                                                Yes
                                            </button>

                                            <button
                                                onClick={() => setConfirmAction({ open: false, requestId: null, action: null, loading: false })}
                                                className="w-1/2 bg-gray-500 hover:neon-btn-gray px-4 py-2 rounded text-sm"
                                            >
                                                No
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
                                onClick={() => router.back()}
                            >
                                Back
                            </button>
                        </div>


                        {cancelModal.open && (
                            <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 z-[2147483647]">
                                <div className="bg-[#1C1633] text-white p-6 rounded-xl shadow-2xl font-barlow text-center w-[430px]">
                                    {cancelModal.mode === "blocked" ? (
                                        <>
                                            <h2 className="text-2xl font-bold mb-4 text-red-500 justify-center">Cancellation not allowed</h2>
                                            <p className="text-xl text-gray-300 mb-6 justify-center">
                                                Cancellation not allowed within 24 hours of the start time.
                                            </p>
                                            <div className="flex w-full">
                                                <button
                                                    onClick={() => setCancelModal({ open: false, loading: false, mode: "confirm" })}
                                                    className="flex-1 bg-[#5f4a87] hover:bg-[#7a66c7] px-4 py-2 rounded text-xl"
                                                >
                                                    OK
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="text-2xl font-bold mb-3 text-red-400 text-center"
                                            >Are you sure you want to cancel time slot?</div>
                                            <p className="text-2xl text-gray-300 mb-6 text-center font-bold">
                                                This will delete the slot and all related requests/acceptances.
                                            </p>
                                            <div className="flex gap-3">
                                                <button
                                                    onClick={confirmCancel}
                                                    className="flex-1 bg-red-600 hover:bg-red-500 px-4 py-2 rounded text-2xl text-center font-bold"
                                                    disabled={cancelModal.loading}
                                                >
                                                    {cancelModal.loading ? "Cancelling..." : "Cancel slot"}
                                                </button>
                                                <button
                                                    onClick={() => setCancelModal({ open: false, loading: false, mode: "confirm" })}
                                                    className="flex-1 bg-gray-500 hover:bg-gray-400 px-4 py-2 rounded text-2xl text-center font-bold"
                                                    disabled={cancelModal.loading}
                                                >
                                                    Keep slot
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}
                    </section>
                </div>
            </main>
        </>
    );
}