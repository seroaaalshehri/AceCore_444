"use client";
import { useEffect, useState } from "react";

export default function BlackHoleLayout({ children }) {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShowContent(true), 2500); // match animation timing
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="relative min-h-screen">
      {!showContent && <BlackHoleAnimation />}
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

function BlackHoleAnimation() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0C0C1D]">
      <div className="hole">
        <div className="hole__outer"></div>
        <div className="hole__inner"></div>
        <div className="hole__starfield"></div>
        <div className="hole__rings"></div>
      </div>

      <style jsx global>{`
        .hole {
          position: relative;
          width: 200px;
          height: 200px;
          border-radius: 50%;
          overflow: hidden;
          animation: zoom 2s ease-out forwards;
        }

        .hole__outer,
        .hole__inner,
        .hole__starfield,
        .hole__rings {
          position: absolute;
          inset: 0;
          border-radius: 50%;
        }

        .hole__outer {
          background: radial-gradient(circle, #3a0ca3, #0c0c1d 80%);
          filter: blur(30px);
          animation: pulse 2s ease-in-out infinite alternate;
        }

        .hole__inner {
          background: black;
          width: 80%;
          height: 80%;
          top: 10%;
          left: 10%;
          border-radius: 50%;
          box-shadow: 0 0 50px 30px rgba(140, 0, 255, 0.4) inset;
        }

        .hole__starfield {
          background: repeating-radial-gradient(
            circle,
            transparent 0,
            transparent 5px,
            rgba(255, 255, 255, 0.2) 6px
          );
          opacity: 0.3;
          animation: spin 15s linear infinite;
        }

        .hole__rings {
          border: 4px solid rgba(140, 0, 255, 0.3);
          box-shadow: 0 0 30px rgba(140, 0, 255, 0.4);
          animation: spin 10s linear infinite reverse;
        }

        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        @keyframes pulse {
          0% {
            transform: scale(1);
            opacity: 0.6;
          }
          100% {
            transform: scale(1.2);
            opacity: 1;
          }
        }

        @keyframes zoom {
          0% {
            transform: scale(0.5);
            opacity: 0.3;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
