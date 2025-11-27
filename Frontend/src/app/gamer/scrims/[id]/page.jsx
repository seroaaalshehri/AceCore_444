"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import Particles from "../../../Components/Particles";
import LeftSidebar from "../../../Components/LeftSidebar";
import GamerRequestStatus from "../../../Components/GamerRequestStatus";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../../../../lib/firebaseClient";
import { authedFetch } from "../../../../../lib/authedFetch";
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000/api";


const GOLD_BTN =
    "bg-[#FCCC22] text-[#0C0817] font-bold px-6 py-2 rounded-md text-2xl " +
    "disabled:opacity-60 hover:opacity-90 active:opacity-80 transition-shadow";


// fixed game tabs
const GAME_TABS = [
    { id: "all", label: "All" },
    { id: "cod", label: "Call of Duty" },
    { id: "ow", label: "Overwatch" },
    { id: "rl", label: "Rocket League" },
];

// optional banner images if you have them (safe to leave empty)
const COVER_BY_GAME = {
    cod: "/covers/cod-cover.jpg",
    ow: "/covers/ow-cover.jpg",
    rl: "/covers/rl-cover.jpg",
};

function toDate(ts) {
    return ts?._seconds ? new Date(ts._seconds * 1000) : new Date(ts);
}

/* ---------- owner guard (same as profile) ---------- */
function useOwnerGuard() {
    const router = useRouter();
    const params = useParams();
    const routeId = Array.isArray(params?.id) ? params.id[0] : params?.id;
    const [ready, setReady] = React.useState(false);

    React.useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (fbUser) => {
            if (!fbUser) {
                router.replace(`/Signin?next=${encodeURIComponent(location.pathname)}`);
                return;
            }
            try {
                const res = await authedFetch("http://localhost:4000/api/users/me");
                if (res.status === 401) {
                    router.replace(`/Signin?next=${encodeURIComponent(location.pathname)}`);
                    return;
                }
                const data = await res.json();
                const meId = data?.user?.id;
                const currentId = decodeURIComponent(routeId || "");
                if (!meId || meId !== currentId) {
                    router.replace(`/gamer/profile/${meId || ""}`);
                    return;
                }
                setReady(true);
            } catch {
                router.replace("/Signin");
            }
        });
        return () => unsub && unsub();
    }, [router, routeId]);

    return ready;
}

