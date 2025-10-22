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
                                <h1 className="text-5xl font-bold text-[#fccc22] ">SCRIM ARENA APPOINTMNTS</h1>
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
                                                    <div className="absolute inset-0 bg-[#1c1430] "></div>

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
                                                </div>

                                            );
                                        })}

                                    </div>

                                )}
                            </div>

                        </div>

                        {/* RIGHT column (unchanged) */}
                        <div className="lg:w-[560px] lg:ml-auto lg:mr-2 lg:sticky lg:top-6">
                            <div className="flex justify-center gap-3 mb-3 -ml-40 ">
                                <h2 className="text-5xl font-bold text-[#fccc22]">MY REQUESTS</h2>
                            </div> <div className="-ml-10 mt-10">
                            <GamerRequestStatus gamerId={USER_ID}/>
                        </div> </div>
                    </div>


                </div>
            </div>
        </div>
    );
}