"use client";
import React, { useState, useEffect } from "react";
import { IconButton, Button } from "@material-tailwind/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";

export function NavbarDefault({ onNavigate, activeSection }) {
  const [openNav, setOpenNav] = useState(false);
  const pathname = usePathname();

  const [currentSection, setCurrentSection] = useState(activeSection || "home");

  useEffect(() => {
    if (activeSection) setCurrentSection(activeSection);
  }, [activeSection]);

  const navItems = [
    { name: "home", label: "Home" },
    { name: "about", label: "AboutUs" },

    { name: "contact", label: "ContactUs" },
  ];

  return (
    <>
      {/* Desktop Navbar */}
    <nav className="hidden lg:flex items-center justify-center px-12 py-5 rounded-full bg-[#0C0C1D]/70 backdrop-blur-md shadow-[0_0_15px_#5f4a87,0_0_25px_rgba(95,74,135,0.5)] gap-14">
  {navItems.map((item) => (
    <Link
      key={item.name}
      href="#"
      onClick={() => {
        setCurrentSection(item.name);
        onNavigate(item.name);
      }}
      className={`relative px-4 py-2 text-xl font-bold transition-all duration-200 rounded-md ${
        currentSection === item.name
          ? "text-[#FCCC22] drop-shadow-[0_0_10px_#FCCC22] after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-[4px] after:bg-[#FCCC22] after:shadow-[0_0_10px_#FCCC22] after:rounded-full"
          : "text-white hover:text-[#FCCC22] hover:drop-shadow-[0_0_8px_#FCCC22]"
      }`}
    >
      {item.label}
    </Link>
  ))}
</nav>

      {/* Mobile Sidebar */}
      {openNav && (
        <div>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setOpenNav(false)}
          />
          <div className="fixed top-0 right-0 w-64 h-full bg-[#0C0C1D] shadow-lg z-50 flex flex-col">
            <div className="flex justify-start p-4">
              <IconButton
                variant="text"
                className="text-white hover:bg-transparent"
                onClick={() => setOpenNav(false)}
                ripple={false}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  className="h-6 w-6"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </IconButton>
            </div>

            {/* Nav Links */}
            <ul className="flex flex-col gap-6 text-lg font-medium px-6">
              {navItems.map((item) => (
                <li key={item.name}>
                  <Link
                    href="#"
                    onClick={() => {
                      setCurrentSection(item.name);
                      onNavigate(item.name);
                      setOpenNav(false);
                    }}
                    className={`block w-full px-3 py-2 rounded-md ${
                      currentSection === item.name
                        ? "text-yellow-400 bg-[#1a1a2e]"
                        : "neon-white hover:neon-gold"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Auth Buttons */}
            <div className="mt-auto flex flex-col gap-3 p-6">
              {pathname !== "/Signin" && pathname !== "/SignUp" && (
                <>
                  <Link href="/Signin">
                    <Button
                      size="md"
                      className="w-full bg-[#E3E3EDFF] text-[#313166] hover:neon-btn-white"
                    >
                      Log In
                    </Button>
                  </Link>
                  <Link href="/SignUp">
                    <Button
                      size="md"
                      className="w-full bg-[#161630] text-[#E3E3EDFF] hover:neon-btn-indigo"
                    >
                      Sign Up
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function SignUpIn({ onSignIn, onSignUp }) {
  return (
    <div className="hidden lg:flex items-center gap-x-2 transition-opacity duration-300">
      <Button
        size="sm"
        onClick={onSignIn} 
        className="bg-[#E3E3EDFF] text-[#313166] px-4 py-2 text-sm rounded-md hover:neon-btn-white"
      >
        SignIn
      </Button>

      <Button
        size="sm"
        onClick={onSignUp} 
        className="bg-[#161630] text-[#E3E3EDFF] px-4 py-2 text-sm rounded-md hover:neon-btn-indigo"
      >
        SignUp
      </Button>
    </div>
  );
}