/* ---------- page ---------- */
export default function ScrimSchedulePage() {
    const { id } = useParams();
    const USER_ID = Array.isArray(id) ? id[0] : id;
    const ready = useOwnerGuard();
    const [games, setGames] = React.useState([]);
    const [slots, setSlots] = React.useState([]);
    const [activeGame, setActiveGame] = React.useState("all");
    const [loading, setLoading] = React.useState(true);
const [blockedModal, setBlockedModal] = React.useState(false);
    const [cancelModalOpen, setCancelModalOpen] = React.useState(false);
    const [selectedSlot, setSelectedSlot] = React.useState(null);
    // Global feedback card (success or 24h error)
    const [feedback, setFeedback] = React.useState(null); // { type: 'success'|'error', message: string }

const openCancelModal = (slot) => {
    const now = new Date();
    const scrimDate = new Date(slot.scrimTime._seconds * 1000);
    const hoursDiff = (scrimDate - now) / (1000 * 60 * 60);

    if (hoursDiff < 24) {
        setBlockedModal(true);
        return;
    }

    setSelectedSlot({ ...slot, id: slot.scrimId || slot.id });
    setCancelModalOpen(true);
};

    const closeCancelModal = () => {
        setSelectedSlot(null);
        setCancelModalOpen(false);
    };

    const confirmCancel = async () => {
        if (!selectedSlot) return;

        const now = new Date();
        const scrimDate = new Date(selectedSlot.scrimTime._seconds * 1000);
        const hoursDiff = (scrimDate - now) / (1000 * 60 * 60);

        if (hoursDiff < 24) {
            // Close modal and show 24h error card
            closeCancelModal();
            setFeedback({ type: "error", message: "Cancellation not allowed within 24 hours of the start time." });
            return;
        }

        try {
            const q = new URLSearchParams();
            if (selectedSlot.slotId) q.set("slotId", selectedSlot.slotId);
            if (selectedSlot.clubId) q.set("clubId", selectedSlot.clubId);
            const res = await authedFetch(
                `${API_BASE}/gamer/${USER_ID}/scrim-appointments/${selectedSlot.id}?${q.toString()}`,
                { method: "DELETE" }
            );

            if (res.ok) {
                setSlots(slots.filter((s) => (s.scrimId || s.id) !== selectedSlot.id));
                closeCancelModal();
                setFeedback({ type: "success", message: "Successfully canceled." });
            } else {
                let msg = "Failed to cancel scrim.";
                try {
                    const err = await res.json();
                    if (err?.code === "TOO_CLOSE") msg = "Cancellation not allowed within 24 hours of the start time.";
                    else if (err?.code === "FORBIDDEN") msg = "You can only cancel your own scrim appointments.";
                    else if (err?.code === "NOT_FOUND") msg = "Scrim appointment not found.";
                    else if (err?.code === "NOT_ACCEPTED") msg = "Only accepted scrims can be canceled.";
                } catch { }
                if (msg.includes("24 hours")) {
                    // 24h rule -> show error card
                    closeCancelModal();
                    setFeedback({ type: "error", message: msg });
                } else if (msg.includes("Only accepted scrims")) {
                    // Keep as alert or show as card; we'll show as alert per current UX
                    alert(msg);
                    closeCancelModal();
                } else {
                    alert(msg);
                    closeCancelModal();
                }
            }
        } catch (e) {
            console.error(e);
            alert("Error canceling scrim.");
            closeCancelModal();
        }
    };


    React.useEffect(() => {
        if (!ready || !USER_ID) return;

        let cancelled = false;
        setLoading(true);

        (async () => {
            try {
                const url = new URL(`${API_BASE}/gamer/${USER_ID}/scrims`);
                url.searchParams.set("status", "accepted");
                if (activeGame !== "all") url.searchParams.set("gameid", activeGame);

                const res = await authedFetch(url.toString(), { cache: "no-store" });
                const json = await res.json().catch(() => ({}));
                if (!cancelled) {
                    setSlots(Array.isArray(json?.items) ? json.items : []);
                }
            } catch (e) {
                if (!cancelled) setSlots([]);
                console.error("fetch scrims failed:", e);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => { cancelled = true; };
    }, [ready, USER_ID, activeGame]);

    React.useEffect(() => {
        if (!ready || !USER_ID) return;
        (async () => {
            try {
                const res = await authedFetch(`${API_BASE}/gamer/${USER_ID}/gamesGames`);
                const json = await res.json().catch(() => ({}));
                setGames(Array.isArray(json?.items || json?.games) ? (json.items || json.games) : []);
            } catch (e) {
                console.error("fetch games failed:", e);
                setGames([]);
            }
        })();
    }, [ready, USER_ID]);
    const gameMetaById = React.useMemo(() => {
        return Object.fromEntries(
            games.map(g => [
                g.id,
                {
                    name: g.gameName || g.name || g.id,
                    photo: g.scrimPhoto || g.gamePhoto || g.image || g.imageUrl || g.coverUrl || ""
                }
            ])
        );
    }, [games]);

    const tabs = React.useMemo(() => {
        return [{ id: "all", label: "All" }].concat(
            games.map(g => ({ id: g.id, label: g.gameName || g.name || g.id }))
        );
    }, [games]);

    const bannerUrl = activeGame !== "all" ? (gameMetaById[activeGame]?.photo || "") : "";


    const filteredSlots =
        activeGame === "all" ? slots : slots.filter((s) => (s.gameid || s.gameId) === activeGame);
    const sortedSlots = [...filteredSlots].sort((a, b) => {
        const aT = a.scrimTime?._seconds ? a.scrimTime._seconds * 1000 : new Date(a.scrimTime).getTime();
        const bT = b.scrimTime?._seconds ? b.scrimTime._seconds * 1000 : new Date(b.scrimTime).getTime();
        return aT - bT;
    });

    if (!ready) return <div className="text-gray-400 p-6">Loading…</div>;

    return (
        <div className="flex min-h-screen">
            {/* Left sidebar */}
            <div className="w-[250px]">
                <LeftSidebar role="gamer" active="scrims" userId={USER_ID} />
            </div>

            {/* Content area */}
            <div className="flex-1 flex flex-col bg-[acecoreBackground] font-barlow overflow-x-hidden">
                <div className="relative w-full min-h-screen">
                    {/* Particles */}
                    <div className="fixed inset-0 z-0 h-full">
                        <Particles
                            particleColors={["#ffffff", "#ffffff"]}
                            particleCount={200}
                            particleSpread={10}
                            speed={0.1}
                            particleBaseSize={100}
                            moveParticlesOnHover={false}
                            alphaParticles={false}
                            disableRotation={false}
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,0.75fr)_150px] gap-30 items-start pr-2 mt-9 pt-7 ml-10">

                        {/* LEFT column: schedule card -> buttons -> accepted cards */}
                        <div className="flex flex-col gap-6">



                            <div className="flex items-baseline justify-center">
                                <h1 className="text-5xl font-bold text-[#fccc22] ">SCRIM ARENA APPOINTMENTS</h1>
                            </div>
                            <div className="text-gray-300 text-[18px] mt-4" />


                            <div className="flex flex-wrap justify-center gap-4 relative z-10">
                                {tabs.map((g) => (
                                    <button
                                        key={g.id}
                                        type="button"
                                        onClick={() => setActiveGame(g.id)}
                                        className={`px-5 py-2 rounded-md text-xl font-semibold transition
        ${activeGame === g.id
                                                ? "bg-[#FCCC22] text-[#0C0817]"
                                                : "bg-[#2b2142] text-white hover:bg-[#3a2b57]"}`}
                                    >
                                        {g.label}
                                    </button>
                                ))}
                            </div>
                            {activeGame !== "all" && bannerUrl && (
                                <section className="w-full max-w-[820px] rounded-xl overflow-hidden shadow-lg bg-[#19112c] mx-auto mt-4">
                                    <img
                                        src={bannerUrl}
                                        alt={tabs.find(t => t.id === activeGame)?.label || "Game cover"}
                                        className="w-full h-48 object-cover"
                                    />
                                </section>
                            )}

                            {/* Accepted scrims (no extra wrapper card; just cards themselves) */}
                            <div>


                                {loading ? (
                                    <div className="mt-4 text-center text-gray-400 text-xl">Loading...</div>
                                ) : filteredSlots.length === 0 ? (
                                    <div className="mt-4 flex items-center justify-center text-gray-40 text-3xl font-semibold">
                                        No accepted scrims{activeGame !== "all" ? " for this game" : ""}.
                                    </div>
                                ) : (
                                                    <div className="mb-9">
                                    <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-12 mx-auto max-w-[820px]">
                                        {sortedSlots.map((s) => {
                                            const gid = s.gameid || s.gameId;
                                            const gmeta = gid ? gameMetaById[gid] : null;
                                            const photo = s.gamePhoto || gmeta?.photo || ""; // backend might already supply gamePhoto
                                            const gname = s.gameName || gmeta?.name || gid?.toUpperCase?.() || "Scrim";
                                            const start = toDate(s.scrimTime || s.startTime || s.start || s.startAt);
                                            const end = toDate(s.scrimEndTime || s.endTime || s.end || s.endAt);

                                            return (
                                                <div key={s.id}
                                                    className="relative rounded-xl border border-[#3b2d5e] overflow-hidden hover:shadow-lg transition ">
                                                    {/* OPAQUE PAINT LAYER */}
                                                    <div className="absolute inset-0 bg-[#1c1430]"></div>

                                                    {/* CONTENT LAYER */}
                                                    <div className="relative p-6 flex items-center gap-4">
                                                        <div className="min-w-0">
                                                            <h4 className="text-3xl font-bold text-[#FCCC22] mb-1 truncate">{gname}</h4>
                                                            <div className="text-white text-2xl mb-1 font-bold truncate">{s.clubName || s.clubId}</div>
                                                            <div className="text-white text-2xl font-bold truncate">{s.scrimType}</div>
                                                            <div className="mt-2 text-white font-bold text-2xl">
                                                                {!isNaN(start) && (
                                                                    <>
                                                                        {start.toLocaleDateString("en-US", { month: "short", day: "numeric" })}{" | "}
                                                                    </>
                                                                )}
                                                                {isNaN(start)
                                                                    ? "-"
                                                                    : start.toLocaleTimeString([], {
                                                                        hour: "2-digit",
                                                                        minute: "2-digit",
                                                                        hour12: true,
                                                                    })}
                                                                {" – "}
                                                                {isNaN(end)
                                                                    ? "-"
                                                                    : end.toLocaleTimeString([], {
                                                                        hour: "2-digit",
                                                                        minute: "2-digit",
                                                                        hour12: true,
                                                                    })}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => openCancelModal(s)}
                                                        className={`relative bottom-3 mb-2 left-6 text-2xl font-bold ${GOLD_BTN}`}
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>

                                            );
                                        })}
  </div>
                                    </div>

                                )}
                            </div>

                        </div>

                        {/* RIGHT column (unchanged) */}
                        <div className="lg:w-[560px] lg:ml-auto lg:mr-2 lg:sticky lg:top-6">
                            <div className="flex justify-center gap-3 mb-3 -ml-40 ">
                                <h2 className="text-5xl font-bold text-[#fccc22]">MY REQUESTS</h2>
                            </div> <div className="-ml-10 mt-10">
                                <GamerRequestStatus gamerId={USER_ID} />
                            </div> </div>
                    </div>


                </div>
            </div>
            {cancelModalOpen && selectedSlot && (
                <div className="fixed inset-0 flex font-barlow items-center justify-center bg-black bg-opacity-60 z-50">
                    <div className="bg-[#1d1530] rounded-xl p-6 w-100 relative text-left" dir="ltr">
                        <p className="text-3xl font-bold flex justify-center mb-4 text-red-400">Warning!</p>
                        <p className="text-2xl font-bold text-white flex justify-center mb-2">
                            Are you sure you want to cancel this appointment?
                        </p>
                        <p className="text-base text-xl font-bold text-white-300 flex justify-center mb-4">
                            This action is permanent and cannot be undone
                        </p>
                        <div className="flex w-full space-x-2 mt-4">
                            <button
                                onClick={confirmCancel}
                                className="w-1/2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-2xl text-white font-bold"
                            >
                                Cancel appointment
                            </button>
                            <button
                                onClick={closeCancelModal}
                                className="w-1/2 bg-gray-500 hover:bg-gray-600 px-4 py-2 rounded text-2xl text-white font-bold"
                            >
                                Keep appointment
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {blockedModal && (
    <div className="fixed font-barlow inset-0 flex justify-center items-center bg-black bg-opacity-50 z-[9999]">
        <div className="bg-[#1C1633] text-white p-6 rounded-xl shadow-2xl text-center w-[380px]">

            <h2 className="text-2xl font-bold mb-4 text-red-500 flex justify-center">
                Cancellation not allowed
            </h2>

            <p className="text-xl text-gray-300 mb-6 flex justify-center">
                Cancellation not allowed within 24 hours of the start time.
            </p>

            <div className="flex w-full">
                <button
onClick={() => setBlockedModal(false)}
                    className="flex-1 bg-[#5f4a87] hover:bg-[#7a66c7] px-4 py-2 rounded text-xl font-bold"
                >
                    OK
                </button>
            </div>

        </div>
    </div>
)}

        </div>
    );
}