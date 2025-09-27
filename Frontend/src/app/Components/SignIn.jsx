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
  deleteUser,
  OAuthProvider,
} from "firebase/auth";
import {
  collection,
  query,
  where,
  limit,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";

const ROUTES = {
  gamer: "/admin",
  club: "/club/home",
};

async function resolveEmail(identifier) {
  const id = identifier.trim();
  if (id.includes("@")) return id;

  const idLower = id.toLowerCase();
  const q = query(
    collection(db, "users"),
    where("username_lower", "==", idLower),
    limit(1)
  );
  const qs = await getDocs(q);

  if (!qs.empty) {
    const data = qs.docs[0].data();
    const email =
      data.email || data.gamerEmail || data.normalizedEmail || null;
    if (email) return email;
  }

  try {
    const mapSnap = await getDoc(doc(db, "usernames", id));
    if (mapSnap.exists() && mapSnap.data()?.email) {
      return mapSnap.data().email;
    }
  } catch { }

  const e = new Error("usernames/not-found");
  e.code = "usernames/not-found";
  throw e;
}

async function handleLogin(
  identifier,
  password,
  expectedRole,
  router,
  setError,
  setLoading
) {
  setError("");
  setLoading(true);
  try {
    const email = await resolveEmail(identifier);
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const uid = cred.user.uid;

    const snap = await getDoc(doc(db, "users", uid));
    if (!snap.exists()) {
      await signOut(auth);
      setError("No profile found for this account. Please sign up first.");
      return;
    }

    const role = snap.data().role;
    if (role !== expectedRole) {
      await signOut(auth);
      setError(
        role === "club"
          ? "This is a Club account. Please sign in from the Club tab."
          : "This is a Gamer account. Please sign in from the Gamer tab."
      );
      return;
    }

    router.replace(role === "club" ? ROUTES.club : ROUTES.gamer);
  } catch (err) {
    console.error("LOGIN ERROR:", err?.code, err?.message);
    const msg =
      err?.code === "auth/user-not-found" ||
        err?.code === "auth/wrong-password" ||
        err?.code === "auth/invalid-credential" ||
        err?.code === "usernames/not-found"
        ? "Email/username or password is wrong."
        : "Login failed. Please try again.";
    setError(msg);
  } finally {
    setLoading(false);
  }
}

export default function SignIn() {
  const router = useRouter();
  const [isActive, setIsActive] = useState(false);

  const [gId, setGId] = useState("");
  const [gPw, setGPw] = useState("");
  const [gLoading, setGLoading] = useState(false);
  const [gError, setGError] = useState("");

  const [cId, setCId] = useState("");
  const [cPw, setCPw] = useState("");
  const [cLoading, setCLoading] = useState(false);
  const [cError, setCError] = useState("");

  const googleProvider = new GoogleAuthProvider();
  const signInWithGoogle = async () => {
    setGError("");
    setGLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      const snap = await getDoc(doc(db, "users", user.uid));
      if (!snap.exists()) {
        try {
          await deleteUser(user);
        } catch {
          await signOut(auth);
        }
        setGError("No account found for this Google email. Please sign up first.");
        return;
      }

      const role = snap.data().role;
      if (role !== "gamer") {
        await signOut(auth);
        setGError("This Google account is not a Gamer account.");
        return;
      }

      router.replace(ROUTES.gamer);
    } catch (err) {
      console.error("GOOGLE SIGNIN ERROR", err);
      setGError("Google sign-in failed. Please try again.");
    } finally {
      setGLoading(false);
    }
  };

  const signInWithTwitchClub = async () => {
    setCError("");
    setCLoading(true);
    try {
      const provider = new OAuthProvider("oidc.twitch");
      provider.addScope("openid");
      provider.addScope("user:read:email");

      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const snap = await getDoc(doc(db, "users", user.uid));
      if (!snap.exists()) {
        try {
          await deleteUser(user);
        } catch {
          await signOut(auth);
        }
        setCError("No account found for this Twitch login. Please sign up first.");
        return;
      }

      const role = snap.data().role;
      if (role !== "club") {
        await signOut(auth);
        setCError("This Twitch login is not a Club account.");
        return;
      }

      router.replace(ROUTES.club);
    } catch (err) {
      console.error("TWITCH SIGNIN ERROR", err);
      setCError("Twitch sign-in failed. Please try again.");
    } finally {
      setCLoading(false);
    }
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

      {/* Club Form */}
      <div className="form-container club-form font-bold">
        <form
          className="flex flex-col justify-center items-center w-full max-w-md min-h-[560px]"
          onSubmit={(e) => {
            e.preventDefault();
            handleLogin(cId, cPw, "club", router, setCError, setCLoading);
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
            <button
              type="button"
              onClick={signInWithTwitchClub}
              disabled={cLoading}
              className="button-custom"
            >
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
            handleLogin(gId, gPw, "gamer", router, setGError, setGLoading);
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
            className="bg-[#161630] mt-6 w-1/2 mx-auto hover:shadow-[0_0_12px_#5f4a87] rounded-xl py-2 text-white font-semibold"
          >
            {gLoading ? "Logging in..." : "Log In"}
          </button>

          <div className="w-full flex justify-center mt-6">
            <button type="button" onClick={signInWithGoogle} className="button-custom">
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
