"use client";
import { motion } from "framer-motion";

export default function HomeContent({ onGetStarted }) {
  return (
    <div
      className="
        relative w-full
        min-h-[720px] md:min-h-[820px]
        flex justify-center items-center
        z-10 px-4
      "
    >
      {/* Inner content wrapper */}
      <motion.div
        className="max-w-4xl flex flex-col items-center text-center"
        initial={{ opacity: 0, y: -40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        {/* BIG headline */}
        <h2
          className="
            text-5xl md:text-7xl
            font-extrabold
            text-white mb-8
            tracking-wide
            leading-tight
            [text-shadow:0_0_12px_#a394c9]
          "
        >
          Showcase your <span>GAMING SKILLS!</span>
        </h2>

        {/* Bigger subtext */}
        <motion.h3
          className="
            text-2xl md:text-3xl
            text-gray-300
            leading-relaxed
            mb-12
            [text-shadow:0_0_8px_#a394c9]
          "
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
        >
          Level up your skills, join clubs, and team up with pro gamers.
        </motion.h3>

        {/* Button – keep it light */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.6, ease: "backOut" }}
        >
          <button
            onClick={onGetStarted}
            className="
              bg-[#FCCC22] text-[#313166] font-bold
              px-10 py-4
              rounded-lg
              text-lg
              text-base
              shadow-[0_0_10px_#FCCC22]
              hover:shadow-[0_0_20px_#FCCC22]
              hover:scale-105
              transition-all duration-200
            "
          >
            GET STARTED
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}