"use client";

import { useState, useEffect, useRef  } from "react";
import { FaInfoCircle } from "react-icons/fa";

export default function CodInfoTooltip() {
  const [open, setOpen] = useState(false);
  const hideTimer = useRef(null);

  function handleEnter() {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
    setOpen(true);
  }

  function handleLeave() {
    hideTimer.current = setTimeout(() => {
      setOpen(false);
    }, 400);
  }
  useEffect(() => {
    if (open) {
      const previous = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = previous;
      };
    }
  }, [open]);

  return (
    <div
      className="relative inline-block"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <button
        type="button"
        className="flex items-center justify-center w-6 h-6 rounded-full border border-[#FCCC22]/80 bg-[#FCCC22] text-[#1d1530] text-l shadow-[0_0_10px_rgba(252,204,34,0.6)]"
        aria-label="Call of Duty scoring info"
      >
        <FaInfoCircle />
      </button>

      {open && (
        <div
          className="
            absolute right-0 top-full mt-3
            w-[420px] max-w-[min(90vw,420px)] max-h-[70vh]
    overflow-y-auto
            rounded-xl border border-[#FCCC22]/60
            bg-[#1d1530] text-white
            shadow-[0_10px_30px_rgba(0,0,0,0.75)]
            px-5 py-4 z-[50000]
          "
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: "#FCCC22 #0C0817",
          }}
        >
          <h3 className="text-[25px] font-semibold text-[#FCCC22] mb-3">
            AceCore Scoring System:
          </h3>

          <ul className="list-disc list-inside space-y-1 text-[20px] leading-relaxed">
            <li><strong>S</strong> - Score of 90 or above.</li>
            <li><strong>A</strong> - Score between 80–89.</li>
            <li><strong>B</strong> - Score between 70–79.</li>
            <li><strong>C</strong> - Score between 60–69.</li>
            <li><strong>D</strong> - Score between 45–59.</li>
            <li><strong>E</strong> - Score below 45.</li>
            <li><strong>NE</strong> (Not Evaluated) - Appears for new users who have not played any scrim arena yet.</li>
          </ul>

          <h3 className="text-[25px] font-semibold text-[#FCCC22] mb-3">
            Which Call of Duty games and modes are supported?
          </h3>

          <p className="text-[20px] leading-relaxed mb-2">
            Our scoring works only for objective-based Call of Duty multiplayer
            modes, not Battle Royale.
          </p>

          <p className="text-[20px] leading-relaxed mb-2">
            We support modes like Hardpoint, Domination, Control and similar
            objective modes in the latest Modern Warfare and Black Ops titles,
            as long as the final scoreboard shows:
          </p>

          <ul className="list-disc list-inside space-y-1 text-[20px] leading-relaxed mb-3">
            <li>Eliminations</li>
            <li>Deaths</li>
            <li>Objective score</li>
            <li>Match result (Win / Loss)</li>
          </ul>

          <p className="text-[20px] leading-relaxed">
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