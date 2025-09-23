"use client";
import React, { useState } from "react";
import Image from "next/image";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { format as formatDate, subYears, isAfter } from "date-fns";
import { offset, shift, flip } from "@floating-ui/dom";




export function SignUpIn() {
  const [isActive, setIsActive] = useState(false);
  const [selectedGames, setSelectedGames] = useState([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    name: '',
    gender: ''
  });
  const [birthDate, setBirthDate] = useState(null);
  const MIN_AGE = 16;
const cutoffDate = subYears(new Date(), MIN_AGE); 
const isUnderage = birthDate ? isAfter(birthDate, cutoffDate) : false;
const [dpOpen, setDpOpen] = useState(false);



  return (
    <div className={`container ${isActive ? "active" : ""}`} id="container">
      {/* Sign Up Form (for clubs maybe?) */}
      <div className="form-container club-form">
        <form>
          <h1>Create Account</h1>
          <span>or use your email for registration</span>

          <label htmlFor="name" style={{ display: "block", marginTop: "12px", marginBottom: "4px" }}>
            Name
          </label>
          <input id="name" type="text" placeholder="Enter your name" />

          <label htmlFor="email" style={{ display: "block", marginTop: "12px", marginBottom: "4px" }}>
            Email
          </label>
          <input id="email" type="email" placeholder="Enter your email" />

          <label htmlFor="password" style={{ display: "block", marginTop: "12px", marginBottom: "4px" }}>
            Password
          </label>
          <input id="password" type="password" placeholder="Password" />

          <button type="button">Sign Up</button>
        </form>
      </div>

      {/* Gamer Sign Up Form */}
      <div className="form-container gamer-form ">
        <form>
          <h1>Sign Up as A Gamer</h1>
          
<div className="social-icons flex gap-3 ">
  <a href="#" className="icon">
    <Image src="/googleIcon.svg" alt="Google" width={24} height={24} />
  </a>
  <a href="#" className="icon">
    <Image src="/twitchIcon.svg" alt="Twitch" width={24} height={24} />
  </a>
</div>
          <span className="block text-md text-gray-400 mb-2">
            or use your email password
          </span>

          {/* Username / Email / Password fields */}
          <div className="flex flex-col gap-1 items-start w-full max-w-xs">
            <div className="w-full">
              <label htmlFor="username" className="block text-xs mb-1">
                Username
              </label>
              <input
                id="username"
                type="text"
                placeholder="Enter your username"
                className="w-full p-2 rounded-md bg-gray-800 text-white text-sm hover:shadow-[0_0_12px_#5f4a87] focus:outline-none"
              />
            </div>
<div className="flex gap-3 w-full">
  <div className="w-1/2">
    <label htmlFor="email" className="block text-xs mb-1">
      Email
    </label>
    <input
      id="email"
      type="email"
      placeholder="Enter your email"
      className="w-full p-2 rounded-md bg-gray-800 text-white text-sm 
                 hover:shadow-[0_0_12px_#5f4a87] focus:outline-none"
    />
  </div>

  <div className="w-1/2">
    <label htmlFor="password" className="block text-xs mb-1">
      Password
    </label>
    <input
      id="password"
      type="password"
      placeholder="Enter your password"
      className="w-full p-2 rounded-md bg-gray-800 text-white text-sm 
                 hover:shadow-[0_0_12px_#5f4a87] focus:outline-none"
    />
  </div>
</div>
          </div>

       {/* Gender + Birth Date side by side */}
<div className="flex gap-3 w-full mt-3">
  {/* Gender */}
  <div className="w-1/2">
    <label className="block text-xs mb-1">Gender</label>
    <div className="flex gap-4 mt-5">
      {/* Male */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="radio"
          name="gender"
          value="male"
          className="peer hidden"
        />
        <span
          className="
            w-4 h-4 rounded-full border border-gray-400
            transition-all duration-200
            peer-hover:shadow-[0_0_8px_#5f4a87]
            peer-checked:bg-[#FCCC22] peer-checked:shadow-[0_0_12px_#FCCC22] peer-checked:border-[#FCCC22]
          "
        ></span>
        <span className="text-base font-medium text-gray-200">Male</span>
      </label>

      {/* Female */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="radio"
          name="gender"
          value="female"
          className="peer hidden"
        />
        <span
          className="
            w-4 h-4 rounded-full border border-gray-400
            transition-all duration-200
            peer-hover:shadow-[0_0_8px_#5f4a87]
            peer-checked:bg-[#FCCC22] peer-checked:shadow-[0_0_12px_#FCCC22] peer-checked:border-[#FCCC22]
          "
        ></span>
        <span className="text-base font-medium text-gray-200">Female</span>
      </label>
    </div>
  </div>

  {/* Birth Date */}
  <div className="w-1/2">
    <label htmlFor="birthdate" className="block text-xs mb-1">
      Select your birth date
    </label>
    <DatePicker
      id="birthdate"
      selected={birthDate}
      onChange={setBirthDate}
      placeholderText="MM/dd/yyyy"
      dateFormat="MM/dd/yyyy"
      popperPlacement="bottom-start"
      showPopperArrow={false}
      maxDate={cutoffDate}
      onChangeRaw={(e) => e.preventDefault()}
      open={dpOpen}
      onInputClick={() => setDpOpen(true)}
      onCalendarOpen={() => setDpOpen(true)}
      onCalendarClose={() => setDpOpen(false)}
      onClickOutside={() => setDpOpen(false)}
      popperClassName="z-[10000] custom-popper"
      className="w-full p-2 pr-10 rounded-md bg-gray-800 text-white text-sm hover:shadow-[0_0_12px_#5f4a87] focus:outline-none"
      calendarClassName="dp-dark dp-compact w-[320px] overflow-hidden"
      popperModifiers={[
        offset(({ rects }) => ({
          mainAxis: 10,
          crossAxis: -(rects.floating.width - rects.reference.width) / 2,
        })),
        flip({ fallbackStrategy: "initialPlacement" }),
        shift({ padding: 10 }),
      ]}
      renderCustomHeader={({
        date,
        decreaseMonth,
        increaseMonth,
        prevMonthButtonDisabled,
        nextMonthButtonDisabled,
      }) => {
        const keepSameDom = (_base, monthOffset) => {
          const ref = birthDate ?? new Date();
          const dom = ref.getDate();
          const y = date.getFullYear();
          const m = date.getMonth() + monthOffset;
          const last = new Date(y, m + 1, 0).getDate();
          return new Date(y, m, Math.min(dom, last));
        };

        const handlePrev = () => {
          setBirthDate(keepSameDom(date, -1));
          decreaseMonth();
        };
        const handleNext = () => {
          setBirthDate(keepSameDom(date, +1));
          increaseMonth();
        };

        const onKeyActivate = (e, handler) => {
          if (
            (e.key === "Enter" || e.key === " ") &&
            typeof handler === "function"
          ) {
            e.preventDefault();
            handler();
          }
        };

        return (
          <div className="relative flex items-center justify-center bg-[#5f4a87] px-3 py-2 rounded-t-md">
            {/* Left icon */}
            <FiChevronLeft
              size={18}
              role="button"
              tabIndex={0}
              aria-label="Previous month"
              onClick={handlePrev}
              onKeyDown={(e) => onKeyActivate(e, handlePrev)}
              className={`absolute left-2 cursor-pointer text-white/90 hover:text-white ${
                prevMonthButtonDisabled
                  ? "opacity-40 pointer-events-none"
                  : ""
              }`}
            />

            {/* Month title */}
            <span className="text-white text-sm font-medium select-none">
              {formatDate(date, "MMMM yyyy")}
            </span>

            {/* Right icon */}
            <FiChevronRight
              size={18}
              role="button"
              tabIndex={0}
              aria-label="Next month"
              onClick={handleNext}
              onKeyDown={(e) => onKeyActivate(e, handleNext)}
              className={`absolute right-2 cursor-pointer text-white/90 hover:text-white ${
                nextMonthButtonDisabled
                  ? "opacity-40 pointer-events-none"
                  : ""
              }`}
            />
          </div>
        );
      }}
    />
    {isUnderage && (
      <p className="mt-2 text-xs text-red-400">
        You must be at least {MIN_AGE} years old to sign up.
      </p>
    )}
  </div>
</div>
{/* Cards */}
<div className="w-full mt-2">
  <label className="block text-left text-sm font-medium text-gray-300 ">
    Select games
  </label>

  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-5 w-full">
    {/* Card1 */}
    <div className="relative bg-[#372859FF] rounded-xl overflow-hidden h-40 
                    hover:scale-105 transition-transform duration-300 cursor-pointer
                    shadow-[0_0_10px_#1e182f] hover:shadow-[0_0_20px_#5f4a87]">

      {/* Centered text */}
      <p className="absolute inset-0 flex items-center justify-center text-sm uppercase text-gray-200 font-semibold z-10">
        Rocket League
      </p>

      {/* Image */}
      <div className="relative w-full h-40">
        <Image
          src="/Rocket_League_cover.png"
          alt="Rocket League game selection"
          fill
          className="object-cover rounded-b-xl opacity-80"
        />
      </div>
    </div>

    {/* Card2 */}
    <div className="relative bg-[#372859FF] rounded-xl overflow-hidden h-40 
                    hover:scale-105 transition-transform duration-300 cursor-pointer
                    shadow-[0_0_10px_#1e182f] hover:shadow-[0_0_20px_#5f4a87]">

      <div className="relative w-full h-40">
        <Image
          src="/Call_of_Duty_Modern_Warfare_II_Key_Art.jpg"
          alt="Call of duty game selection"
          fill
          className="object-cover rounded-b-xl opacity-80"
        />
      </div>
    </div>

    {/* Card3 */}
    <div className="relative bg-[#372859FF] rounded-xl overflow-hidden h-40 
                    hover:scale-105 transition-transform duration-300 cursor-pointer
                    shadow-[0_0_10px_#1e182f] hover:shadow-[0_0_20px_#5f4a87]">

    
      <div className="relative w-full h-40">
        <Image
          src="/Overwatch_cover_art.jpg"
          alt="Overwatch game selection"
          fill
          className="object-cover rounded-b-xl opacity-80"
        />
      </div>
    </div>
  </div>
</div>
<button  type="button" className="bg-[#161630] mt-4 ">
              Sign Up 
            </button>


        </form>
 </div>

      {/* Toggle Panels */}
      <div className="toggle-container">
        <div className="toggle">
          <div className="toggle-panel toggle-left">
            
            <button
              type="button"
              className=""
              onClick={() => setIsActive(false)}
            >
              Sign Up as Gamer
            </button>
          </div>
          <div className="toggle-panel toggle-right">
          <p>Are</p>
            <button
              type="button"
              className=""
              onClick={() => setIsActive(true)}
            >
              Sign Up as Club
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
