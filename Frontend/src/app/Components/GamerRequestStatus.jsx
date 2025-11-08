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
const GOLD_BTN = "bg-[#FCCC22] text-[#0C0817] font-bold px-4 py-1 rounded-md text-[19px] disabled:opacity-60 hover:opacity-90 active:opacity-80 transition-shadow";

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
    const [confirmState, setConfirmState] = useState({ open: false, req: null, busy: false })

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

    const onCancelOnHold = (req) => {
        if (!req?.id || !req?.clubId || !req?.slotId) return;
        setConfirmState({ open: true, req, busy: false });
    };

    const closeConfirm = () => setConfirmState({ open: false, req: null, busy: false });

    const confirmDelete = async () => {
        const req = confirmState.req;
        if (!req) return;
        try {
            setConfirmState((s) => ({ ...s, busy: true }));
            const url = new URL(`${API_BASE}/gamer/${gamerId}/scrim-requests/${req.id}`);
            url.searchParams.set('clubId', String(req.clubId));
            url.searchParams.set('slotId', String(req.slotId));
            const res = await authedFetch(url.toString(), { method: 'DELETE' });
            if (res.ok) {
                setItems((prev) => prev.filter((x) => x.id !== req.id));
                closeConfirm();
            } else {
                let msg = 'Failed to delete request.';
                try {
                    const err = await res.json();
                    if (err?.code === 'NOT_ON_HOLD') msg = 'Only on-hold requests can be deleted.';
                    else if (err?.code === 'FORBIDDEN') msg = 'You can only delete your own request.';
                    else if (err?.code === 'NOT_FOUND') msg = 'Request not found.';
                } catch {}
                if (typeof window !== 'undefined') alert(msg);
                setConfirmState((s) => ({ ...s, busy: false }));
            }
        } catch (e) {
            console.error('Delete on-hold request error:', e);
            if (typeof window !== 'undefined') alert('Error deleting request.');
            setConfirmState((s) => ({ ...s, busy: false }));
        }
    };

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
            <section className="bg-[#1c1430] rounded-xl p-6 md:p-8 mr-20 -ml-12 w-[100%] border border-[#3b2d5e]">
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

                                            <div className="text-[22px] pr-6 ">
                                                {r.status === "on_hold" && (
                                                <div className="flex flex-col items-center gap-3">
                                                    <span className="text-yellow-300 font-semibold">On hold</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => onCancelOnHold(r)}
                                                        className={GOLD_BTN}
                                                        title="Cancel this pending request"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
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
            </section> 
             <ConfirmOverlay
                    open={confirmState.open}
                    busy={confirmState.busy}
                    onConfirm={confirmDelete}
                    onClose={closeConfirm}
                />
            </div>
    );
}

export function ConfirmOverlay({ open, busy, onConfirm, onClose }) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 flex font-Arial items-center justify-center bg-black bg-opacity-60 z-[70]">
            <div className="bg-[#1d1530] rounded-xl p-6 w-100 relative text-left" dir="ltr">
                <p className="text-3xl font-bold flex justify-center mb-4 text-red-400">Warning!</p>
                <p className="text-2xl font-bold text-white flex justify-center mb-2">
                    Are you sure you want to cancel this request?
                </p>
                <p className="text-base text-xl font-bold text-white-300 flex justify-center mb-4">
                    This action is permanent and cannot be undone
                </p>
                <div className="flex w-full space-x-2 mt-4">
                    <button
                        onClick={onConfirm}
                        disabled={busy}
                        className="w-1/2 bg-red-600 hover:bg-red-700 disabled:opacity-60 px-4 py-2 rounded text-2xl text-white font-bold"
                    >
                        {busy ? 'Canceling…' : 'Cancel request'}
                    </button>
                    <button
                        onClick={onClose}
                        disabled={busy}
                        className="w-1/2 bg-gray-500 hover:bg-gray-600 disabled:opacity-60 px-4 py-2 rounded text-2xl text-white font-bold"
                    >
                        Keep request
                    </button>
                </div>
            </div>
        </div>
    );
}