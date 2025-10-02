"use client";

import React, { useState } from "react";
import Image from "next/image";
import Lottie from "lottie-react";
import clubSignUp from "../../../public/ClubSignUpIcon.json";
import gamerSignUp from "../../../public/GamerSignup.json";
import Link from "next/link";

import { auth } from "../../../lib/firebaseClient";
import { OAuthProvider, signInWithPopup, signInWithRedirect } from "firebase/auth";

export default function SignIn({
  isClub,
  setIsClub,

  // handlers from parent 
  onGamerEmailLogin,
  onClubEmailLogin,
  onGoogleLogin,
  onTwitchLogin, 

  // status from parent 
  gLoading = false,
  gError = "",
  cLoading = false,
  cError = "",
}) {

  const [gEmail, setGEmail] = useState("");
  const [gPw, setGPw] = useState("");
  const [cEmail, setCEmail] = useState("");
  const [cPw, setCPw] = useState("");

  // Gmail guard (added)
  const [gGmailMsg, setGGmailMsg] = useState("");

  // Twitch local state
  const [tLoading, setTLoading] = useState(false);
  const [tError, setTError] = useState("");

  // Gmail domain checker (added)
  const isGmailAddress = (email) => {
    const domain = String(email || "").split("@")[1]?.toLowerCase() || "";
    return domain === "gmail.com" || domain === "googlemail.com";
  };

  // Twitch login handler 
  const handleTwitchLogin = async () => {
    try {
      setTError("");
      setTLoading(true);

      const useRedirect = false;

      const provider = new OAuthProvider("oidc.twitch");
      provider.addScope("openid");
      provider.addScope("user:read:email");

      if (useRedirect) {
        await signInWithRedirect(auth, provider);
      } else {
        await signInWithPopup(auth, provider);
      }
    } catch (e) {
      console.error(e);
      setTError(e?.message || "Failed to sign in with Twitch.");
    } finally {
      setTLoading(false);
    }
  };




  return (
    <div className={`container ${isClub ? "active" : ""}`} id="container">
      {/* mobile tab toggle */}
      <div className="flex md:hidden justify-center gap-10 w-full pt-4 pb-2 border-b border-gray-700">
        <span
          onClick={() => setIsClub(false)}
          className={`cursor-pointer pb-1 text-lg font-semibold relative
            ${!isClub ? "text-white after:w-full" : "text-gray-400 after:w-0"}
            after:absolute after:left-0 after:-bottom-1 after:h-[3px]
            after:bg-[#FCCC22] after:transition-all after:duration-300`}
        >
          As Gamer
        </span>
        <span
          onClick={() => setIsClub(true)}
          className={`cursor-pointer pb-1 text-lg font-semibold relative
            ${isClub ? "text-white after:w-full" : "text-gray-400 after:w-0"}
            after:absolute after:left-0 after:-bottom-1 after:h-[3px]
            after:bg-[#FCCC22] after:transition-all after:duration-300`}
        >
          As Club
        </span>
      </div>

      {/* Club Form */}
      <div className="form-container club-form font-bold">
        <form
          className="flex flex-col justify-center items-center w-full max-w-md min-h-[560px]"
          onSubmit={(e) => {
            e.preventDefault();
            if (!cLoading && !tLoading) onClubEmailLogin?.(cEmail, cPw);
          }}
        >
          <h1 className="text-2xl font-bold mb-3 text-center">Sign In as a Club</h1>

          <div className="w-full flex flex-col gap-3">
            <div className="w-full">
              <label htmlFor="club-email" className="block text-base font-semibold mb-1 text-gray-200">
                Email
              </label>
              <input
                id="club-email"
                type="email"
                value={cEmail}
                onChange={(e) => setCEmail(e.target.value)}
                placeholder="Enter your Email"
                required
                disabled={cLoading || tLoading}
                autoComplete="email"
                className="w-full p-2 rounded-md bg-[#eee] text-black text-sm hover:shadow-[0_0_12px_#5f4a87] focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>
            <div className="w-full">
              <label htmlFor="club-pass" className="block text-base font-semibold mb-1 text-gray-200">
                Password
              </label>
              <input
                id="club-pass"
                type="password"
                value={cPw}
                onChange={(e) => setCPw(e.target.value)}
                placeholder="Enter your password "
                required
                disabled={cLoading || tLoading}
                autoComplete="current-password"
                className="w-full p-2 rounded-md bg-[#eee] text-black text-sm hover:shadow-[0_0_12px_#5f4a87] focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {(cError || tError) && (
            <p className="text-red-400 text-sm mt-2">{tError || cError}</p>
          )}

          <button
            disabled={cLoading || tLoading}
            type="submit"
            className="bg-[#161630] mt-6 w-1/2 mx-auto hover:shadow-[0_0_16px_#5f4a87] rounded-xl py-2 text-white font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {cLoading ? "Logging in..." : "Log In"}
          </button>

          <div className="w-full flex justify-center mt-6">
            <button
              type="button"
              onClick={handleTwitchLogin}
              disabled={cLoading || tLoading}
              className="button-custom disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Image src="/twitchIcon.svg" alt="Twitch" width={20} height={20} />
              <span>{tLoading ? " Connecting to Twitch..." : " Continue with Twitch"}</span>
            </button>
          </div>
          <p className="mt-3 text-sm text-gray-400 text-center">
            Don&apos;t have an account?{" "}
            <Link href="/SignUp" className="text-[#FCCC22] hover:underline">
              Sign up
            </Link>
          </p>

        </form>
      </div>

      {/* Gamer Form */}
      <div className="form-container gamer-form font-bold">
        <form
          className="flex flex-col justify-center items-center w-full max-w-md min-h-[560px]"
          onSubmit={(e) => {
            e.preventDefault();
            
            if (!gLoading) onGamerEmailLogin?.(gEmail, gPw);
          }}
        >
          <h1 className="text-2xl font-bold mb-3 text-center">Sign In as a Gamer</h1>

          <div className="w-full flex flex-col gap-3">
            <div className="w-full">
              <label htmlFor="g-email" className="block text-base font-semibold mb-1 text-gray-200">
                Email
              </label>
              <input
                id="g-email"
                type="email"
                value={gEmail}
                onChange={(e) => {
                  const v = e.target.value;
                  setGEmail(v);
                  // live hint
                  if (isGmailAddress(v)) {
                    setGGmailMsg("");
                  } else {
                    setGGmailMsg("");
                  }
                }}
                onBlur={(e) => {
                  const v = e.target.value;
                  if (isGmailAddress(v)) {
                    setGGmailMsg("");
                  }
                }}
                placeholder="Enter your Email"
                required
                disabled={gLoading }
                autoComplete="email"
                className="w-full p-2 rounded-md bg-[#eee] text-black text-sm hover:shadow-[0_0_12px_#5f4a87] focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>
            <div className="w-full">
              <label htmlFor="g-pass" className="block text-base font-semibold mb-1 text-gray-200">
                Password
              </label>
              <input
                id="g-pass"
                type="password"
                value={gPw}
                onChange={(e) => setGPw(e.target.value)}
                placeholder="Enter your password "
                required
                disabled={gLoading }
                autoComplete="current-password"
                className="w-full p-2 rounded-md bg-[#eee] text-black text-sm hover:shadow-[0_0_12px_#5f4a87] focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* Gmail guard message */}
          {gGmailMsg && <p className="text-red-400 text-sm mt-2">{gGmailMsg}</p>}

          {gError && <p className="text-red-400 text-sm mt-2">{gError}</p>}

          <button
            disabled={gLoading}
            type="submit"
            className="bg-[#161630] mt-6 w-1/2 mx-auto hover:shadow-[0_0_12px_#5f4a87] rounded-xl py-2 text-white font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {gLoading ? "Logging in..." : "Log In"}
          </button>

          <div className="w-full flex justify-center mt-6">
            <button
              type="button"
              onClick={() => onGoogleLogin?.()}
              disabled={gLoading}
              className="button-custom disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Image src="/googleIcon.svg" alt="Google" width={20} height={20} />
              <span> Continue with Google</span>
            </button>
          </div>
          <p className="mt-3 text-sm text-gray-400 text-center">
            Don&apos;t have an account?{" "}
            <Link href="/SignUp" className="text-[#FCCC22] hover:underline">
              Sign up
            </Link>
          </p>
        </form>
      </div>

      {/* Toggle Panels */}
      <div className="toggle-container">
        <div className="toggle">
          <div className="toggle-panel toggle-left">
            <p className="text-2xl font-bold mb-4">Welcome Back</p>
            <div className="w-64 h-64 mb-6">
              <Lottie animationData={gamerSignUp} loop />
            </div>
            <p className="text-2xl font-bold mb-4">Are You a Gamer?</p>
            <button type="button" onClick={() => setIsClub(false)}>
              Sign In as Gamer
            </button>
          </div>

          <div className="toggle-panel toggle-right">
            <p className="text-2xl font-bold mb-4">Welcome Back</p>
            <div className="w-64 h-64 mb-6">
              <Lottie animationData={clubSignUp} loop />
            </div>
            <p className="text-2xl font-bold mb-4">Are You a Club?</p>
            <button type="button" onClick={() => setIsClub(true)}>
              Sign In as Club
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}