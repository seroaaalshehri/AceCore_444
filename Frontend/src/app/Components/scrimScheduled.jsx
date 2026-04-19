"use client";

import React from "react";

function toDate(v) {
  if (!v) return null;
  if (v._seconds) return new Date(v._seconds * 1000);
  if (typeof v === "string") return new Date(v);
  if (v instanceof Date) return v;
  return null;
}

function fmtDate(d) {
  if (!d) return "-";
  return d.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
}
function fmtTime(d) {
  if (!d) return "--:--";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}


export default function scrimScheduled({
  id,
  title,
  cover,
  status,
  scrimType,
  start,
  end,
  clubName,
  rightAction,
  onCardClick,
}) {
  const dStart = toDate(start);
  const dEnd = toDate(end);

  return (
    <div
      role="button"
      onClick={onCardClick}
      className="w-150 h-150 rounded-xl shadow-md bg-[#1d1530] border border-[#1f2430] overflow-hidden flex flex-col relative hover:shadow-[0_0_12px_#fccc22aa] hover:border-[#fccc22aa] transition-all"
    >
      {/* Header image */}
      {cover ? (
        <img src={cover} alt={"Game pic"} className="w-full h-60 object-cover" />
      ) : (
        <div className="w-full h-60 bg-[#2b2142]" />
      )}

      {/* Body */}
      <div className="p-4 flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white text-[20px] truncate">{ clubName || "—"} {"-"} {title || "Scrim"}</span>
            <span
              className={`uppercase text-xs px-2 py-0.5 rounded ${
                status === "ended"
                  ? "bg-[#A1222F]/20 text-red-500"
                  : "bg-yellow-500/20 text-yellow-300"
              }`}
            >
              {status}
            </span>
          </div>


          <div className="mt-1 text-gray-300 text-[15px] leading-snug">
       
            <div>
              {fmtDate(dStart)} · {fmtTime(dStart)}{dEnd ? `–${fmtTime(dEnd)}` : ""}
            </div>
            <div className="opacity-90">
              {scrimType || "—"} 
            </div>
           
          </div>
        </div>

       
        {rightAction ? (
          <div className="flex-shrink-0 mt-10">{rightAction}</div>
        ) : (
          <div className="flex-shrink-0">
            <button
              className="px-3 py-2 rounded bg-[#FCCC22] text-[#0C0817] font-semibold text-sm "
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              View
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
