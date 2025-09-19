
"use client";
import React from "react";
import {
  Navbar,
  MobileNav,
  Typography,
  Button,
  IconButton,
  Collapse 
} from "@material-tailwind/react";
 
// ------------------ Navbar Component ------------------
export function NavbarDefault() {
  const [openNav, setOpenNav] = React.useState(false);
 
  React.useEffect(() => {
    window.addEventListener(
      "resize",
      () => window.innerWidth >= 960 && setOpenNav(false),
    );
  }, []);
 
  const navList = (
    <ul className="mt-2 mb-4 flex flex-col gap-2 lg:mb-0 lg:mt-0 lg:flex-row lg:items-center lg:gap-6 ">
      <Typography
        as="li"
        variant="small"
        className="flex items-center gap-x-2 p-1 font-medium text-[#E3E3ED]"
      >
        <a href="#" className="flex items-center neon-white">
          Home
        </a>
      </Typography>
      <Typography
        as="li"
        variant="small"
        className="flex items-center gap-x-2 p-1 font-medium text-[#E3E3ED]"
      >
       
        <a href="#" className="flex items-center neon-white ">
          Clubs
        </a>
      </Typography>
      <Typography
        as="li"
        variant="small"
        className="flex items-center gap-x-2 p-1 font-medium text-[#E3E3ED]"
      >
        <a href="#" className="flex items-center neon-white">
          About us
        </a>
      </Typography>
     
    </ul>
  );
 
  return (
    <Navbar className="mx-auto max-w-2xl px-4 py-2 lg:px-8 lg:py-4 bg-[#161630] flex items-center ">
   <div className="container mx-auto flex justify-center">
        <Typography
          as="a"
          href="#"
          className="mr-4 cursor-pointer py-1.5 font-medium "
        >
         
        </Typography>
            <div className="hidden lg:block">{navList}</div>
      
        <IconButton
          variant="text"
          className="ml-auto h-6 w-6 text-inherit hover:bg-transparent focus:bg-transparent active:bg-transparent lg:hidden "
          ripple={false}
          onClick={() => setOpenNav(!openNav)}
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
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          )}
        </IconButton>
      </div>
      <Collapse open={openNav}>
        <div className="container mx-auto">
          {navList}
          <div className="flex items-center gap-x-1">
            <Button fullWidth variant="text" size="sm" className="">
              <span>Log In</span>
            </Button>
            <Button fullWidth variant="gradient " size="sm" className="">
              <span>Sign in</span>
            </Button>
          </div>
        </div>
      </Collapse>
    </Navbar>
    
  ); 


  }
// ------------------ Sign In / Sign Up btns ------------------  
  export function SignUpIn(){
    return(  
        <div className="flex items-center gap-x-1">
          <Button size="sm" className="hidden lg:inline-block bg-[#E3E3EDFF] text-[#313166] hover:hover:neon-btn-white">
            <span>Log In</span>
          </Button>
          <Button
            size="sm"
            className="hidden lg:inline-block bg-[#161630] text-[#E3E3EDFF] hover:neon-btn-indigo"
          >
            <span>Sign up</span>
          </Button>
        </div>);
}
