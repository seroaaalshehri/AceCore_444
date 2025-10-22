"use client";

import { useEffect, useState } from "react";
import { authedFetch } from "../../../lib/authedFetch";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000/api";

/* Tabs identical to FollowLists (underline style) */
const TAB =
    "px-3 py-2 text-2xl font-bold border-b-2 border-transparent text-[#dee1e6] hover:text-[#FCCC22] hover:border-[#FCCC22] transition-colors";
const TAB_ACTIVE =
    "px-3 py-2 text-2xl font-bold border-b-2 border-[#FCCC22] text-[#FCCC22]";
const ROW_LG =
    "flex items-center gap-5 px-5 py-4 rounded-lg hover:bg-[#1C1633]/60 transition min-w-0";
const AVATAR_LG =
    "relative h-20 w-20 rounded-full overflow-hidden bg-[#1C1633] border-3 border-[#5f4a87] shadow-[0_0_12px_#5f4a87]";
const NAME_LG = "text-white text-[20px] font-bold truncate";
const META_LG = "text-[18px] text-gray-300 truncate";


function fmt(scrimTime, scrimEndTime) {
  const start = scrimTime?._seconds
    ? new Date(scrimTime._seconds * 1000)
    : new Date(scrimTime);
  const end = scrimEndTime?._seconds
    ? new Date(scrimEndTime._seconds * 1000)
    : new Date(scrimEndTime);

  const dateStr = isNaN(start)
    ? "-"
    : start.toLocaleDateString("en-US", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
      });

  const startStr = isNaN(start)
    ? "-"
    : start.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });

  const endStr = isNaN(end)
    ? "-"
    : end.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });

  return `${dateStr} | ${startStr} – ${endStr}`;
}



export default function GamerRequestStatus({ gamerId }) {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState("on_hold"); // "all" | "on_hold" | "accepted" | "declined"

    useEffect(() => {
        if (!gamerId) return;

        (async () => {
            setLoading(true);
            try {
                const url = new URL(`${API_BASE}/gamer/${gamerId}/scrims`);
                if (tab !== "all") url.searchParams.set("status", tab);

                url.searchParams.set("_ts", String(Date.now())); // cache-bust

                const res = await authedFetch(url.toString(), { cache: "no-store" });
                const json = await res.json().catch(() => ({}));

                if (json?.success === false) {
                    console.error("Gamer requests API error:", json?.error);
                    setItems([]);                // show empty state if API errored
                } else {
                    setItems(Array.isArray(json.items) ? json.items : []);
                }
            } catch (e) {
                console.error("Gamer requests fetch failed:", e);
                setItems([]);
            } finally {
                setLoading(false);
            }
        })();
    }, [gamerId, tab]);


    const filtered = tab === "all" ? items : items.filter((i) => i.status === tab);
const sorted = [...filtered]
  .filter((s) => s.scrimTime) 
  .sort((a, b) => {
    const aTime = a.scrimTime?._seconds
      ? a.scrimTime._seconds * 1000
      : new Date(a.scrimTime).getTime();
    const bTime = b.scrimTime?._seconds
      ? b.scrimTime._seconds * 1000
      : new Date(b.scrimTime).getTime();
    return aTime - bTime; 
  });

    return (
        //Outer section (top-level purple card)
                 <div className="-ml-25 mr-9">
        <section className="bg-[#1c1430] rounded-xl p-6 md:p-8 mr-20 -ml-12 w-[100%] border border-[#3b2d5e]
">      
            <div className="flex justify-center gap-3 pb-3  border-[#3b2d5e] ">

                <div className="flex gap-6" role="tablist" aria-label="Request filters">
                    <button
                        role="tab"
                        aria-selected={tab === "all"}
                        onClick={() => setTab("all")}
                        className={tab === "all" ? TAB_ACTIVE : TAB}
                        type="button"
                    >
                        All
                    </button>
                    <button
                        role="tab"
                        aria-selected={tab === "on_hold"}
                        onClick={() => setTab("on_hold")}
                        className={tab === "on_hold" ? TAB_ACTIVE : TAB}
                        type="button"
                    >
                        On hold
                    </button>
                    <button
                        role="tab"
                        aria-selected={tab === "accepted"}
                        onClick={() => setTab("accepted")}
                        className={tab === "accepted" ? TAB_ACTIVE : TAB}
                        type="button"
                    >
                        Accepted
                    </button>
                    <button
                        role="tab"
                        aria-selected={tab === "declined"}
                        onClick={() => setTab("declined")}
                        className={tab === "declined" ? TAB_ACTIVE : TAB}
                        type="button"
                    >
                        Declined
                    </button>
                </div>
            </div>

            <div
                className="mt-4 rounded-lg border border-[#3b2d5e] bg-[#19112c]"
            >
                {loading ? (
                    <div className="p-6">
                        <div className="animate-pulse h-10 rounded bg-[#120c23]" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="p-6 text-gray-500 text-xl font-bold">No requests in this state.</div>
                ) : (
                    <ul className="divide-y divide-[#3b2d5e]">
                        {sorted.map((r) => {
                            const timeDisplay = fmt(r.scrimTime, r.scrimEndTime);
                            return (
                                <li key={r.id} className="p-0">
                                    <div className="flex justify-between items-center hover:bg-[#1C1633]/60 transition">
                                        <div className={ROW_LG}>
                                            <div className={AVATAR_LG}>
                                                <img
                                                    src={r.clubPhoto || "/avatar-fallback.png"}
                                                    alt={r.clubName || r.clubId}
                                                    className="h-full w-full object-cover"
                                                />
                                            </div>

                                            <div className="min-w-0">
                                                <div className={NAME_LG}>{r.clubName || r.clubId}</div>
                                                <div className={META_LG}>
                                                    {(r.gameName ? `${r.gameName} · ` : "")}
                                                    {r.scrimType}
                                                </div>
                                                <div className={META_LG}>{timeDisplay}</div>
                                            </div>
                                        </div>

                                        <div className="text-[18px] pr-6 ">
                                            {r.status === "on_hold" && (
                                                <span className="text-yellow-300 font-semibold">On hold</span>
                                            )}
                                            {r.status === "accepted" && (
                                                <span className="text-green-300 font-semibold">Accepted</span>
                                            )}
                                            {r.status === "declined" && (
                                                <span className="text-red-300 font-semibold">Declined</span>
                                            )}
                                        </div>
                                    </div>
                                </li>
                            );
                        })}

                    </ul>


                )}
            </div> 
        </section> </div>
    );
}