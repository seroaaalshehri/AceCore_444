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
            px-5 py-4  z-[200] 
          "
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

        </div>
      )}
    </div>
  );
}