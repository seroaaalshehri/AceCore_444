"use client";
import { NavbarDefault, SignUpIn } from "./Components/Header";
import React from "react";
import Image from "next/image";
import Particles from "./Components/Particles";
import { motion } from "framer-motion";

export default function Home() {
  return (
    <div className="relative min-h-screen mt-10 bg-[acecoreBackground] font-barlow  overflow-x-hidden">
      {/* Background Particles */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <Particles
          particleColors={["#ffffff", "#ffffff"]}
          particleCount={200}
          particleSpread={10}
          speed={0.1}
          particleBaseSize={100}
          moveParticlesOnHover={false}
          alphaParticles={false}
          disableRotation={false}
        />
      </div>

      {/* Header */}
      <header className="relative flex items-center justify-between px-6 py-4 z-20">
        {/* Left: Logo */}
        <a href="/" className="flex items-center">
          <Image
            src="/AC-glow.png"
            alt="Logo"
            width={130}
            height={140}
            className="object-contain"
          />
        </a>

        {/* Center: Navbar */}
        <div className="absolute left-1/2 -translate-x-1/2">
          <NavbarDefault />
        </div>

        {/* Right: Buttons */}
        <SignUpIn />
      </header>

      {/* Foreground Content */}
      <div className="relative w-full h-[600px] flex flex-col justify-center items-center z-10">
        <motion.h2
          className="md:text-5xl font-bold text-white mb-4 tracking-wide [text-shadow:0_0_6px_#a394c9]"
          initial={{ y: -80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          Showcase your <span>GAMING SKILLS!</span>
        </motion.h2>

        <motion.h3
          className="md:text-4xl text-gray-300 leading-relaxed text-center [text-shadow:0_0_6px_#a394c9]"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
        >
          Level up your skills, join clubs and team up with pro gamers.
        </motion.h3>

        <motion.div
          className="mt-8"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.6, ease: "backOut" }}
        >
          <button
            onClick={() => alert("Get Started clicked!")}
            className="bg-[#FCCC22] text-[#313166] font-bold px-6 py-3 rounded-lg shadow-[0_0_10px_#FCCC22] hover:shadow-[0_0_20px_#FCCC22] hover:scale-105 transition-all duration-200"
          >
            GET STARTED
          </button>
        </motion.div>
      </div>
    </div>
  );
}
