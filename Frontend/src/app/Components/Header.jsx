"use client";
import React from "react";
import { Navbar, IconButton, Collapse, Button } from "@material-tailwind/react";



export function NavbarDefault() {
  const [openNav, setOpenNav] = React.useState(false);

  const navItems = ["Home", "AboutUs", "Clubs", "ContactUs"];

  return (
    <div className="w-full flex items-center justify-between relative">
      {/* Desktop Navbar */}
      <div className="relative w-full">
  {/* Navbar (centered absolutely) */}
  <nav className="hidden lg:flex absolute left-1/2 -translate-x-1/2 
    bg-[#0C0C1D] rounded-full max-w-[700px]
    shadow-[0_0_15px_#5f4a87,0_0_12px_rgba(95,74,135,0.5)]
    px-5 lg:px-12 py-3 items-center justify-center">
    
    <ul className="flex flex-row gap-10 text-lg font-medium">
      {navItems.map((item, i) => (
        <li key={i}>
          <a href="#" className="neon-white hover:neon-gold">
            {item}
          </a>
        </li>
      ))}
    </ul>
  </nav>
</div>

      {/* Mobile Hamburger on Right */}
      <div className="lg:hidden flex justify-end w-full pr-6">
        <IconButton
          variant="filled"
          className="bg-[#1a1a2e] text-white p-2 rounded-md"
          onClick={() => setOpenNav(!openNav)}
          ripple={false}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none"
            className="h-6 w-6" viewBox="0 0 24 24"
            stroke="currentColor" strokeWidth={2}>
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
            {/* Close Button on Left Inside */}
            <div className="flex justify-start p-4">
              <IconButton
                variant="text"
                className="text-white hover:bg-transparent"
                onClick={() => setOpenNav(false)}
                ripple={false}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none"
                  className="h-6 w-6" viewBox="0 0 24 24"
                  stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </IconButton>
            </div>

            {/* Nav Links */}
            <ul className="flex flex-col gap-6 text-lg font-medium px-6">
              {navItems.map((item, i) => (
                <li key={i}>
                  <a
                    href="#"
                    className="neon-white hover:neon-gold block"
                    onClick={() => setOpenNav(false)}
                  >
                    {item}
                  </a>
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
    </div>
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


export function GetStartedbtn() {
  return (
    <Button
      size="md"
      className=" md:inline-block bg-[#FCCC22] text-[#313166] px-6 py-2 text-base rounded-lg hover:neon-btn-goldGetstarted"
    >
      <span>Get Started</span>
    </Button>
  );
}
