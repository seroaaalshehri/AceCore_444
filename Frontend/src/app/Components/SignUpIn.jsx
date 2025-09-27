"use client";
import React, { useState, useRef } from "react";
import { User } from "lucide-react";
import Image from "next/image";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { subYears, isAfter, getYear, getMonth } from "date-fns";
import Lottie from "lottie-react";
import club from "../../../public/ClubSignUpIcon.json";
import gamer from "../../../public/GamerSignup.json";
import Link from "next/link";
import DateAlert from "./DateAlert";
import { auth } from "../../../lib/firebaseClient";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  fetchSignInMethodsForEmail,
    signOut,
} from "firebase/auth";
import countryList from "react-select-country-list";
import { useMemo } from "react";
import SocialAlert from "./SocialAlert";

export function SignUpIn({ formData, handleChange, handleSubmit }) {
  const [isActive, setIsActive] = useState(false);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const [clubAvatarPreview, setClubAvatarPreview] = useState(null);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [okMsg, setOkMsg] = useState("");
  const [clubEmailLocal, setClubEmailLocal] = useState("");
const [emailLockedGamer, setEmailLockedGamer] = useState(false);
const [authBusy, setAuthBusy] = useState(false);
const SOCIALS = [
  { key: "twitch", label: "Twitch", icon: "/twitchIcon.svg" },
  { key: "youtube", label: "YouTube", icon: "/youtube (3).png" },
  { key: "x", label: "X", icon: "/x.svg" },
  { key: "discord", label: "Discord", icon: "/discord.svg" },
];
const [socialPlatform, setSocialPlatform] = useState(null);
const [socialInputValue, setSocialInputValue] = useState("");
const [socialAlertOpen, setSocialAlertOpen] = useState(false);
  const MIN_AGE = 16;
  const cutoffDate = subYears(new Date(), MIN_AGE);
  const years = Array.from({ length: 100 }, (_, i) => getYear(new Date()) - i);
  const fileClubRef = useRef(null);

React.useEffect(() => {
  handleChange({
    target: { name: "role", value: isActive ? "club" : "gamer" },
  });
}, [isActive]);

 const switchToGamer = () => {
    setIsActive(false);
    onRoleChange && onRoleChange("gamer");
    handleChange({ target: { name: "clubEmail", value: "" } });
    setEmailLockedGamer(Boolean(formData?.gamerEmail));
  };

  const switchToClub = () => {
    setIsActive(true);
    onRoleChange && onRoleChange("club");
    setOkMsg(""); setErrorMsg("");
  };


  const showAlert = (msg) => {
    setAlertMessage(msg);
    setAlertOpen(true);
  };
  const closeAlert = () => setAlertOpen(false);

  const isUnderage = formData?.birthdate ? isAfter(formData.birthdate, cutoffDate) : false;

  const pickClubAvatar = () => fileClubRef.current && fileClubRef.current.click();

  const onClubAvatarChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    setClubAvatarPreview(url);
    setAvatarMenuOpen(false);
    handleChange({ target: { name: "clubAvatar", value: f } });
  };

  const clearClubAvatar = () => {
    if (clubAvatarPreview) URL.revokeObjectURL(clubAvatarPreview);
    setClubAvatarPreview(null);
    if (fileClubRef.current) fileClubRef.current.value = "";
    handleChange({ target: { name: "clubAvatar", value: null } });
  };

  const onAvatarClick = () => {
    if (!clubAvatarPreview) {
      pickClubAvatar();
    } else {
      setAvatarMenuOpen((v) => !v);
    }
  };

  const handleBirthDate = (date) => {
    if (!date) return;
    if (isAfter(date, cutoffDate)) {
    showAlert(`Minimum allowed age is ${MIN_AGE}`);
      handleChange({ target: { name: "birthdate", value: null } });
      return;
    }
    handleChange({ target: { name: "birthdate", value: date } });
  };
  

  // Google registration (GAMER only)
  
  React.useEffect(() => {
    (async () => {
      try {
        const res = await getRedirectResult(auth);
        const email = res?.user?.email || "";
        if (email) {
          handleChange({ target: { name: "gamerEmail", value: email } });
          handleChange({ target: { name: "signupMethod", value: "oauth" } });
          setEmailLockedGamer(true);
          setOkMsg("Email filled from Google. Please complete the rest.");
        } else {
          setEmailLockedGamer(false);
        }
      } catch (e) {
        console.error("Google redirect result error:", e);
        setEmailLockedGamer(false);
      }
    })();
  }, []);

  const handleGoogleSignIn = async () => {
    if (authBusy) return;
    setAuthBusy(true);
    setErrorMsg("");
    setOkMsg("");
    setEmailLockedGamer(false);

    try {
      if (auth.currentUser) await signOut(auth);
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });

      const result = await signInWithPopup(auth, provider);
      const email = result?.user?.email || "";
      if (email) {
        handleChange({ target: { name: "gamerEmail", value: email } });
        handleChange({ target: { name: "signupMethod", value: "oauth" } });
        setEmailLockedGamer(true);
        setOkMsg("Email filled from Google. Please complete the rest.");
      } else {
        setErrorMsg("No email returned by Google.");
        setEmailLockedGamer(false);
      }
    } catch (err) {
      console.warn("Popup failed, attempting redirect…", err?.code);
      try {
        const providerForRedirect = new GoogleAuthProvider();
        providerForRedirect.setCustomParameters({ prompt: "select_account" });
        await signInWithRedirect(auth, providerForRedirect);
      } catch (redirectErr) {
        console.error("Google redirect failed:", redirectErr);
        setErrorMsg(
          "Google sign-in failed. Check popup/cookie settings and Authorized domains."
        );
        setEmailLockedGamer(false);
      }
    } finally {
      setAuthBusy(false);
    }
  };
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  const options = useMemo(() => countryList().getData(), []);

