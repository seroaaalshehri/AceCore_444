"use client";
import { useEffect, useState } from "react";

export default function BlackHoleLayout({ children }) {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Show content after animation finishes
    const t = setTimeout(() => setShowContent(true), 1600);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="relative min-h-screen">
      {!showContent && <BlackHoleOverlay />}
      <div
        className={`transition-opacity duration-700 ${
          showContent ? "opacity-100" : "opacity-0"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

function BlackHoleOverlay() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-[#0C0C1D]">
      {/* Expanding radial wave */}
      <div className="absolute w-0 h-0 rounded-full bg-[#0C0C1D] animate-expand" />

      {/* Black hole spinner */}
      <div className="relative w-40 h-40 flex items-center justify-center">
        <div className="absolute w-full h-full rounded-full border-8 border-transparent border-t-purple-500 border-r-purple-700 animate-spin-slow blur-sm"></div>
        <div className="w-28 h-28 bg-black rounded-full shadow-[0_0_40px_20px_rgba(90,0,150,0.4)]"></div>
      </div>

      <style jsx global>{`
        @keyframes spin-slow {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
        @keyframes expand {
          0% {
            width: 0;
            height: 0;
            opacity: 0.7;
          }
          100% {
            width: 250vmax;
            height: 250vmax;
            opacity: 1;
          }
        }
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
        .animate-expand {
          animation: expand 1.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
