// Components/CodInfoTooltip.tsx
"use client";

import { useState } from "react";
import { FaInfoCircle } from "react-icons/fa";

export default function CodInfoTooltip() {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      {/* yellow info icon */}
      <button
        type="button"
        className="flex items-center justify-center w-5 h-5 rounded-full border border-[#FCCC22]/80 bg-[#FCCC22] text-[#1d1530] text-l shadow-[0_0_10px_rgba(252,204,34,0.6)]"
        aria-label="Call of Duty scoring info"
      >
        <FaInfoCircle />
      </button>

      {/* tooltip / dialog – now appears BELOW the card title, not above */}
      {open && (
        <div
          className="
            absolute left-0 top-full mt-3
            w-[420px] max-w-[min(90vw,420px)]
            rounded-xl border border-[#FCCC22]/60
            bg-[#1d1530] text-white
            shadow-[0_10px_30px_rgba(0,0,0,0.75)]
            px-5 py-4 z-[50]
          "
        >
          <h3 className="text-[20px] font-semibold text-[#FCCC22] mb-3">
            Which Call of Duty games and modes are supported?
          </h3>

          <p className="text-[15px] leading-relaxed mb-2">
            Our scoring works only for objective-based Call of Duty multiplayer
            modes, not Battle Royale.
          </p>

          <p className="text-[15px] leading-relaxed mb-2">
            We support modes like Hardpoint, Domination, Control and similar
            objective modes in the latest Modern Warfare and Black Ops titles,
            as long as the final scoreboard shows:
          </p>

          <ul className="list-disc list-inside space-y-1 text-[15px] leading-relaxed mb-3">
            <li>Eliminations</li>
            <li>Deaths</li>
            <li>Objective score</li>
            <li>Match result (Win / Loss)</li>
          </ul>

          <p className="text-[15px] leading-relaxed">
            These four values are the only stats our system uses to calculate
            each gamer&apos;s performance and give them a score. Modes that
            don&apos;t show these stats on the results screen are not supported
            for scoring.
          </p>
        </div>
      )}
    </div>
  );
}