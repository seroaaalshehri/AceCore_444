"use client";
import React from "react";
import { motion } from "framer-motion";

export default function Clubs() {
  return (
<section className="relative w-full h-[700px] flex flex-col justify-start items-start pl-11 pt-24 z-10">
      <motion.h2
        className="md:text-5xl font-bold text-white mb-20 tracking-wide text-left [text-shadow:0_0_6px_#a394c9]"
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        Clubs
      </motion.h2>

      {/* Optional description to balance layout */}
      <motion.p
        className="md:text-2xl text-gray-300 leading-relaxed text-left max-w-2xl [text-shadow:0_0_6px_#a394c9]"
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
      >
     
      </motion.p>
    </section>
  );
}

