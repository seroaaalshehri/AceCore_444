"use client";
import React, { useState } from "react";
import PageTransition from "./components/PageTransition";
import { NavbarDefault, SignUpIn } from "./Components/Header";
import Image from "next/image";
import Particles from "./Components/Particles";
import ContactUs from "./Components/ContactUs";
import AboutUs from "./Components/AboutUs";

import HomeContent from "./Components/HomeContent";


export default function Home() {
  const [activeSection, setActiveSection] = useState("home");
  const [redirect, setRedirect] = useState(null);

  if (redirect) return <BlackHoleRedirect to={redirect} />;

  return (
    <PageTransition>
      {(handleNavigate) => (
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
            <a href="/" className="flex items-center">
              <Image
                src="/AC-glow.png"
                alt="Logo"
                width={130}
                height={140}
                className="object-contain"
              />
            </a>

            <NavbarDefault
              onNavigate={(section) => setActiveSection(section)}
              activeSection={activeSection}
            />
            <SignUpIn
              onSignIn={() => handleNavigate("/Signin")}
              onSignUp={() => handleNavigate("/SignUp")}
            />
          </header>

          {/* Main Content */}
          {activeSection === "home" && (
            <HomeContent onGetStarted={() => handleNavigate("/SignUp")} />
          )}
          {activeSection === "about" && <AboutUs />}
         
          {activeSection === "contact" && <ContactUs />}
        </div>
      )}
    </PageTransition>
  );
}
