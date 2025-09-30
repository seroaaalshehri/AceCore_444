"use client";

import React, { useState } from "react";
import Particles from "../Components/Particles";
import SignIn from "../Components/SignIn";
import "../SignUpIn.css";
import { auth } from "../../../lib/firebaseClient";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  OAuthProvider,
} from "firebase/auth";
import { authedFetch } from "../../../lib/authedFetch";

async function loadMe() {
  const res = await authedFetch("http://localhost:4000/api/users/me");
  if (res.status === 404) throw new Error("Profile not found. Complete signup first.");
  if (res.status === 401) throw new Error("Please sign in again.");
  if (!res.ok) throw new Error("Failed to load profile.");
  const { user } = await res.json();
  return user; 
}

function routeFor(user) {
  if (user?.role === "club") return `/club/HomePage`;
  if (user?.role === "gamer") return `/gamer/profile/${user.id}`;
  return `/`;
}

async function redirectAfterLogin(router, setOk, setErr) {
  try {
    const user = await loadMe();
    const target = routeFor(user);
    router.replace(target);
    setOk && setOk("");
  } catch (e) {
    setErr && setErr(e?.message || "Failed to load profile.");
  }
}

export default function SignInPage() {
  const router = useRouter();

  const [isClub, setIsClub] = useState(false);

  const [gLoading, setGLoading] = useState(false);
  const [gError, setGError] = useState("");
  const [gOk, setGOk] = useState("");

  const [cLoading, setCLoading] = useState(false);
  const [cError, setCError] = useState("");
  const [cOk, setCOk] = useState("");

   /* ——— Email+Password (Gamer) ———*/
  const onGamerEmailLogin = async (email, password) => {
    setGError(""); setGOk(""); setGLoading(true);
    try {
      if (!email || !email.includes("@")) throw new Error("Please enter a valid email address.");
      if (!password) throw new Error("Please enter your password.");

      await signInWithEmailAndPassword(auth, email.trim(), password);

      /* redirect after login */
      await redirectAfterLogin(router, setGOk, setGError);
    } catch (err) {
      const msg =
        err?.code === "auth/user-not-found" ||
        err?.code === "auth/wrong-password" ||
        err?.code === "auth/invalid-credential"
          ? "Email or password is wrong."
          : err?.message || "Login failed. Please try again.";
      setGError(msg);
    } finally {
      setGLoading(false);
    }
  };

  // ——— Email+Password (Club) ———
  const onClubEmailLogin = async (email, password) => {
    setCError(""); setCOk(""); setCLoading(true);
    try {
      if (!email || !email.includes("@")) throw new Error("Please enter a valid email address.");
      if (!password) throw new Error("Please enter your password.");

      await signInWithEmailAndPassword(auth, email.trim(), password);

      /* redirect after login */
      await redirectAfterLogin(router, setCOk, setCError);
    } catch (err) {
      const msg =
        err?.code === "auth/user-not-found" ||
        err?.code === "auth/wrong-password" ||
        err?.code === "auth/invalid-credential"
          ? "Email or password is wrong."
          : err?.message || "Login failed. Please try again.";
      setCError(msg);
    } finally {
      setCLoading(false);
    }
  };

  // ——— Google (Gamer) ———
  const onGoogleLogin = async () => {
    setGError(""); setGOk(""); setGLoading(true);
    try {
      if (auth.currentUser) await signOut(auth);
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      await signInWithPopup(auth, provider);

      /* redirect after login */
      await redirectAfterLogin(router, setGOk, setGError);
    } catch (err) {
      setGError(err?.message || "Google sign-in failed. Please try again.");
    } finally {
      setGLoading(false);
    }
  };

  // ——— Twitch (Club via OIDC) ———
  const onTwitchLogin = async () => {
    setCError(""); setCOk(""); setCLoading(true);
    try {
      if (auth.currentUser) await signOut(auth);
      const provider = new OAuthProvider("oidc.twitch");
      provider.addScope("openid");
      provider.addScope("user:read:email");
      await signInWithPopup(auth, provider);

      /* redirect after login */
      await redirectAfterLogin(router, setCOk, setCError);
    } catch (err) {
      setCError(err?.message || "Twitch sign-in failed. Please try again.");
    } finally {
      setCLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen font-barlow overflow-x-hidden flex items-center justify-center">
       <Link href="http://localhost:3000/Home" aria-label="Go to home" className="absolute top-6 left-0 z-20">
        <Image
          src="/AC-glow.png"   
          alt="AC logo"
          width={140}        
          height={150}
          className="object-contain"
          priority
        />
      </Link>
      <div className="absolute inset-0 z-0 pointer-events-none">
        <Particles
          particleColors={["#ffffff", "#ffffff"]}
          particleCount={200}
          particleSpread={10}
          speed={0.1}
          particleBaseSize={100}
          moveParticlesOnHover={false}
          alphaParticles={false}
          disableRotation={false}
        />
      </div>

      {/* Sign In content + inline banners */}
      <div className="relative z-10 w-full">
        {(gError || gOk || cError || cOk) && (
          <div className="flex justify-center my-4">
            {gError && <div className="px-4 py-2 rounded bg-red-600/90 text-white text-sm shadow">{gError}</div>}
            {gOk && <div className="px-4 py-2 rounded bg-green-600/90 text-white text-sm shadow">{gOk}</div>}
            {cError && <div className="px-4 py-2 rounded bg-red-600/90 text-white text-sm shadow">{cError}</div>}
            {cOk && <div className="px-4 py-2 rounded bg-green-600/90 text-white text-sm shadow">{cOk}</div>}
          </div>
        )}

        <SignIn
          isClub={isClub}
          setIsClub={setIsClub}
          onGamerEmailLogin={onGamerEmailLogin}
          onClubEmailLogin={onClubEmailLogin}
          onGoogleLogin={onGoogleLogin}
          onTwitchLogin={onTwitchLogin}
          gLoading={gLoading}
          gError={gError}
          cLoading={cLoading}
          cError={cError}
        />
      </div>
    </main>
  );
}
