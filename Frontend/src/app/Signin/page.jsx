"use client";

import React, { useState } from "react";
import Particles from "../Components/Particles";
import SignIn from "../Components/SignIn";
import "../SignUpIn.css";
import { auth } from "../../../lib/firebaseClient";
import { useRouter } from "next/navigation";

import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  OAuthProvider,
} from "firebase/auth";

/* ---------- ADDED: helper to load profile by Firebase UID (no tokens) ---------- */
async function loadProfileByUid() {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("No Firebase session.");
  const res = await fetch(`http://localhost:4000/api/users/by-auth/${uid}`);
  if (res.status === 404) throw new Error("Profile not found. Complete signup first.");
  if (!res.ok) throw new Error("Failed to load profile.");
  const { user } = await res.json();
  return user; // { id, role, username, ... }
}

/* ---------- ADDED: where to send user based on role ---------- */
/* Adjust these paths to your app’s actual routes */
function routeFor(user) {
  if (user?.role === "club") return `/club/HomePage`;           // e.g. club landing
  if (user?.role === "gamer") return `/gamer/profile/${user.id}`; // e.g. gamer profile by id
  return `/`; // fallback
}

/* ---------- ADDED: do the redirect after successful login ---------- */
async function redirectAfterLogin(router, setOk, setErr) {
  try {
    const user = await loadProfileByUid();
    const target = routeFor(user);
    router.replace(target);
    setOk && setOk(""); // clear banner if you want
  } catch (e) {
    // If profile not found yet, keep the current banner and do not navigate
    setErr && setErr(e?.message || "Failed to load profile.");
  }
}


export default function SignInPage() {
    const router = useRouter();
  // Which tab is active
  const [isClub, setIsClub] = useState(false);

  // Loading/errors per tab
  const [gLoading, setGLoading] = useState(false);
  const [gError, setGError] = useState("");
  const [gOk, setGOk] = useState("");

  const [cLoading, setCLoading] = useState(false);
  const [cError, setCError] = useState("");
  const [cOk, setCOk] = useState("");

  // ——— Email+Password (Gamer) ———
 const onGamerEmailLogin = async (email, password) => {
    setGError(""); setGOk(""); setGLoading(true);
    try {
      if (!email || !email.includes("@")) throw new Error("Please enter a valid email address.");
      if (!password) throw new Error("Please enter your password.");

      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      // If you want to enforce verified emails, uncomment next 3 lines:
      // if (!cred.user.emailVerified) {
      //   await signOut(auth); throw new Error("Please verify your email before logging in.");
      // }


      /* ---------- ADDED: redirect after login ---------- */
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
 const onClubEmailLogin = async (email, password) => {
    setCError(""); setCOk(""); setCLoading(true);
    try {
      if (!email || !email.includes("@")) throw new Error("Please enter a valid email address.");
      if (!password) throw new Error("Please enter your password.");

      await signInWithEmailAndPassword(auth, email.trim(), password);

      /* ---------- ADDED: redirect after login ---------- */
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

      /* ---------- ADDED: redirect after login ---------- */
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

      /* ---------- ADDED: redirect after login ---------- */
      await redirectAfterLogin(router, setCOk, setCError);
    } catch (err) {
      setCError(err?.message || "Twitch sign-in failed. Please try again.");
    } finally {
      setCLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen font-barlow overflow-x-hidden flex items-center justify-center">
      {/* Background Particles */}
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
        {/* Inline success/error banners (gamer/club) */}
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
