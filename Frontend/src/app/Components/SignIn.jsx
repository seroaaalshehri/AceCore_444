"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Lottie from "lottie-react";
import { useRouter } from "next/navigation";

import clubSignUp from "../../../public/ClubSignUpIcon.json";
import gamerSignUp from "../../../public/GamerSignup.json";

import { auth, db } from "../../../lib/firebaseClient";
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";

export default function SignIn() {
  const [isActive, setIsActive] = useState(false);
  const router = useRouter();

  // Gamer state
  const [gId, setGId] = useState("");
  const [gPw, setGPw] = useState("");
  const [gLoading, setGLoading] = useState(false);
  const [gError, setGError] = useState("");

  // Club state
  const [cId, setCId] = useState("");
  const [cPw, setCPw] = useState("");
  const [cLoading, setCLoading] = useState(false);
  const [cError, setCError] = useState("");

  /**
   * Resolve username -> email if needed
   */
  const resolveEmail = async (identifier) => {
    if (identifier.includes("@")) return identifier; // already email
    const q = query(collection(db, "users"), where("username", "==", identifier));
    const snap = await getDocs(q);
    if (snap.empty) throw new Error("No account found for this username.");
    return snap.docs[0].data().gamerEmail; // we assume you store gamerEmail always
  };

  /**
   * Handle login for gamer or club
   */
  const handleLogin = async (identifier, password, expectedRole, setError, setLoading) => {
    setError("");
    setLoading(true);
    try {
      // 1. resolve email (username → email)
      const email = await resolveEmail(identifier);

      // 2. Firebase Auth sign-in
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const uid = cred.user.uid;

      // 3. Fetch profile from Firestore
      const profileRef = doc(db, "users", uid);
      const profileSnap = await getDoc(profileRef);

      if (!profileSnap.exists()) {
        await signOut(auth);
        throw new Error("Profile not found in Firestore.");
      }

      const profile = profileSnap.data();

      // 4. Check role (gamer vs club)
      const userRole = profile.role || (profile.clubEmail ? "club" : "gamer");
      if (userRole !== expectedRole) {
        await signOut(auth);
        throw new Error(
          userRole === "club"
            ? "This is a Club account. Please sign in from the Club tab."
            : "This is a Gamer account. Please sign in from the Gamer tab."
        );
      }

      // 5. Redirect based on role
      router.replace(userRole === "club" ? "/club/home" : "/admin");
    } catch (err) {
      console.error("LOGIN ERROR:", err);
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`container ${isActive ? "active" : ""}`} id="container">
      {/* Mobile Toggle */}
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

      {/* Club Form */}
      <div className="form-container club-form font-bold">
        <form
          className="flex flex-col justify-center items-center w-full max-w-md min-h-[560px]"
          onSubmit={(e) => {
            e.preventDefault();
            handleLogin(cId, cPw, "club", setCError, setCLoading);
          }}
        >
          <h1 className="text-2xl font-bold mb-3 text-center">Log In as a Club</h1>

          <div className="w-full flex flex-col gap-3">
            <div className="w-full">
              <label htmlFor="club-id" className="block text-base font-semibold mb-1 text-gray-200">
                Email or Username
              </label>
              <input
                id="club-id"
                type="text"
                value={cId}
                onChange={(e) => setCId(e.target.value)}
                placeholder="Enter your email or username"
                className="w-full p-2 rounded-md bg-[#eee] text-black text-sm hover:shadow-[0_0_12px_#5f4a87] focus:outline-none"
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
                placeholder="••••••••"
                className="w-full p-2 rounded-md bg-[#eee] text-black text-sm hover:shadow-[0_0_12px_#5f4a87] focus:outline-none"
              />
            </div>
          </div>

          {cError && <p className="text-red-400 text-sm mt-2">{cError}</p>}

          <button
            disabled={cLoading}
            type="submit"
            className="bg-[#161630] mt-6 w-1/2 mx-auto hover:shadow-[0_0_16px_#5f4a87] rounded-xl py-2 text-white font-semibold"
          >
            {cLoading ? "Logging in..." : "Log In"}
          </button>

          <div className="w-full flex justify-center mt-6">
            <button type="button" onClick={() => (window.location.href = "/api/auth/twitch")} className="button-custom">
              <Image src="/twitchIcon.svg" alt="Twitch" width={20} height={20} />
              <span> Continue with Twitch</span>
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
            handleLogin(gId, gPw, "gamer", setGError, setGLoading);
          }}
        >
          <h1 className="text-2xl font-bold mb-3 text-center">Log In as a Gamer</h1>

          <div className="w-full flex flex-col gap-3">
            <div className="w-full">
              <label htmlFor="g-id" className="block text-base font-semibold mb-1 text-gray-200">
                Email or Username
              </label>
              <input
                id="g-id"
                type="text"
                value={gId}
                onChange={(e) => setGId(e.target.value)}
                placeholder="Enter your email or username"
                className="w-full p-2 rounded-md bg-[#eee] text-black text-sm hover:shadow-[0_0_12px_#5f4a87] focus:outline-none"
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
                placeholder="••••••••"
                className="w-full p-2 rounded-md bg-[#eee] text-black text-sm hover:shadow-[0_0_12px_#5f4a87] focus:outline-none"
              />
            </div>
          </div>

          {gError && <p className="text-red-400 text-sm mt-2">{gError}</p>}

          <button
            disabled={gLoading}
            type="submit"
            className="bg-[#161630] mt-6 w-1/2 mx-auto hover:shadow-[0_0_16px_#5f4a87] rounded-xl py-2 text-white font-semibold"
          >
            {gLoading ? "Logging in..." : "Log In"}
          </button>

          <div className="w-full flex justify-center mt-6">
            <button type="button" className="button-custom">
              <Image src="/googleIcon.svg" alt="Google" width={20} height={20} />
              <span> Continue with Google</span>
            </button>
          </div>

          <p className="mt-3 text-sm text-gray-400 text-center">
            Don&apos;t have an account?{" "}
            <Link href="/SignUp" className="text-[#FCCC22] hover:underline">
              Sign Up
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
            <button type="button" onClick={() => setIsActive(false)}>
              Log In as Gamer
            </button>
          </div>

          <div className="toggle-panel toggle-right">
            <p className="text-2xl font-bold mb-4">Welcome Back</p>
            <div className="w-64 h-64 mb-6">
              <Lottie animationData={clubSignUp} loop />
            </div>
            <p className="text-2xl font-bold mb-4">Are You a Club?</p>
            <button type="button" onClick={() => setIsActive(true)}>
              Log In as Club
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
