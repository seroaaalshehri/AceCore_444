"use client";
import React from "react";
import { motion } from "framer-motion";

export default function AboutUs() {
  return (
    <section
      className="
        relative w-full min-h-[700px]
        flex items-center justify-center
        px-6 md:px-16
        z-10
      "
    >
      {/* SINGLE COLUMN CENTERED CONTENT */}
      <div
        className="
          max-w-3xl
          flex flex-col justify-center
          items-center
          text-center
        "
      >
        {/* Heading */}
        <motion.h2
          className="text-4xl md:text-5xl font-bold text-white mb-8 tracking-wide [text-shadow:0_0_6px_#a394c9]"
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          About Us
        </motion.h2>

        {/* Description */}
        <motion.p
          className="text-xl md:text-2xl text-gray-300 leading-relaxed mb-10 [text-shadow:0_0_6px_#a394c9]"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
        >
          AceCore is the ultimate esports hub that connects gamers and clubs in
          one place. We make it easy to showcase your skills in scheduled scrim
          arenas, get ranked fairly, and get noticed by top clubs faster. Follow
          clubs, stay updated on their events, watch live streams, and
          collaborate with global talent. AceCore is where you grow, compete,
          and level up your esports journey.
        </motion.p>

        {/* Vision Heading */}
        <motion.h2
          className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-wide [text-shadow:0_0_6px_#a394c9]"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          Our Vision
        </motion.h2>

        {/* Vision Paragraph */}
        <motion.p
          className="text-xl md:text-2xl text-gray-300 leading-relaxed [text-shadow:0_0_6px_#a394c9]"
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
        >
          At AceCore, our vision is to shape the future of esports by creating a
          global stage where every gamer has a chance to shine, every club can
          thrive, and the esports world grows stronger together. We imagine a
          world where talent is discovered faster, opportunities are open to
          everyone, and esports becomes a truly inclusive community.
        </motion.p>
      </div>
    </section>
  );
}