const games = Array.isArray(formData?.games) ? formData.games : [];
const hasAtLeastOneGame = games.length > 0;
  const handleGameSelect = (game) => {
    const next = games.includes(game)
      ? games.filter((g) => g !== game)
      : [...games, game];
    handleChange({ target: { name: "games", value: next } });
  };
  
  return (
    <div className={`container ${isActive ? "active" : ""}`} id="container">

      <div className="flex md:hidden justify-center gap-10 w-full pt-4 pb-2 border-b border-gray-700 ">
        <span
          onClick={(switchToGamer) => setIsActive(false)}
          className={`cursor-pointer pb-1 text-lg font-semibold relative
            ${!isActive ? "text-white after:w-full" : "text-gray-400 after:w-0"}
            after:absolute after:left-0 after:-bottom-1 after:h-[3px]
            after:bg-[#FCCC22] after:transition-all after:duration-300`}
        >
          As Gamer
        </span>
        <span
          onClick={(switchToClub) => setIsActive(true)}
          className={`cursor-pointer pb-1 text-lg font-semibold relative
            ${isActive ? "text-white after:w-full" : "text-gray-400 after:w-0"}
            after:absolute after:left-0 after:-bottom-1 after:h-[3px]
            after:bg-[#FCCC22] after:transition-all after:duration-300`}
        >
          As Club
        </span>
      </div>

      {/* Club Sign Up Form */}
      <div className="form-container club-form font-bold">
        <h1 className="text-2xl font-bold mb-3 text-center">Sign Up as a Club</h1>

       <div className="relative flex flex-col items-center justify-center my-4 w-full">
  <label className="mb-2 text-base text-gray-200">Upload Profile Photo</label>

  {/* Hidden file input */}
  <input
    ref={fileClubRef}
    type="file"
    accept="image/*"
    className="hidden"
    onChange={onClubAvatarChange}
  />

  {/* Clickable circle with preview */}
  <div
    onClick={() => fileClubRef.current && fileClubRef.current.click()}
    className="rounded-full bg-[#1C1633] shadow-[0_0_16px_#5f4a87]
      cursor-pointer overflow-hidden flex items-center justify-center
      hover:shadow-[0_0_20px_#7a66c7] transition-transform hover:scale-105"
    style={{ width: "120px", height: "120px" }}
  >
    {clubAvatarPreview ? (
      <img
        src={clubAvatarPreview}
        alt="Club logo"
        className="w-full h-full object-cover"
      />
    ) : (
      <User className="text-gray-300" style={{ width: "90px", height: "90px" }} />
    )}
  </div>


          {clubAvatarPreview && avatarMenuOpen && (
            <div className="absolute top-full mt-2 w-48 bg-[#1C1633] rounded-md shadow-[0_0_12px_#5f4a87] p-2">
              <button
                type="button"
                onClick={pickClubAvatar}
                className="block w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-[#2b2142] rounded-md"
              >
                Change
              </button>
              <button
                type="button"
                onClick={() => {
                  clearClubAvatar();
                  setAvatarMenuOpen(false);
                }}
                className="block w-full text-left px-4 py-2 text-sm text-red-300 hover:bg-[#2b2142] rounded-md"
              >
                Remove
              </button>
            </div>
          )}
        </div>

        {/* Social icons header button (kept visual) */}
     
        <div className="w-full flex justify-center mb-3">
          <button type="button" className="button-custom">
            <Image
              src="/twitchIcon.svg"
              alt="Twitch"
              width={20}
              height={20}
              className="inline-block"
            />
            <span>SignUp with Twitch</span>
          </button>
        </div>

        <form
          className="flex flex-col items-center w-full max-w-md"
          onSubmit={handleSubmit}
        >
          {/* Email + Password */}
          <div className="flex gap-3 w-full">
            <div className="w-1/2">
              <label htmlFor="club-email" className="block text-base mb-1">
                Email
              </label>
            <input
  id="club-email"
  name="clubEmail"
  type="email"
  placeholder="Enter email"
  value={formData.clubEmail || ""}  
  onChange={handleChange}
  required
  className="w-full p-2 rounded-md bg-[#eee] text-black text-sm hover:shadow-[0_0_12px_#5f4a87] focus:outline-none"
/>

            </div>
        <div className="w-1/2">
              <label htmlFor="club-password" className="block text-base mb-1">
                Password
              </label>
              <input
                id="club-password"
                name="password"
                type="password"
                placeholder="Enter password"
                value={formData.password || ""}
                onChange={handleChange}
                required
                className="w-full p-2 rounded-md bg-[#eee] text-black text-sm hover:shadow-[0_0_12px_#5f4a87] focus:outline-none"
              />
            </div>
          </div>

          {/* Club Username + Name */}
          <div className="flex gap-3 w-full mt-3">
            <div className="w-1/2">
              <label htmlFor="club-username" className="block text-base mb-1">
                Club Username
              </label>
              <input
                id="club-username"
                name="username"
                type="text"
                placeholder="Unique username"
                value={formData.username || ""}
                onChange={handleChange}
                required
                className="w-full p-2 rounded-md bg-[#eee] text-black text-sm hover:shadow-[0_0_12px_#5f4a87] focus:outline-none"
              />
            </div>
        <div className="w-1/2">
              <label htmlFor="club-name" className="block text-base mb-1">
                Club Name
              </label>
              <input
                id="club-name"
                name="clubName"
                type="text"
                placeholder="Name of the club"
                value={formData.clubName || ""}
                onChange={handleChange}
                required
                className="w-full p-2 rounded-md bg-[#eee] text-black text-sm hover:shadow-[0_0_12px_#5f4a87] focus:outline-none"
              />
            </div>
          </div>
 <div className="flex gap-3 w-full mt-3 items-start">
  {/* Country Field */}
  <div className="w-1/2">
    <label htmlFor="Country" className="block text-base mb-1">
      Country
    </label>
    <select
      id="Country"
      name="country"
      value={formData.country || ""}
      onChange={handleChange}
      required
      className="w-full h-10 p-2 rounded-md bg-[#eee] text-gray-600 text-sm
      hover:shadow-[0_0_12px_#5f4a87] focus:outline-none cursor-pointer"
    >
      <option value="" disabled hidden>
        Select Country
      </option>
      {options.map(({ value, label }) => (
        <option key={value} value={label} className="text-gray-600">
          {label}
        </option>
      ))}
    </select>
  </div>

  {/* Social Media Icons */}
  <div className="w-1/2">
    <label className="block text-base mb-1">Social Media</label>
    <div className="flex gap-3 items-center mt-1">
      {SOCIALS.map(({ key, icon }) => (
 <Image
  key={key}
  src={icon}
  alt={key}
  width={40}
  height={40}
  onClick={() => {
    setSocialPlatform(key);
    setSocialInputValue(formData[key] || "");
    setSocialAlertOpen(true);
  }}
  className={`cursor-pointer rounded-lg bg-[#eeeeee] p-2 hover:bg-[#eeeeee] shadow-[0_0_6px_#5f4a87] transition 
    ${formData[key] ? "ring-2 ring-[#FCCC22]" : ""}`}
/>

))}
    </div>
  </div>
</div>


          {/* Select Games */}
      <div className="w-full mt-4">
  <label className="block text-left text-base font-medium text-gray-300">
    Select games
  </label>
  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-3 w-full">
    {["Rocket League", "Call of Duty", "Overwatch"].map((game) => (
      <div
        key={game}
        className={`relative bg-[#372859FF] rounded-xl overflow-hidden h-10 cursor-pointer transition-transform duration-300 shadow-[0_0_10px_#1e182f] hover:shadow-[0_0_20px_#5f4a87] ${
          games.includes(game) ? "ring-2 ring-[#FCCC22] shadow-[0_0_20px_#FCCC22]" : ""
        }`}
        onClick={() => handleGameSelect(game)}
      >
 
        <p className="absolute inset-0 flex items-center justify-center text-sm uppercase text-gray-200 font-semibold  drop-shadow-md z-20">
          {game}
        </p>


        <div className="relative w-full h-10">
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
            className="z-0 object-cover  rounded-b-xl opacity-80"
          />
    
          <div className="absolute inset-0 rounded-xl bg-[#2b2142]/30 pointer-events-none z-10" />
        </div>
      </div>
    ))}
  </div>
            {/* enforce required games in HTML */}
            <input
              type="text"
              name="games_required_check_gamer"
              value={games.length ? "ok" : ""}
              onChange={() => {}}
              required
              hidden
              readOnly
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="bg-[#161630] mt-6 w-1/2 mx-auto"
          >
            {loading ? "Creating..." : "Sign Up"}
          </button>

          {errorMsg && (
            <p className="mt-2 text-sm text-red-400 text-center">{errorMsg}</p>
          )}
          {okMsg && (
            <p className="mt-2 text-sm text-green-400 text-center">{okMsg}</p>
          )}
          <p className="mt-3 text-sm text-gray-400 text-center">
            Already have an account?{" "}
            <a href="/login" className="text-[#FCCC22] hover:underline">
              Sign in
            </a>
          </p>
        </form>
      </div>

      {/* Gamer Sign Up Form (kept) */}
      <div className="form-container gamer-form font-bold">
<form
  className="flex flex-col items-center w-full max-w-6xl md:max-w-7xl px-4"
  onSubmit={handleSubmit}
>



          <h1 className="text-2xl font-bold mb-3 text-center">Sign Up as a Gamer</h1>

          {/* Social icons (Google sign in kept) */}
          <div className="w-full flex justify-center mb-3">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="button-custom"
            >
              <img
                src="/googleIcon.svg"
                alt="Google"
                className="w-6 h-6 object-contain"
              />
            </button>
          </div>

          <span className="block text-md text-gray-400 mb-4">
            or use your email & password
          </span>
{!isActive && (okMsg || errorMsg) && (
  <p
    className={`mt-2 mb-2 text-sm text-center ${
      errorMsg ? "text-red-400" : "text-green-400"
    }`}
  >
    {errorMsg || okMsg}
  </p>
)}
          {/* Inputs */}
          <div className="flex flex-col gap-2 items-start w-full">
            <div className="w-full">
              <label htmlFor="username" className="block text-base mb-1">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                placeholder="Enter your username"
                value={formData.username || ""}
                onChange={handleChange}
                required
                className="w-full p-2 rounded-md bg-[#eee] text-black text-sm hover:shadow-[0_0_12px_#5f4a87] focus:outline-none"
              />
            </div>

            {/* Email + Password */}
            <div className="flex gap-3 w-full">
              <div className="w-1/2">
                <label htmlFor="gamer-email" className="block text-base mb-1">
                  Email
                </label>
            <input
  id="gamer-email"
  name="gamerEmail"
  type="email"
  placeholder="Enter your email"
  value={formData.gamerEmail || ""} 
  onChange={handleChange}
  required
  disabled={emailLockedGamer}
  className={`w-full p-2 rounded-md bg-[#eee] text-gray-600  text-sm hover:shadow-[0_0_12px_#5f4a87] focus:outline-none ${emailLockedGamer ? "opacity-70 cursor-not-allowed" : ""}`}
/>


              </div>

              <div className="w-1/2">
                <label htmlFor="password" className="block text-base mb-1">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Enter your password"
                  value={formData.password || ""}
                  onChange={handleChange}
                  required
                  className="w-full  p-2 rounded-md bg-[#eee] text-black text-sm hover:shadow-[0_0_12px_#5f4a87] focus:outline-none"
                />
              </div>
            </div>

            {/* Nationality dropdown */}
            <div className="w-full mt-2">
              <label htmlFor="nationality" className="block text-base mb-1">Nationality</label>
              <select
                id="nationality"
                name="nationality"
                value={formData.nationality || ""}   
                onChange={handleChange}             
                required
                className="w-full bg-[#eee] text-gray-600 text-sm rounded-md p-2 cursor-pointer focus:outline-none hover:shadow-[0_0_12px_#5f4a87] appearance-none"
              >
                <option value="" disabled hidden>
                  Select Nationality
                </option>
                {options.map(({ value, label }) => (
                  <option key={value} value={label} className="bg-[#eee] text-black">
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Gender + Birth Date */}
          <div className="flex gap-3 w-full mt-3">
            <div className="w-full md:w-1/2">
              <label className="block text-base mb-1">Gender</label>
              <div className="flex gap-4 mt-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="gender"
                    value="male"
                    checked={formData.gender === "male"}
                    onChange={handleChange}
                    required
                    className="peer hidden"
                  />
                  <span className="w-4 h-4 rounded-full border border-gray-400 peer-checked:bg-[#FCCC22] peer-checked:shadow-[0_0_12px_#FCCC22]" />
                  <span className="text-base font-medium text-gray-200">Male</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="gender"
                    value="female"
                    checked={formData.gender === "female"}
                    onChange={handleChange}
                    required
                    className="peer hidden"
                  />
                  <span className="w-4 h-4 rounded-full border border-gray-400 peer-checked:bg-[#FCCC22] peer-checked:shadow-[0_0_12px_#FCCC22]" />
                  <span className="text-base font-medium text-gray-200">Female</span>
                </label>
              </div>
            </div>

            <div className="w-full md:w-1/2">
              <label htmlFor="birthdate" className="block text-base mb-1">
                Select your birth date
              </label>
              <DatePicker
                id="birthdate"
                selected={formData.birthdate || null}
                onChange={handleBirthDate}
                required
                placeholderText="MM/dd/yyyy"
                dateFormat="MM/dd/yyyy"
                showPopperArrow={false}
                maxDate={cutoffDate}
                onChangeRaw={(e) => e.preventDefault()}
                popperClassName="z-[10000] custom-popper"
                className="w-full p-2 pr-10 rounded-md bg-[#eee] text-black text-sm hover:shadow-[0_0_12px_#5f4a87] focus:outline-none"
                calendarClassName="dp-dark dp-compact w=[320px] overflow-hidden"
                renderCustomHeader={({
                  date,
                  changeYear,
                  changeMonth,
                  decreaseMonth,
                  increaseMonth,
                  prevMonthButtonDisabled,
                  nextMonthButtonDisabled,
                }) => {
                  const cutoffY = getYear(cutoffDate);
                  const cutoffM = getMonth(cutoffDate);
                  const curY = getYear(date);
                  const curM = getMonth(date);

                  const alertMinAge = () => showAlert(`Minimum allowed age is ${MIN_AGE}`);

                  const safeChangeYear = (y) => {
                    if (y > cutoffY || (y === cutoffY && curM > cutoffM)) {
                      alertMinAge();
                      return;
                    }
                    changeYear(y);
                  };

                  const safeChangeMonth = (m) => {
                    if (curY > cutoffY || (curY === cutoffY && m > cutoffM)) {
                      alertMinAge();
                      return;
                    }
                    changeMonth(m);
                  };

                  const safeIncreaseMonth = () => {
                    if (curY > cutoffY || (curY === cutoffY && curM >= cutoffM)) {
                      alertMinAge();
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
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>

                        <select
                          value={curM}
                          onChange={({ target: { value } }) => safeChangeMonth(Number(value))}
                          className="bg-[#2b2142] text-white text-sm rounded-md p-1 cursor-pointer"
                        >
                          {months.map((month, index) => (
                            <option key={month} value={index}>
                              {month}
                            </option>
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
                          className={`absolute left-2 cursor-pointer text-white/90 hover:text-white ${
                            prevMonthButtonDisabled ? "opacity-40 pointer-events-none" : ""
                          }`}
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
                          className={`absolute right-2 cursor-pointer text-white/90 hover:text-white ${
                            nextMonthButtonDisabled ? "opacity-40 pointer-events-none" : ""
                          }`}
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

       {/* Select Games (same tiles) */}
<div className="w-full mt-4">
  <label className="block text-left text-base font-medium text-gray-300">
    Select games
  </label>
  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-3 w-full">
    {["Rocket League", "Call of Duty", "Overwatch"].map((game) => (
      <div
        key={game}
        className={`relative bg-[#372859FF] rounded-xl overflow-hidden h-10 cursor-pointer transition-transform duration-300 shadow-[0_0_10px_#1e182f] hover:shadow-[0_0_20px_#5f4a87] ${
          games.includes(game) ? "ring-2 ring-[#FCCC22] shadow-[0_0_20px_#FCCC22]" : ""
        }`}
        onClick={() => handleGameSelect(game)}
      >
 
        <p className="absolute inset-0 flex items-center justify-center text-sm uppercase text-gray-200 font-semibold  drop-shadow-md z-20">
          {game}
        </p>


        <div className="relative w-full h-10">
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
            className="z-0 object-cover rounded-b-xl opacity-80"
          />
    
          <div className="absolute inset-0 rounded-xl bg-[#2b2142]/30 pointer-events-none z-10" />
        </div>
      </div>
    ))}
  </div>


            {/* enforce required games in HTML */}
            <input
              type="text"
              name="games_required_check_gamer"
              value={games.length ? "ok" : ""}
              onChange={() => {}}
              required
              hidden
              readOnly
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-[#161630] mt-6 w-1/2 mx-auto"
          >
            {loading ? "Creating..." : "Sign Up"}
          </button>

     
          <p className="mt-3 text-sm text-gray-400 text-center">
            Already have an account?{" "}
            <a href="/login" className="text-[#FCCC22] hover:underline">
              Sign in
            </a>
          </p>
        </form>
      </div>
{/* Toggle Panels */}
<div className="toggle-container">
  <div className="toggle">
    <div className="toggle-panel toggle-left">
      <div className="w-64 h-64 mb-6">
        <Lottie animationData={gamer} loop />
      </div>
      <p className="text-2xl font-bold mb-4">Are You a Gamer?</p>
      <button type="button" onClick={switchToGamer}>
        Sign Up as Gamer
      </button>
    </div>

    <div className="toggle-panel toggle-right">
      <div className="w-64 h-64 mb-6">
        <Lottie animationData={club} loop />
      </div>
      <p className="text-2xl font-bold mb-4">Are You a Club?</p>

      <button type="button" onClick={switchToClub}>
        Sign Up as Club
      </button>
    </div>
  </div>
</div>


      <DateAlert open={alertOpen} message={alertMessage} onClose={closeAlert} />
     <SocialAlert
  open={socialAlertOpen}
  platform={socialPlatform}
  value={socialInputValue}
  onChange={setSocialInputValue}
  onSave={() => {
    handleChange({ target: { name: socialPlatform, value: socialInputValue } });
    setSocialAlertOpen(false);
  }}
  onClose={() => setSocialAlertOpen(false)}
/>

    </div>
  );
}
