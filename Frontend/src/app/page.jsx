"use client";
import { NavbarDefault, SignUpIn, GetStartedbtn } from "./Components/Header";
import React from "react";
import Image from "next/image";
import Particles from "./Components/Particles";

export default function Home() {
  return (
    <div className="min-h-screen mt-10 bg-[acecoreBackground] font-barlow overflow-x-hidden">

      <header className="flex items-center justify-between ml-5 mr-5 px-6 py-4 z-20 relative">
        <a href="/" className="flex items-center">
          <Image
            src="/AC-glow.png"
            alt="Logo"
            width={100}
            height={110}
            className="object-contain"
          />
        </a>
        <NavbarDefault />
        <SignUpIn />
      </header>

      <div className="relative w-full h-[600px]">
      
        <div className="absolute inset-0 z-0">
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

        {/* Foreground Content */}
        <div className="relative z-10">
          {/* Twitch logo pinned to right */}
          <div className="absolute top-40 right-8">
            <img
              src="/twitch.png"
              alt="Twitch Logo"
              width={130}
              height={110}
            />
          </div>

          {/* Headline */}
          <div className="mt-20 flex justify-center font-barlow">
            <h2 className="text-5xl font-bold text-white mb-4 tracking-wide [text-shadow:0_0_6px_#a394c9]">
              Showcase your GAMING SKILLS!
            </h2>
          </div>

          <div className="flex justify-center mt-5 font-barlow">
            <h3 className="text-4xl text-gray-300 leading-relaxed [text-shadow:0_0_6px_#a394c9]">
              Level up your skills, join clubs and team up with pro gamers.
            </h3>
          </div>

          <div className="flex justify-center mt-5">
            <GetStartedbtn />
          </div>
        </div>
      </div>
    </div>
  );
}
