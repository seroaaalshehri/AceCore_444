"use client";
import React from "react";
import { authedFetch } from "../../../lib/authedFetch";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../../lib/firebaseClient";


export function GamerViewClubSlots({ clubId, userGames = [], user }) {
    const [firebaseUser, setFirebaseUser] = React.useState(null);

    React.useEffect(() => {
        const unsub = onAuthStateChanged(auth, (fbUser) => {
            setFirebaseUser(fbUser);
        });
        return () => unsub();
    }, []);

    const isClub = user?.role === "club" || user?.rule === "club";
    const [active, setActive] = React.useState("all");
    const activeGame = React.useMemo(
        () => (active === "all" ? null : userGames.find(g => g.id === String(active) || g.gameid === String(active))),
        [active, userGames]
    );

    const [slots, setSlots] = React.useState([]);

    const tsToDate = (scrimTime) =>
        new Date(scrimTime?._seconds ? scrimTime._seconds * 1000 : Date.parse(scrimTime));

    React.useEffect(() => {
        if (!clubId || !active) return;
        fetchSlots();
    }, [clubId, active]);
    const [feedback, setFeedback] = React.useState({
        open: false,
        title: "",
        message: "",
    });

    const [requestingId, setRequestingId] = React.useState(null); // to disable button while sending
    function openFeedback(title, message) {
        setFeedback({ open: true, title, message });
    }
    const [blockedIds, setBlockedIds] = React.useState(() => new Set());

    function closeFeedback() {
        setFeedback((f) => ({ ...f, open: false }));
    }

    async function fetchSlots() {
        if (!clubId) return;
        const activeParam = active !== "all" ? `gameid=${encodeURIComponent(activeGame?.gameid || active)}&` : "";
        const fromDate = new Date(); fromDate.setHours(0, 0, 0, 0);
        const toDate = new Date(); toDate.setDate(toDate.getDate() + 7); toDate.setHours(23, 59, 59, 999);

        const url = `http://localhost:4000/api/club/${clubId}/schedule?${activeParam}from=${fromDate.toISOString()}&to=${toDate.toISOString()}`;

        try {
            const res = await fetch(url);
            const data = await res.json();
            setSlots(data?.slots || []);
        } catch (err) {
            console.error("fetchSlots error:", err);
        }
    }

    async function sendRequest(slotId) {
        if (!firebaseUser?.uid) {
            openFeedback("Login required", "Please sign in to send a request.");

            return;
        }
        console.log("User role:", user?.role, "rule:", user?.rule);


        try {
            setRequestingId(slotId);

            const url = `http://localhost:4000/api/gamer/${clubId}/schedule/${slotId}/request`;

            const res = await authedFetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ gamerId: firebaseUser.uid }),
            });

            let data = {};
            try { data = await res.clone().json(); } catch { }

            if (!res.ok || data?.success === false) {
                const msg = data?.message || "Something went wrong.";

                let title = "Request failed";
                if (/already/i.test(msg)) title = "Already requested";
                else if (/limit/i.test(msg)) title = "Daily limit reached";
                else if (/conflict/i.test(msg)) title = "Time conflict";
                else if (/expired/i.test(msg)) title = "Slot unavailable";

                openFeedback(title, msg);
                return;
            }

            openFeedback("Request sent", "Your request has been sent.");
        } catch (e) {
            console.error("sendRequest error:", e);
            openFeedback("Network error", "Please check your connection and try again.");
        } finally {
            setRequestingId(null);
        }
    }

    const groupedSlots = slots.reduce((acc, slot) => {
        const ms = slot.scrimTime?._seconds
            ? slot.scrimTime._seconds * 1000
            : Date.parse(slot.scrimTime);
        const d = new Date(ms);
        const dateKey = d.toLocaleDateString([], {
            weekday: "short",
            month: "short",
            day: "numeric",
        });
        if (!acc[dateKey]) acc[dateKey] = [];
        acc[dateKey].push(slot);
        return acc;
    }, {});

    return (
        <div>

            <div className="p-6 mt-0 px-4 sm:px-6 lg:px-14 mx-auto w-full grid grid-cols-1 relative z-[100] gap-8">
                <div className="flex items-center justify-between mb-6 -mt-5 ">
                    <h1 className="text-5xl font-bold text-[#fccc22] -ml-6">SCRIM ARENAS SCHEDULE</h1>
                    <div className="-mr-10">
                        <div className="flex gap-3">
                            <button
                                onClick={() => setActive("all")}
                                className={`px-4 py-2 rounded-md text-xl font-semibold ${active === "all"
                                    ? "bg-[#FCCC22] text-[#0C0817]"
                                    : "bg-[#2b2142] text-white hover:bg-[#3a2b57]"
                                    }`}
                            >
                                All
                            </button>

                            {userGames.map((g) => (
                                <button
                                    key={g.id}
                                    onClick={() => setActive(g.id)}
                                    className={`px-4 py-2 rounded-md text-xl font-semibold ${active === g.id
                                        ? "bg-[#FCCC22] text-[#0C0817]"
                                        : "bg-[#2b2142] text-white hover:bg-[#3a2b57]"
                                        }`}
                                >
                                    {g.gameName}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {activeGame && (
                    <div className="relative w-[107.5%] -ml-[3.5%] rounded-xl overflow-hidden shadow-md -mt-4 mb-4 z-10">
                        <img
                            src={activeGame.scrimPhoto}
                            alt={activeGame.gameName}
                            className="w-full h-64 object-cover"
                        />
                        <div className="absolute inset-0 flex items-center px-10
            bg-gradient-to-r
            from-[#0A0810FF]/95 from-0%
            via-[#110D1AFF]/65 via-35%
            to-transparent to-90%">
                            <div>
                                <h2 className="text-4xl font-bold text-white">{activeGame.gameName}</h2>
                                <p className="text-[#BE1728FF] font-extrabold text-xl
               [text-shadow:0_0_0.5px_gray]
               [-webkit-text-stroke:0.3px_#270406FF]">  You can request up to 3 scrims per day</p>
                            </div>
                        </div>
                    </div>
                )}

                {slots.length > 0 && (
                    <div className="flex flex-col -mt-2 space-y-10">
                        {Object.entries(groupedSlots)
                            .filter(([_, slots]) => {
                                const now = new Date();
                                return slots.some(slot => {
                                    const start = tsToDate(slot.scrimTime);
                                    const diffHours = (start - now) / (1000 * 60 * 60);
                                    return diffHours > 24;
                                });
                            })

                            .sort(([a], [b]) => new Date(a) - new Date(b))
                            .map(([dateStr, slots]) => (

                                <div
                                    key={dateStr}
                                    className="flex items-center relative left-[48px]"
                                >
                                    <div className="-ml-20">
                                        <div className="w-[200px] flex-shrink-0 text-[#fccc22] font-extrabold text-[34px] flex justify-end pr-6 tracking-wide">
                                            {dateStr}
                                        </div>
                                    </div>

                                    <div className="absolute left-[120px] h-[90px] w-[2.5px] bg-[#7a68b9] rounded-full opacity-70"></div>

                                    <div className="ml-7 flex flex-wrap gap-4">
                                        {slots
                                            .filter((slot) => {
                                                const start = tsToDate(slot.scrimTime);
                                                const now = new Date();

                                                const diffMs = start.getTime() - now.getTime();

                                                const diffHours = diffMs / (1000 * 60 * 60);

                                                return diffHours > 24;
                                            })

                                            .sort((a, b) => tsToDate(a.scrimTime) - tsToDate(b.scrimTime))
                                            .map((slot) => {
                                                const start = tsToDate(slot.scrimTime).toLocaleTimeString([], {
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                });
                                                const end = slot.scrimEndTime
                                                    ? tsToDate(slot.scrimEndTime).toLocaleTimeString([], {
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                    })
                                                    : null;

                                                return (
                                                    <div
                                                        key={slot.id}
                                                        className="relative flex items-center justify-between bg-[#231a3b] border border-[#3a2f56] rounded-xl px-5 py-5 "
                                                        style={{
                                                            width: "300px",
                                                            height: "125px",
                                                        }}
                                                    >
                                                        <div className="flex flex-col leading-tight">
                                                            <span className="text-[#fccc22] font-bold text-2xl">
                                                                {start} – {end}
                                                            </span>
                                                            <div className="flex flex-row gap-5 leading-tight">
                                                                <span className="text-white text-2xl mt-1">
                                                                    {slot.scrimType}
                                                                </span>
                                                                <span className="text-gray-300 text-xl mt-1 ml-3">

                                                                    Max {slot.maxGamers} requests
                                                                </span>
                                                                 </div>
                                <span className="text-white text-2xl ">{slot.gameName}</span>

                                                                <button
                                                                    onClick={() => !isClub && sendRequest(slot.id)}
                                                                    disabled={isClub || requestingId === slot.id}
                                                                    className={`w-[77px] h-[38px] absolute bottom-4 right-4 text-[20px] font-bold rounded-md ${isClub || requestingId === slot.id
                                                                        ? "bg-[#c3a322] text-[#0C0817] opacity-70 cursor-not-allowed"
                                                                        : "bg-[#FCCC22] text-[#0C0817] hover:opacity-80"
                                                                        } transition-transform`}
                                                                >
                                                                    {isClub ? "Locked" : requestingId === slot.id ? "..." : "Request"}
                                                                </button>
                                                                {feedback.open && (
                                                                    <div className="fixed inset-0 flex justify-center items-center  z-[2147483647]">
                                                                        <div className="bg-[#1C1633] text-white p-6 rounded-xl shadow-2xl w-[420px] text-center">
                                                                            <p
                                                                                className={`text-2xl font-bold mb-4 ${feedback.title.toLowerCase().includes("failed") ||
                                                                                    feedback.title.toLowerCase().includes("already")
                                                                                    ? "text-red-500"
                                                                                    : "text-[#FCCC22]"
                                                                                    }`}
                                                                            >
                                                                                {feedback.title}
                                                                            </p>
                                                                            <p className="text-xl text-gray-300 mb-6">{feedback.message}</p>
                                                                            <div className="flex w-full">
                                                                                <button
                                                                                    onClick={closeFeedback}
                                                                                    className="flex-1 bg-[#5f4a87] hover:bg-[#7a66c7] px-4 py-2 rounded text-xl"
                                                                                >
                                                                                    OK
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                )}

                                                            </div>
                                                        </div>
                                                    
                                                );
                                            })}
                                    </div>
                                </div>
                            ))}
                    </div>
                )}
            </div>
        </div>
    );

}