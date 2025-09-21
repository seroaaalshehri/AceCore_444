"use client";
import React from "react";
import {
  Navbar,
  IconButton,
  Collapse,
  Button,
} from "@material-tailwind/react";

// ------------------ Navbar Component ------------------
export function NavbarDefault() {
  const [openNav, setOpenNav] = React.useState(false);

  React.useEffect(() => {
    const handleResize = () => window.innerWidth >= 960 && setOpenNav(false);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const navList = (
    <ul className="flex flex-col lg:flex-row justify-center items-center gap-10 text-lg font-medium w-full">
      {["Home", "AboutUs", "Clubs", "ContactUs"].map((item, i) => (
        <li key={i}>
          <a
            href="#"
            className="neon-white hover:neon-gold"
          >
            {item}
          </a>
        </li>
      ))}
    </ul>
  );

  return (
    <Navbar className="bg-[#0C0C1D] rounded-full mx-auto max-w-[700px] shadow-[0_0_15px_#5f4a87,0_0_12px_rgba(95,74,135,0.5)] px-5 lg:px-12 py-3 flex items-center justify-between">
    
     <div className="flex flex-1 justify-center items-center">
        {navList}
      </div>

      {/* Menu Toggle */}
      <IconButton
        variant="text"
        className="absolute right-4 h-6 w-6 text-white hover:bg-transparent lg:hidden "
        onClick={() => setOpenNav(!openNav)}
        ripple={false}
      >
        {openNav ? (
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
        ) : (
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
        )}
      </IconButton>

      {/* Mobile Menu */}
      <Collapse open={openNav}>
        <div className="flex flex-col  items-center gap-6 py-6">
          {navList}
        </div>
      </Collapse>
    </Navbar>
  );
}

// ------------------ Sign In / Sign Up btns ------------------  
export function SignUpIn() {
  return (
    <div className="flex items-center gap-x-1">
      <Button size="md" className="hidden lg:inline-block bg-[#E3E3EDFF] text-[#313166] hover:neon-btn-white">
        <span>Log In</span>
      </Button>
      <Button
        size="md"
        className="hidden lg:inline-block bg-[#161630] text-[#E3E3EDFF] hover:neon-btn-indigo"
      >
        <span>Sign up</span>
      </Button>
    </div>
  );
}

export function GetStartedbtn() {
  return (
    <Button
      size="lg"
      className="hidden lg:inline-block bg-[#FCCC22] text-[#313166] hover:neon-btn-goldGetstarted"
    >
      <span>Get started</span>
    </Button>
  );
}
