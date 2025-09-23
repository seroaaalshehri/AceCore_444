"use client";
import React, { useState } from "react";
import Image from "next/image";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { format as formatDate, subYears, isAfter, getYear, getMonth } from "date-fns";
import { offset, shift, flip } from "@floating-ui/dom";

export function SignUpIn() {
  const [isActive, setIsActive] = useState(false);
  const [selectedGames, setSelectedGames] = useState([]);
  const [birthDate, setBirthDate] = useState(null);
  const [dpOpen, setDpOpen] = useState(false);

  const MIN_AGE = 16;
  const cutoffDate = subYears(new Date(), MIN_AGE);
  const isUnderage = birthDate ? isAfter(birthDate, cutoffDate) : false;

  const years = Array.from({ length: 100 }, (_, i) => getYear(new Date()) - i);
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const handleGameSelect = (game) => {
    setSelectedGames((prev) =>
      prev.includes(game) ? prev.filter((g) => g !== game) : [...prev, game]
    );
  };

  return (
    <div className={`container ${isActive ? "active" : ""}`} id="container">
      
    
      <div className="flex md:hidden justify-center gap-10 w-full pt-4 pb-2 border-b border-gray-700">
        <span
          onClick={() => setIsActive(false)}
          className={`cursor-pointer pb-1 text-lg font-semibold relative
            ${!isActive ? "text-white after:w-full" : "text-gray-400 after:w-0"}
            after:absolute after:left-0 after:-bottom-1 after:h-[3px] 
            after:bg-[#FCCC22] after:transition-all after:duration-300`}
        >
          As Gamer
        </span>

        <span
          onClick={() => setIsActive(true)}
          className={`cursor-pointer pb-1 text-lg font-semibold relative
            ${isActive ? "text-white after:w-full" : "text-gray-400 after:w-0"}
            after:absolute after:left-0 after:-bottom-1 after:h-[3px] 
            after:bg-[#FCCC22] after:transition-all after:duration-300`}
        >
          As Club
        </span>
      </div>

    {/* Club Sign Up Form */}
<div className="form-container club-form">
  <form className="flex flex-col items-center w-full max-w-md">
  
    <h1 className="text-2xl font-bold mb-3 text-center">Sign Up as a Club</h1>
  

    
    <div className="flex gap-3 w-full">
      <div className="w-1/2">
        <label htmlFor="club-email" className="block text-xs mb-1">Twitch Email</label>
        <input
          id="club-email"
          type="email"
          placeholder="Enter Twitch email"
          className="w-full p-2 rounded-md bg-gray-800 text-white text-sm hover:shadow-[0_0_12px_#5f4a87] focus:outline-none"
        />
      </div>
      <div className="w-1/2">
        <label htmlFor="club-password" className="block text-xs mb-1">Password</label>
        <input
          id="club-password"
          type="password"
          placeholder="Enter password"
          className="w-full p-2 rounded-md bg-gray-800 text-white text-sm hover:shadow-[0_0_12px_#5f4a87] focus:outline-none"
        />
      </div>
    </div>

    {/* Club Username + Name */}
    <div className="flex gap-3 w-full mt-3">
      <div className="w-1/2">
        <label htmlFor="club-username" className="block text-xs mb-1">Club Username</label>
        <input
          id="club-username"
          type="text"
          placeholder="Unique username"
          className="w-full p-2 rounded-md bg-gray-800 text-white text-sm hover:shadow-[0_0_12px_#5f4a87] focus:outline-none"
        />
      </div>
      <div className="w-1/2">
        <label htmlFor="club-name" className="block text-xs mb-1">Club Name</label>
        <input
          id="club-name"
          type="text"
          placeholder="Name of the club"
          className="w-full p-2 rounded-md bg-gray-800 text-white text-sm hover:shadow-[0_0_12px_#5f4a87] focus:outline-none"
        />
      </div>
    </div>

    {/* Country + Logo Upload */}
    <div className="flex gap-3 w-full mt-3">
      <div className="w-1/2">
        <label htmlFor="club-country" className="block text-xs mb-1">Country</label>
        <input
          id="club-country"
          type="text"
          placeholder="Enter country"
          className="w-full p-2 rounded-md bg-gray-800 text-white text-sm hover:shadow-[0_0_12px_#5f4a87] focus:outline-none"
        />
      </div>
      <div className="w-1/2">
        <label htmlFor="club-logo" className="block text-xs mb-1">Club Logo</label>
        <input
          id="club-logo"
          type="file"
          accept="image/*"
          className="block w-full text-xs text-gray-300 file:mr-2 file:py-1 file:px-3 file:rounded-md file:border-0 file:bg-[#5f4a87] file:text-white hover:file:bg-[#7a66c7]"
        />
      </div>
    </div>

    {/* Social Media Links */}
    <div className="w-full mt-3">
      <label className="block text-xs mb-1">Social Media Links</label>
      <div className="grid grid-cols-2 gap-2">
        {["Twitch", "YouTube", "X", "Discord"].map((platform) => (
          <input
            key={platform}
            type="url"
            placeholder={`${platform} link`}
            className="p-2 rounded-md bg-gray-800 text-white text-sm hover:shadow-[0_0_12px_#5f4a87] focus:outline-none"
          />
        ))}
      </div>
    </div>

    {/* Game Selection (same as gamer) */}
    <div className="w-full mt-4">
      <label className="block text-left text-sm font-medium text-gray-300">
        Choose games
      </label>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-3 w-full">
        {["Rocket League", "Call of Duty", "Overwatch"].map((game) => (
          <div
            key={game}
            className={`relative bg-[#372859FF] rounded-xl overflow-hidden h-40 cursor-pointer transition-transform duration-300 shadow-[0_0_10px_#1e182f] hover:shadow-[0_0_20px_#5f4a87] ${
              selectedGames.includes(game)
                ? "ring-2 ring-[#FCCC22] shadow-[0_0_20px_#FCCC22]"
                : ""
            }`}
            onClick={() => handleGameSelect(game)}
          >
            <p className="absolute inset-0 flex items-center justify-center text-sm uppercase text-gray-200 font-semibold z-10">
              {game}
            </p>
            <div className="relative w-full h-40">
              <Image
                src={
                  game === "Rocket League"
                    ? "/Rocket_League_cover.png"
                    : game === "Call of Duty"
                    ? "/Call_of_Duty_Modern_Warfare_II_Key_Art.jpg"
                    : "/Overwatch_cover_art.jpg"
                }
                alt={game}
                fill
                className="object-cover rounded-b-xl opacity-80"
              />
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Sign Up Button */}
    <button type="button" className="bg-[#161630] mt-6 w-1/2 mx-auto">
      Sign Up
    </button>
  </form>
</div>


      {/* Gamer Sign Up Form */}
      <div className="form-container gamer-form">
        <form className="flex flex-col items-center w-full max-w-md">
          <h1 className="text-2xl font-bold mb-3 text-center">Sign Up as a Gamer</h1>

          {/* Social icons */}
          <div className="social-icons flex gap-3 mb-3">
            <a href="#" className="icon">
              <Image src="/googleIcon.svg" alt="Google" width={24} height={24} />
            </a>
            <a href="#" className="icon">
              <Image src="/twitchIcon.svg" alt="Twitch" width={24} height={24} />
            </a>
          </div>

          <span className="block text-md text-gray-400 mb-4">
            or use your email & password
          </span>

          {/* Inputs */}
          <div className="flex flex-col gap-2 items-start w-full">
            <div className="w-full">
              <label htmlFor="username" className="block text-xs mb-1">Username</label>
              <input
                id="username"
                type="text"
                placeholder="Enter your username"
                className="w-full p-2 rounded-md bg-gray-800 text-white text-sm hover:shadow-[0_0_12px_#5f4a87] focus:outline-none"
              />
            </div>

            <div className="flex gap-3 w-full">
              <div className="w-1/2">
                <label htmlFor="email" className="block text-xs mb-1">Email</label>
                <input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  className="w-full p-2 rounded-md bg-gray-800 text-white text-sm hover:shadow-[0_0_12px_#5f4a87] focus:outline-none"
                />
              </div>

              <div className="w-1/2">
                <label htmlFor="password" className="block text-xs mb-1">Password</label>
                <input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  className="w-full p-2 rounded-md bg-gray-800 text-white text-sm hover:shadow-[0_0_12px_#5f4a87] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Gender + Birth Date */}
          <div className="flex gap-3 w-full mt-3">
            <div className="w-1/2">
              <label className="block text-xs mb-1">Gender</label>
              <div className="flex gap-4 mt-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="gender" value="male" className="peer hidden" />
                  <span className="w-4 h-4 rounded-full border border-gray-400 peer-checked:bg-[#FCCC22] peer-checked:shadow-[0_0_12px_#FCCC22]"></span>
                  <span className="text-base font-medium text-gray-200">Male</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="gender" value="female" className="peer hidden" />
                  <span className="w-4 h-4 rounded-full border border-gray-400 peer-checked:bg-[#FCCC22] peer-checked:shadow-[0_0_12px_#FCCC22]"></span>
                  <span className="text-base font-medium text-gray-200">Female</span>
                </label>
              </div>
            </div>

            <div className="w-1/2">
              <label htmlFor="birthdate" className="block text-xs mb-1">Select your birth date</label>
              <DatePicker
                id="birthdate"
                selected={birthDate}
                onChange={setBirthDate}
                placeholderText="MM/dd/yyyy"
                dateFormat="MM/dd/yyyy"
                showPopperArrow={false}
                maxDate={cutoffDate}
                onChangeRaw={(e) => e.preventDefault()}
                popperClassName="z-[10000] custom-popper"
                className="w-full p-2 pr-10 rounded-md bg-gray-800 text-white text-sm hover:shadow-[0_0_12px_#5f4a87] focus:outline-none"
                calendarClassName="dp-dark dp-compact w-[320px] overflow-hidden"
                renderCustomHeader={({ date, changeYear, changeMonth, decreaseMonth, increaseMonth, prevMonthButtonDisabled, nextMonthButtonDisabled }) => (
                  <div className="flex flex-col bg-[#5f4a87] px-3 py-2 rounded-t-md">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <select
                        value={getYear(date)}
                        onChange={({ target: { value } }) => changeYear(Number(value))}
                        className="bg-[#2b2142] text-white text-sm rounded-md p-1 cursor-pointer"
                      >
                        {years.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>

                      <select
                        value={getMonth(date)}
                        onChange={({ target: { value } }) => changeMonth(Number(value))}
                        className="bg-[#2b2142] text-white text-sm rounded-md p-1 cursor-pointer"
                      >
                        {months.map((month, index) => (
                          <option key={month} value={index}>{month}</option>
                        ))}
                      </select>
                    </div>

                    <div className="relative flex items-center justify-center">
                      <FiChevronLeft
                        size={18}
                        role="button"
                        tabIndex={0}
                        aria-label="Previous month"
                        onClick={decreaseMonth}
                        className={`absolute left-2 cursor-pointer text-white/90 hover:text-white ${prevMonthButtonDisabled ? "opacity-40 pointer-events-none" : ""}`}
                      />
                      <span className="text-white text-sm font-medium select-none">
                        {months[getMonth(date)]} {getYear(date)}
                      </span>
                      <FiChevronRight
                        size={18}
                        role="button"
                        tabIndex={0}
                        aria-label="Next month"
                        onClick={increaseMonth}
                        className={`absolute right-2 cursor-pointer text-white/90 hover:text-white ${nextMonthButtonDisabled ? "opacity-40 pointer-events-none" : ""}`}
                      />
                    </div>
                  </div>
                )}
              />
              {isUnderage && (
                <p className="mt-2 text-xs text-red-400">
                  You must be at least {MIN_AGE} years old to sign up.
                </p>
              )}
            </div>
          </div>

          {/* Select Games */}
          <div className="w-full mt-4">
            <label className="block text-left text-sm font-medium text-gray-300">Select games</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-3 w-full">
              {["Rocket League", "Call of Duty", "Overwatch"].map((game) => (
                <div
                  key={game}
                  className={`relative bg-[#372859FF] rounded-xl overflow-hidden h-40 cursor-pointer transition-transform duration-300 shadow-[0_0_10px_#1e182f] hover:shadow-[0_0_20px_#5f4a87] ${selectedGames.includes(game) ? "ring-2 ring-[#FCCC22] shadow-[0_0_20px_#FCCC22]" : ""}`}
                  onClick={() => handleGameSelect(game)}
                >
                  <p className="absolute inset-0 flex items-center justify-center text-sm uppercase text-gray-200 font-semibold z-10">{game}</p>
                  <div className="relative w-full h-40">
                    <Image
                      src={
                        game === "Rocket League"
                          ? "/Rocket_League_cover.png"
                          : game === "Call of Duty"
                          ? "/Call_of_Duty_Modern_Warfare_II_Key_Art.jpg"
                          : "/Overwatch_cover_art.jpg"
                      }
                      alt={game}
                      fill
                      className="object-cover rounded-b-xl opacity-80"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button type="button" className="bg-[#161630] mt-6 w-1/2 mx-auto">
            Sign Up
          </button>
        </form>
      </div>

      {/* Toggle Panels */}
      <div className="toggle-container">
        <div className="toggle">
          <div className="toggle-panel toggle-left">
            <button type="button" onClick={() => setIsActive(false)}>Sign Up as Gamer</button>
          </div>
          <div className="toggle-panel toggle-right">
            <p>Are</p>
            <button type="button" onClick={() => setIsActive(true)}>Sign Up as Club</button>
          </div>
        </div>
      </div>
    </div>
  );
}
