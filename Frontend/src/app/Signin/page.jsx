"use client";

import React, { useState } from "react";
import Particles from "../Components/Particles";
import SignIn from "../Components/SignIn";
import "../SignUpIn.css";

import { auth } from "../../../lib/firebaseClient";
// fornext print 2 : import { authedFetch } from "../../../lib/authedFetch";

import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  OAuthProvider,
} from "firebase/auth";

/** Toggle this ON only if your backend has GET /api/users/me working */
const CHECK_PROFILE_AFTER_LOGIN = false; // <- keep false per your request (no /me check)

/** Optional: confirm a backend profile exists (no redirects) */
async function maybeCheckProfileExists() {
  if (!CHECK_PROFILE_AFTER_LOGIN) return { checked: false };
  try {
    const res = await authedFetch("http://localhost:4000/api/users/me");
    if (res.status === 404) {
      return { checked: true, exists: false };
    }
    if (!res.ok) {
      return { checked: true, exists: undefined, error: "Failed to fetch profile." };
    }
    return { checked: true, exists: true };
  } catch (e) {
    return { checked: true, exists: undefined, error: e?.message || "Failed to fetch profile." };
  }
}

export default function SignInPage() {
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

      const check = await maybeCheckProfileExists();
      if (check.checked && check.exists === false) {
        setGOk("Signed in with Firebase, but no profile found yet. Complete signup first.");
      } else if (check.error) {
        setGOk("Signed in. (Profile check skipped or failed — that’s OK for now.)");
      } else {
        setGOk("Signed in successfully.");
      }
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

      const check = await maybeCheckProfileExists();
      if (check.checked && check.exists === false) {
        setCOk("Signed in with Firebase, but no profile found yet. Complete signup first.");
      } else if (check.error) {
        setCOk("Signed in. (Profile check skipped or failed — that’s OK for now.)");
      } else {
        setCOk("Signed in successfully.");
      }
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

      const check = await maybeCheckProfileExists();
      if (check.checked && check.exists === false) {
        setGOk("Google sign-in ok, but no profile yet. Make sure signup finalized created your profile.");
      } else if (check.error) {
        setGOk("Google sign-in ok. (Profile check skipped or failed — that’s OK for now.)");
      } else {
        setGOk("Google sign-in successful.");
      }
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

      const check = await maybeCheckProfileExists();
      if (check.checked && check.exists === false) {
        setCOk("Twitch sign-in ok, but no profile yet. Make sure signup finalized created your profile.");
      } else if (check.error) {
        setCOk("Twitch sign-in ok. (Profile check skipped or failed — that’s OK for now.)");
      } else {
        setCOk("Twitch sign-in successful.");
      }
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
