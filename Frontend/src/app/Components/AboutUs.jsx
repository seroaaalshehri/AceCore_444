"use client";
import React from "react";
import { motion } from "framer-motion";
import Lottie from "lottie-react";
import metaverseAnimation from "../../../public/Global Gaming.json";

export default function AboutUs() {
  return (
    <section className="relative w-full min-h-[700px] flex flex-row justify-between items-center px-6 md:px-16 z-10">
      
      {/* LEFT SIDE: TEXT - SHIFTED RIGHT FOR BETTER BALANCE */}
      <div className="flex-1 max-w-2xl flex flex-col justify-start mt-20 ml-[80px] md:ml-[290px]">
        {/* Heading */}
        <motion.h2
          className="md:text-5xl font-bold text-white mb-6 tracking-wide text-left [text-shadow:0_0_6px_#a394c9]"
          initial={{ x: -30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          About Us
        </motion.h2>

        {/* Description */}
        <motion.p
          className="md:text-2xl text-gray-300 leading-relaxed text-left [text-shadow:0_0_6px_#a394c9] mb-10"
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
        >
          AceCore is the ultimate esports hub that connects gamers and clubs in one place. 
          We make it easy to showcase your skills in scheduled scrim arenas, get ranked fairly, 
          and get noticed by top clubs faster. Follow clubs, stay updated on their events, 
          watch live streams, and collaborate with global talent. AceCore is where you grow, 
          compete, and level up your esports journey.
        </motion.p>

        {/* Vision Heading */}
        <motion.h2
          className="md:text-5xl font-bold text-white mb-4 tracking-wide text-left [text-shadow:0_0_6px_#a394c9]"
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          Our Vision
        </motion.h2>

        {/* Vision Paragraph */}
        <motion.p
          className="md:text-2xl text-gray-300 leading-relaxed text-left [text-shadow:0_0_6px_#a394c9]"
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
        >
          At AceCore, our vision is to shape the future of esports by creating a global stage 
          where every gamer has a chance to shine, every club can thrive, and the esports 
          world grows stronger together. We imagine a world where talent is discovered faster, 
          opportunities are open to everyone, and esports becomes a truly inclusive community.
        </motion.p>
      </div>

      {/* RIGHT SIDE: ANIMATION */}
     <motion.div className="absolute bottom-12 right-[15rem] flex flex-row gap-10 items-end">
       <div className="w-[420px] h-[420px]">
      <Lottie animationData={metaverseAnimation} loop initialSegment={[30, 90]} />
    </div>
      </motion.div>
    </section>
  );
}
