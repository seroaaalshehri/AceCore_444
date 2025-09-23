"use client";
import React, { useState, useRef } from "react";
import { User } from "lucide-react";

import Image from "next/image";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { subYears, isAfter, getYear, getMonth } from "date-fns";
import Lottie from "lottie-react";
import teamAnim from "../assets/team.json"; 
import clubAnim from "../assets/Experienced.json";
import Link from "next/link";



export function SignUpIn() {
  const [isActive, setIsActive] = useState(false);
  const [selectedGames, setSelectedGames] = useState([]);
  const [birthDate, setBirthDate] = useState(null);
  const [gCountry, setGCountry] = useState("");
  const [underageAttempt, setUnderageAttempt] = useState(false);

  const MIN_AGE = 16;
  const cutoffDate = subYears(new Date(), MIN_AGE);
  const isUnderage = birthDate ? isAfter(birthDate, cutoffDate) : false;

  const years = Array.from({ length: 100 }, (_, i) => getYear(new Date()) - i);
  const fileClubRef = useRef(null);
const [clubAvatar, setClubAvatar] = useState(null);

const pickClubAvatar = () => fileClubRef.current && fileClubRef.current.click();

const onClubAvatarChange = (e) => {
  const f = e.target.files?.[0];
  if (!f) return;
  const url = URL.createObjectURL(f);
  setClubAvatar({ file: f, url });

 
  setAvatarMenuOpen(false);
};


const clearClubAvatar = () => {
  if (clubAvatar?.url) URL.revokeObjectURL(clubAvatar.url);
  setClubAvatar(null);
  if (fileClubRef.current) fileClubRef.current.value = "";
};
const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);

