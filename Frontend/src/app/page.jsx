"use client";
import React, { useState, useEffect } from "react";
import { NavbarDefault, SignUpIn } from "./Components/Header";
import Image from "next/image";
import Particles from "./Components/Particles";
import { motion } from "framer-motion";
import ContactUs from "./Components/ContactUs";
import AboutUs from "./Components/AboutUs";
import Clubs from "./Components/Clubs";
import HomeContent from "./Components/HomeContent";

export default function Home() {
  const [activeSection, setActiveSection] = useState("home");
  useEffect(() => {
    const savedSection = localStorage.getItem("activeSection");
    if (savedSection) setActiveSection(savedSection);
  }, []);

  useEffect(() => {
    localStorage.setItem("activeSection", activeSection);
  }, [activeSection]);


  return (
    <div className="relative min-h-screen mt-10 bg-[acecoreBackground] font-barlow overflow-x-hidden">
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
        <NavbarDefault
          onNavigate={setActiveSection}
          activeSection={activeSection}
        />

        {/* Right: Buttons */}
        <SignUpIn />
      </header>

      {/* Main Content (Switching Sections) */}
      {activeSection === "home" && <HomeContent />}
      {activeSection === "about" && <AboutUs />}
      {activeSection === "clubs" && <Clubs />}
      {activeSection === "contact" && <ContactUs />}
    </div>
  );
}
