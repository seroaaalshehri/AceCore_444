"use client";
import React from "react";
import { Navbar, IconButton, Collapse, Button } from "@material-tailwind/react";

export function NavbarDefault({ onNavigate, activeSection }) {
  const [openNav, setOpenNav] = React.useState(false);

  // use lowercase keys for activeSection matching
  const navItems = [
    { name: "home", label: "Home", href: "#home" },
    { name: "about", label: "AboutUs", href: "#about" },
    { name: "clubs", label: "Clubs", href: "#clubs" },
    { name: "contact", label: "ContactUs", href: "#contact" },
  ];

  return (
   
   <>
      {/* Desktop Navbar with glowing pill container */}
      <nav className="hidden lg:flex items-center justify-center px-8 py-3 rounded-full bg-[#0C0C1D]/70 backdrop-blur-md shadow-[0_0_12px_#5f4a87,0_0_20px_rgba(95,74,135,0.4)] gap-10">
        {navItems.map((item) => (
          <button
            key={item.name}
            onClick={() => onNavigate(item.name)}
            className={`relative px-3 py-1 font-bold transition-all duration-200 rounded-md
              ${
                activeSection === item.name
                  ? "text-[#FCCC22] drop-shadow-[0_0_8px_#FCCC22] after:absolute after:bottom-0 after:left-0 after:w-full after:h-[3px] after:bg-[#FCCC22] after:shadow-[0_0_8px_#FCCC22] after:rounded-full"
                  : "text-white hover:text-[#FCCC22] hover:drop-shadow-[0_0_6px_#FCCC22]"
              }`}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {/* Mobile Hamburger on Right */}
      <div className="lg:hidden flex justify-end w-full pr-6">
        <IconButton
          variant="filled"
          className="bg-[#1a1a2e] text-white p-2 rounded-md"
          onClick={() => setOpenNav(!openNav)}
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
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </IconButton>
      </div>

      {/* Slide-in Sidebar Menu (from right) */}
      {openNav && (
        <div>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setOpenNav(false)}
          ></div>

          {/* Sidebar */}
          <div className="fixed top-0 right-0 w-64 h-full bg-[#0C0C1D] shadow-lg z-50 flex flex-col">
            {/* Close Button */}
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
                  <button
                    className={`block text-left w-full px-3 py-2 rounded-md ${
                      activeSection === item.name
                        ? "text-yellow-400 bg-[#1a1a2e]"
                        : "neon-white hover:neon-gold"
                    }`}
                    onClick={() => {
                      onNavigate(item.name);
                      setOpenNav(false);
                    }}
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>

            {/* Buttons at Bottom */}
            <div className="mt-auto flex flex-col gap-3 p-6">
              <Button
                size="md"
                className="w-full bg-[#E3E3EDFF] text-[#313166] hover:neon-btn-white"
              >
                Log In
              </Button>
              <Button
                size="md"
                className="w-full bg-[#161630] text-[#E3E3EDFF] hover:neon-btn-indigo"
              >
                Sign Up
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}



// ------------------ Sign In / Sign Up Buttons (desktop only) ------------------  
export function SignUpIn() {
  return (
    <div className="hidden lg:flex items-center gap-x-2">
      <Button
        size="sm"
        className="bg-[#E3E3EDFF] text-[#313166] px-4 py-2 text-sm rounded-md hover:neon-btn-white"
      >
        <span>LogIn</span>
      </Button>
      <Button
        size="sm"
        className="bg-[#161630] text-[#E3E3EDFF] px-4 py-2 text-sm rounded-md hover:neon-btn-indigo"
      >
        <span>SignUp</span>
      </Button>
    </div>
  );
}