const onAvatarClick = () => {
  if (!clubAvatar) {
    pickClubAvatar();
  } else {
    setAvatarMenuOpen((v) => !v);
  }
};
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const COUNTRIES = [
    "Afghanistan","Albania","Algeria","Andorra","Angola","Antigua and Barbuda","Argentina","Armenia","Australia","Austria","Azerbaijan",
    "Bahamas","Bahrain","Bangladesh","Barbados","Belarus","Belgium","Belize","Benin","Bhutan","Bolivia","Bosnia and Herzegovina","Botswana","Brazil","Brunei","Bulgaria","Burkina Faso","Burundi",
    "Cabo Verde","Cambodia","Cameroon","Canada","Central African Republic","Chad","Chile","China","Colombia","Comoros","Congo, Democratic Republic of the","Congo, Republic of the","Costa Rica","Côte d’Ivoire","Croatia","Cuba","Cyprus","Czechia",
    "Denmark","Djibouti","Dominica","Dominican Republic",
    "Ecuador","Egypt","El Salvador","Equatorial Guinea","Eritrea","Estonia","Eswatini","Ethiopia",
    "Fiji","Finland","France",
    "Gabon","Gambia","Georgia","Germany","Ghana","Greece","Grenada","Guatemala","Guinea","Guinea-Bissau","Guyana",
    "Haiti","Honduras","Hungary",
    "Iceland","India","Indonesia","Iran","Iraq","Ireland","Israel","Italy",
    "Jamaica","Japan","Jordan",
    "Kazakhstan","Kenya","Kiribati","Kuwait","Kyrgyzstan",
    "Laos","Latvia","Lebanon","Lesotho","Liberia","Libya","Liechtenstein","Lithuania","Luxembourg",
    "Madagascar","Malawi","Malaysia","Maldives","Mali","Malta","Marshall Islands","Mauritania","Mauritius","Mexico","Micronesia","Moldova","Monaco","Mongolia","Montenegro","Morocco","Mozambique","Myanmar",
    "Namibia","Nauru","Nepal","Netherlands","New Zealand","Nicaragua","Niger","Nigeria","North Korea","North Macedonia","Norway",
    "Oman",
    "Pakistan","Palau","Panama","Papua New Guinea","Paraguay","Peru","Philippines","Poland","Portugal",
    "Qatar",
    "Romania","Russia","Rwanda",
    "Saint Kitts and Nevis","Saint Lucia","Saint Vincent and the Grenadines","Samoa","San Marino","Sao Tome and Principe","Saudi Arabia","Senegal","Serbia","Seychelles","Sierra Leone","Singapore","Slovakia","Slovenia","Solomon Islands","Somalia","South Africa","South Korea","South Sudan","Spain","Sri Lanka","Sudan","Suriname","Sweden","Switzerland","Syria",
    "Taiwan","Tajikistan","Tanzania","Thailand","Timor-Leste","Togo","Tonga","Trinidad and Tobago","Tunisia","Turkey","Turkmenistan","Tuvalu",
    "Uganda","Ukraine","United Arab Emirates","United Kingdom","United States","Uruguay","Uzbekistan",
    "Vanuatu","Vatican City","Venezuela","Vietnam",
    "Yemen",
    "Zambia","Zimbabwe"
  ];

  const handleGameSelect = (game) => {
    setSelectedGames((prev) =>
      prev.includes(game) ? prev.filter((g) => g !== game) : [...prev, game]
    );
  };

  return (
    <div className={`container ${isActive ? "active" : ""}`} id="container">
      {/* Mobile tabs */}
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
       {/* Club avatar uploader */}
<div className="w-full flex justify-center my-4">
  <div className="relative flex flex-col items-center">
    <input
      ref={fileClubRef}
      type="file"
      accept="image/*"
      onChange={onClubAvatarChange}
      className="hidden"
    />

    <div
      onClick={onAvatarClick}
      className="w-36 h-36 sm:w-35 sm:h-35 rounded-full bg-[#1C1633] shadow-[0_0_12px_#5f4a87]
                 cursor-pointer overflow-hidden flex items-center justify-center
                 hover:shadow-[0_0_16px_#7a66c7] transition"
    >
      {clubAvatar ? (
        <img
          src={clubAvatar.url}
          alt="Club logo"
          className="w-full h-full object-cover"
        />
      ) : (
        <User className="w-12 h-12 text-gray-300" />
      )}
    </div>

    {clubAvatar && avatarMenuOpen && (
      <div className="absolute top-full mt-2 w-32 bg-[#1C1633] rounded-md shadow-[0_0_12px_#5f4a87] p-1">
        <button
          type="button"
          onClick={pickClubAvatar}
          className="block w-full text-left px-3 py-2 text-sm text-gray-200 hover:bg-[#2b2142] rounded-md"
        >
          Change
        </button>
        <button
          type="button"
          onClick={() => { clearClubAvatar(); setAvatarMenuOpen(false); }}
          className="block w-full text-left px-3 py-2 text-sm text-red-300 hover:bg-[#2b2142] rounded-md"
        >
          Remove
        </button>
      </div>
    )}
  </div>
</div>

        <form className="flex flex-col items-center w-full max-w-md">
          
          {/* Social icons */}
  {/* Twitch Button */}
<div className="w-full flex justify-center mb-3">
  <button
    type="button"
    className="flex items-center justify-center gap-2 w-full py-2 px-4 rounded-md 
               bg-[#5f4a87] text-white text-sm font-medium 
               hover:bg-[#7a66c7] transition"
  >
    <Image
      src="/twitchIcon.svg"
      alt="Twitch"
      width={18}
      height={18}
      className="inline-block"
    />
    <span>Continue with Twitch</span>
  </button>
</div>


          <div className="flex gap-3 w-full">
            <div className="w-1/2">
              <label htmlFor="club-email" className="block text-xs mb-1">Twitch Email</label>
              <input
                id="club-email"
                type="email"
                placeholder="Enter Twitch email"
                className="w-full p-2 rounded-md bg-[#eee] text-black text-sm hover:shadow-[0_0_12px_#5f4a87] focus:outline-none"
              />
            </div>
            <div className="w-1/2">
              <label htmlFor="club-password" className="block text-xs mb-1">Password</label>
              <input
                id="club-password"
                type="password"
                placeholder="Enter password"
                className="w-full p-2 rounded-md bg-[#eee] text-black text-sm hover:shadow-[0_0_12px_#5f4a87] focus:outline-none"
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
                className="w-full p-2 rounded-md bg-[#eee] text-black text-sm hover:shadow-[0_0_12px_#5f4a87] focus:outline-none"
              />
            </div>
            <div className="w-1/2">
              <label htmlFor="club-name" className="block text-xs mb-1">Club Name</label>
              <input
                id="club-name"
                type="text"
                placeholder="Name of the club"
                className="w-full p-2 rounded-md bg-[#eee] text-black text-sm hover:shadow-[0_0_12px_#5f4a87] focus:outline-none"
              />
            </div>
          </div>

          {/* Nationality + Logo Upload */}
          <div className="flex gap-3 w-full mt-3">
          <div className="w-1/2">
  <label htmlFor="club-nationality" className="block text-xs mb-1">Nationality</label>
  <select
    id="club-nationality"
    value={gCountry}
    onChange={(e) => setGCountry(e.target.value)}
    className="w-full h-10 p-2 rounded-md bg-[#eee] text-gray-600 text-sm 
               hover:shadow-[0_0_12px_#5f4a87] focus:outline-none cursor-pointer"
  >
    <option value="" disabled hidden>
      Select Nationality
    </option>
    {COUNTRIES.map((c) => (
      <option key={c} value={c} className="text-gray-600">
        {c}
      </option>
    ))}
  </select>
</div>


          
          </div>

         {/* Social Media Links */}
<div className="w-full mt-3">
  <label className="block text-xs mb-1">Social Media Links</label>
  <div className="grid grid-cols-2 gap-2">
    {/* Twitch */}
    <div className="relative">
      <Image
        src="/twitchIcon.svg"
        alt="Twitch"
        width={19}
        height={19}
        className="absolute left-3 top-1/2 -translate-y-1/2"
      />
      <input
        type="url"
        placeholder="Twitch link"
        className="w-full pl-10 p-2 rounded-md bg-[#eee] text-gray-600 text-sm hover:shadow-[0_0_12px_#5f4a87] focus:outline-none"
      />
    </div>

    {/* YouTube */}
    <div className="relative">
      <Image
        src="/youtube.svg"
        alt="YouTube"
        width={40}
        height={40}
        className="absolute left-3 top-1/2 -translate-y-1/2"
      />
      <input
        type="url"
        placeholder="   YouTube link"
        className="w-full pl-10 p-2 rounded-md bg-[#eee] text-gray-600 text-sm hover:shadow-[0_0_12px_#5f4a87] focus:outline-none"
      />
    </div>

    {/* X */}
    <div className="relative">
      <Image
        src="/x.svg"
        alt="X"
        width={16}
        height={16}
        className="absolute left-3 top-1/2 -translate-y-1/2"
      />
      <input
        type="url"
        placeholder="X link"
        className="w-full pl-10 p-2 rounded-md bg-[#eee] text-gray-600 text-sm hover:shadow-[0_0_12px_#5f4a87] focus:outline-none"
      />
    </div>

    {/* Discord */}
    <div className="relative">
      <Image
        src="/discord.svg"
        alt="Discord"
        width={30}
        height={30}
        className="absolute left-3 top-1/2 -translate-y-1/2"
      />
      <input
        type="url"
        placeholder="  Discord link"
        className="w-full pl-10 p-2 rounded-md bg-[#eee] text-gray-600 text-sm hover:shadow-[0_0_12px_#5f4a87] focus:outline-none"
      />
    </div>
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
          <p className="mt-3 text-sm text-gray-400 text-center">
  Already have an account?{" "}
  <a href="/login" className="text-[#FCCC22] hover:underline">
    Log in
  </a>
</p>

        </form>

      </div>

      {/* Gamer Sign Up Form */}
      <div className="form-container gamer-form">
        <form className="flex flex-col items-center w-full max-w-md">

          <h1 className="text-2xl font-bold mb-3 text-center">Sign Up as a Gamer</h1>

          {/* Social icons */}
          <div className="social-icons flex gap-3 mb-3">
            <a href="#" className="icon">
              <Image 
                src="/googleIcon.svg" 
                alt="Google" 
                width={30}
                height={30}
              />
            </a>
            <a href="#" className="icon">
              <Image 
                src="/twitchIcon.svg" 
                alt="Twitch" 
                width={60}
                height={30}
              />
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
                className="w-full p-2 rounded-md bg-[#eee] text-black text-sm hover:shadow-[0_0_12px_#5f4a87] focus:outline-none"
              />
            </div>

            <div className="flex gap-3 w-full">
              <div className="w-1/2">
                <label htmlFor="email" className="block text-xs mb-1">Email</label>
                <input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  className="w-full p-2 rounded-md bg-[#eee] text-black text-sm hover:shadow-[0_0_12px_#5f4a87] focus:outline-none"
                />
              </div>

              <div className="w-1/2">
                <label htmlFor="password" className="block text-xs mb-1">Password</label>
                <input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  className="w-full p-2 rounded-md bg-[#eee] text-black text-sm hover:shadow-[0_0_12px_#5f4a87] focus:outline-none"
                />
              </div>
            </div>

            {/* Nationality dropdown */}
            <div className="w-full mt-2">
              <label htmlFor="nationality" className="block text-xs mb-1">Nationality</label>
              <select
                id="nationality"
                value={gCountry}
                onChange={(e) => setGCountry(e.target.value)}
                className="w-full bg-[#eee] text-gray-600 text-sm rounded-md p-2 cursor-pointer focus:outline-none hover:shadow-[0_0_12px_#5f4a87] appearance-none"
              >
                <option value="" disabled hidden>
                  Select Nationality
                </option>
                {COUNTRIES.map((c) => (
                  <option key={c} value={c} className="bg-[#eee] text-gray-600">
                    {c}
                  </option>
                ))}
              </select>
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
  className="w-full p-2 pr-10 rounded-md bg-[#eee] text-black text-sm hover:shadow-[0_0_12px_#5f4a87] focus:outline-none"
  calendarClassName="dp-dark dp-compact w=[320px] overflow-hidden"
  renderCustomHeader={({ 
    date, changeYear, changeMonth, decreaseMonth, increaseMonth,
    prevMonthButtonDisabled, nextMonthButtonDisabled 
  }) => {
    const cutoffY = getYear(cutoffDate);
    const cutoffM = getMonth(cutoffDate);
    const curY = getYear(date);
    const curM = getMonth(date);

    const alertMsg = () => alert(`Minimum allowed age is ${MIN_AGE}`);

    const safeChangeYear = (y) => {
      // لو اختار سنة تتجاوز الحد
      if (y > cutoffY || (y === cutoffY && curM > cutoffM)) {
        alertMsg();
        return;
      }
      changeYear(y);
    };

    const safeChangeMonth = (m) => {
      // لو الشهر يتجاوز الحد في نفس سنة الحد
      if (curY > cutoffY || (curY === cutoffY && m > cutoffM)) {
        alertMsg();
        return;
      }
      changeMonth(m);
    };

    const safeIncreaseMonth = () => {
      // منع السهم يمين من تخطي الحد
      if (curY > cutoffY || (curY === cutoffY && curM >= cutoffM)) {
        alertMsg();
        return;
      }
      increaseMonth();
    };

    return (
      <div className="flex flex-col bg-[#5f4a87] px-3 py-2 rounded-t-md">
        <div className="flex items-center justify-center gap-2 mb-2">
          <select
            value={curY}
            onChange={({ target: { value } }) => safeChangeYear(Number(value))}
            className="bg-[#2b2142] text-white text-sm rounded-md p-1 cursor-pointer"
          >
            {years.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>

          <select
            value={curM}
            onChange={({ target: { value } }) => safeChangeMonth(Number(value))}
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
            {months[curM]} {curY}
          </span>
          <FiChevronRight
            size={18}
            role="button"
            tabIndex={0}
            aria-label="Next month"
            onClick={safeIncreaseMonth}
            className={`absolute right-2 cursor-pointer text-white/90 hover:text-white ${nextMonthButtonDisabled ? "opacity-40 pointer-events-none" : ""}`}
          />
        </div>
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
          <p className="mt-3 text-sm text-gray-400 text-center">
  Already have an account?{" "}
  <a href="/login" className="text-[#FCCC22] hover:underline">
    Log in
  </a>
</p>
        </form>
      </div>

     {/* Toggle Panels */}
<div className="toggle-container">
  <div className="toggle">

    <div className="toggle-panel toggle-left">
     
      <div className="w-64 h-64 mb-6">
        <Lottie animationData={clubAnim} loop={true} />
      </div>

     
      <p className="text-2xl font-bold mb-4">Are You a Gamer?</p>

  
      <button type="button" onClick={() => setIsActive(false)}>
        Sign Up as Gamer
      </button>
    </div>

   
    <div className="toggle-panel toggle-right">
      <div className="w-64 h-64 mb-6">
        <Lottie animationData={teamAnim} loop={true} />
      </div>
      <p className="text-2xl font-bold mb-4">Are You a Club?</p>
      <button type="button" onClick={() => setIsActive(true)}>
        Sign Up as Club
      </button>
    </div>
  </div>
</div>

    </div>
  );
}
