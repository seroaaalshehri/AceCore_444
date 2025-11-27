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
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  signInWithCustomToken,
  OAuthProvider,
  linkWithPopup,
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
  if (user?.role === "club") return `/club/profile/${user.id}`;
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


// UPDATED: helper to call your backend login and get a Firebase custom token
async function loginWithUsernamePassword(identifier, password) { // UPDATED
  const res = await fetch("http://localhost:4000/api/users/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      // Backend currently expects username. We pass whatever the user typed
      // (username or email). If your backend only accepts username, ensure
      // the input is username on the UI; otherwise extend backend to accept email too.
      username: String(identifier || "").trim(), // UPDATED
      password: String(password || ""),          // UPDATED
    }),
  });
  const data = await res.json();
  if (!res.ok || !data?.success || !data?.customToken) {
    throw new Error(data?.message || "Login failed."); // UPDATED
  }
  return data.customToken; // UPDATED
}

export default function SignInPage() {
  const router = useRouter();
  const [authBusy, setAuthBusy] = useState(false);
  const [isClub, setIsClub] = useState(false);
  const [gLoading, setGLoading] = useState(false);
  const [gError, setGError] = useState("");
  const [gOk, setGOk] = useState("");
  const [cLoading, setCLoading] = useState(false);
  const [cError, setCError] = useState("");
  const [cOk, setCOk] = useState("");

  const onGamerEmailLogin = async (email, password) => {
    setGError(""); setGOk(""); setGLoading(true);
    try {
      if (!email) throw new Error("Please enter your email or username."); // UPDATED (loosened msg)
      if (!password) throw new Error("Please enter your password.");

      // UPDATED: Use backend /login → custom token → Firebase session
      // We intentionally do NOT call signInWithEmailAndPassword here, since
      // you asked to use the custom-token path with the login endpoint.
      const customToken = await loginWithUsernamePassword(email, password); // UPDATED
      await signInWithCustomToken(auth, customToken);                       // UPDATED

      await redirectAfterLogin(router, setGOk, setGError);
    } catch (err) {
      console.log("AUTH FAIL =>", err?.code, err?.message, err?.customData); // UPDATED (extra debug)
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
      if (!email) throw new Error("Please enter your email or username."); // UPDATED (loosened msg)
      if (!password) throw new Error("Please enter your password.");

      
      const customToken = await loginWithUsernamePassword(email, password); // UPDATED
      await signInWithCustomToken(auth, customToken);                       

      await redirectAfterLogin(router, setCOk, setCError);
    } catch (err) {
      console.log("AUTH FAIL =>", err?.code, err?.message, err?.customData); // UPDATED (extra debug)
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

// Twitch (Club via OIDC)
// Twitch (Club via OIDC)
// Twitch (Club via OIDC)
const handleTwitchSignIn = async () => {
  setCError(""); setCOk(""); setCLoading(true);

  try {
    // Be sure we start clean
    if (auth.currentUser) await signOut(auth);

    // 1) Start Twitch OIDC popup
    const provider = new OAuthProvider("oidc.twitch");
    provider.addScope("openid");
    provider.addScope("user:read:email");

    const result = await signInWithPopup(auth, provider);

    // 2) Email may be missing with Twitch OIDC — try Firebase first
    let email = (result && result.user && result.user.email) || "";

    // Grab the Twitch OIDC credential to extract the user access token
    const credential = OAuthProvider.credentialFromResult(result);
    const accessToken = credential && credential.accessToken ? credential.accessToken : "";

    // If no email, ask backend to call Helix /users using the access token
    if (!email && accessToken) {
      const r = await fetch("http://localhost:4000/api/users/twitch/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ accessToken }),
      });
      if (r.ok) {
        const j = await r.json().catch(() => ({}));
        if (j && j.email) email = j.email;
      }
    }

    if (!email) {
      throw new Error("Twitch did not return an email. Please complete signup first.");
    }

    // 3) Ask backend to mint a custom token for the EXISTING Firebase UID of that email
    const claimRes = await fetch("http://localhost:4000/api/users/claim-by-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email: String(email || "").trim().toLowerCase() }),
    });

    if (claimRes.status === 404) {
      // Don’t redirect — just surface the same banner you already show
      throw new Error("Profile not found. Complete signup first.");
    }
    if (!claimRes.ok) {
      const body = await claimRes.json().catch(() => ({}));
      throw new Error(body?.message || "Could not claim existing account.");
    }

    const { customToken } = await claimRes.json();

    // 4) We’re currently signed in as a temporary Twitch UID. Swap to the canonical UID.
    await signOut(auth);
    await signInWithCustomToken(auth, customToken);

    // 5) Link Twitch provider to the canonical user so future Twitch sign-ins return SAME UID
    try {
      if (credential) {
        const { linkWithCredential } = await import("firebase/auth");
        await linkWithCredential(auth.currentUser, credential);
      } else {
        const { linkWithPopup } = await import("firebase/auth");
        const linkProvider = new OAuthProvider("oidc.twitch");
        linkProvider.addScope("openid");
        linkProvider.addScope("user:read:email");
        await linkWithPopup(auth.currentUser, linkProvider);
      }
    } catch (linkErr) {
      const code = String(linkErr?.code || "");
      // Safe to ignore if already linked
      if (code !== "auth/credential-already-in-use" && code !== "auth/provider-already-linked") {
        throw linkErr;
      }
    }

    // 6) Normal post-login redirect (now /me will resolve because UID matches your DB)
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

     
      <div className="relative z-10 w-full">
      

        <SignIn
          isClub={isClub}
          setIsClub={setIsClub}
          onGamerEmailLogin={onGamerEmailLogin}
          onClubEmailLogin={onClubEmailLogin}
          onGoogleLogin={onGoogleLogin}
          handleTwitchSignIn={handleTwitchSignIn}
          gLoading={gLoading}
          gError={gError}
          cLoading={cLoading}
          cError={cError}
        />
      </div>
    </main>
  );
}