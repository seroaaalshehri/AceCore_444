"use client";

import { SignUpIn } from "../Components/SignUpIn";
import Particles from "../Components/Particles";
import React, { useEffect, useRef, useState } from "react";
import "../SignUpIn.css";
import { auth } from "../../../lib/firebaseClient";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  fetchSignInMethodsForEmail,
  onAuthStateChanged,
} from "firebase/auth";

// 🔧 your API base
const API_BASE = "http://localhost:4000/api/users";

// Hosted email verification for email+password signups
const actionCodeSettings = {
  url: "http://localhost:3000/SignUp?postVerify=1",
  handleCodeInApp: false,
};

export default function SignUpPage() {
  // Form state shared with the SignUpIn UI
  const [formData, setFormData] = useState({
    // Gamer fields
    gamerUsername: "",
    gamerEmail: "",
    gamerPassword: "",
    // Club fields
    clubUsername: "",
    clubEmail: "",
    clubPassword: "",
    clubName: "",
    clubAvatar: null,
    country: "",
    twitch: "",
    x: "",
    youtube: "",
    discord: "",
    // Shared
    role: "",            // set by SignUpIn toggle: "gamer" | "club"
    birthdate: null,
    games: [],
    gender: "",
    nationality: "",
    // UI hint set by SignUpIn when Google was used
    signupMethod: "",    // "oauth" when user clicked Google in SignUpIn
  });

  const [okMsg, setOkMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // Track a Google user (or any OAuth user) from Firebase
  const [googleUser, setGoogleUser] = useState(null);
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      const byGoogle = u?.providerData?.some((p) => p.providerId === "google.com");
      setGoogleUser(byGoogle ? u : null);
    });
    return () => unsub();
  }, []);

  const handleChange = (eOrObj) => {
    setOkMsg(""); setErrorMsg("");
    const name = eOrObj?.target?.name;
    const value = eOrObj?.target?.value;
    if (!name) return;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Map form -> backend payloads
  const mapGamerPayload = (overrides = {}) => {
    const email = overrides.email ?? formData.gamerEmail ?? "";
    return {
      role: "gamer",
      username: formData.gamerUsername?.trim() || "",
      email,
      gamerEmail: email,
      password: overrides.password ?? formData.gamerPassword ?? "",
      games: Array.isArray(formData.games) ? formData.games : [],
      gender: formData.gender || "",
      nationality: formData.nationality || "",
      birthdate: formData.birthdate || null,
      emailVerified: overrides.emailVerified ?? false,
      provider: overrides.provider ?? "password",
      authUid: overrides.authUid ?? "",   // IMPORTANT
    };
  };

  const mapClubPayload = () => ({
    role: "club",
    username: formData.clubUsername?.trim() || "",
    email: formData.clubEmail?.trim() || "",
    clubEmail: formData.clubEmail?.trim() || "",
    password: formData.clubPassword ?? "",
    games: Array.isArray(formData.games) ? formData.games : [],
    country: formData.country || "",
    clubName: formData.clubName || "",
    socials: {
      twitch: formData.twitch || "",
      x: formData.x || "",
      youtube: formData.youtube || "",
      discord: formData.discord || "",
    },
  });

  // ---- 1) HANDLE SUBMIT (Gamer or Club) ----
  const handleSubmit = async (e) => {
    e.preventDefault();
    setOkMsg(""); setErrorMsg("");

    try {
      setLoading(true);

      if (formData.role === "gamer") {
        // If the UI Google button was used, we finalize via the effect below.
        if (formData.signupMethod === "oauth" && googleUser) {
          setOkMsg("Google account detected. Finalizing signup…");
          return; // the effect will POST to /verify-complete for us
        }

        // Email+Password path (no Google session).
        const email = String(formData.gamerEmail || "").trim();
        const password = String(formData.gamerPassword || "").trim();
        if (!email || !password) {
          setErrorMsg("Email and password are required.");
          return;
        }

        // Optional: keep users from duplicating with Google
        const methods = await fetchSignInMethodsForEmail(auth, email);
        if (methods.includes("google.com")) {
          setErrorMsg("This email is already registered with Google. Use “Continue with Google”.");
          return;
        }

        // Create the Firebase Auth user (we need the UID for your profile link)
        const cred = await createUserWithEmailAndPassword(auth, email, password);

        // Save payload (WITH authUid) for the post-verify finalize step
        const payloadForBackend = mapGamerPayload({
          email,
          emailVerified: false,
          provider: "password",
          authUid: cred.user.uid, // <- CRITICAL to avoid "profile not found" at login
        });
        window.localStorage.setItem("signupPayload", JSON.stringify(payloadForBackend));

        // Email verification
        await sendEmailVerification(auth.currentUser, actionCodeSettings);
        setOkMsg("Verification link sent. After verifying, you’ll return here and we’ll finish creating your profile.");
        return;
      }

      // Club path (no OAuth here yet) — write profile now
      if (formData.role === "club") {
        const clubPayload = mapClubPayload();
        const res = await fetch(`${API_BASE}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(clubPayload),
        });
        const data = await res.json();
        if (res.ok) setOkMsg(`Club profile saved as ${data?.id || "userN"}.`);
        else setErrorMsg(data?.message || "Failed to create club profile.");
      }
    } catch (err) {
      setErrorMsg(err?.message || "Sign up failed.");
    } finally {
      setLoading(false);
    }
  };

  // ---- 2) FINALIZE EMAIL FLOW ON REDIRECT (?postVerify=1) ----
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("postVerify") !== "1") return;

    (async () => {
      try {
        setLoading(true);
        const saved = window.localStorage.getItem("signupPayload");
        if (!saved) {
          setOkMsg("Email verified. You can sign in now.");
        } else {
          const payload = JSON.parse(saved);
          const email = payload.gamerEmail || payload.email;
          if (!email) {
            setOkMsg("Email verified. You can sign in now.");
          } else {
            // Create users/userN (+ authLinks/{authUid})
            const res = await fetch(`${API_BASE}/verify-complete`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email, payload }),
            });
            if (res.ok) {
              setOkMsg("Email verified and profile saved. You can sign in now.");
              window.localStorage.removeItem("signupPayload");
            } else {
              setOkMsg("Email verified. You can sign in now.");
            }
          }
        }
      } catch {
        setOkMsg("Email verified. You can sign in now.");
      } finally {
        // Clean the URL
        const clean = new URL(window.location.href);
        clean.search = "";
        window.history.replaceState({}, "", clean.toString());
        setLoading(false);
      }
    })();
  }, []);

  // ---- 3) FINALIZE GOOGLE FLOW (no redirects, no navigation) ----
  // Your SignUpIn component sets: handleChange({ name: "signupMethod", value: "oauth" })
  // We watch for that + a Google user session, then POST once.
  const googleFinalizedRef = useRef(false);
  useEffect(() => {
    if (!googleUser) return;
    if (formData.role !== "gamer") return;
    if (formData.signupMethod !== "oauth") return;
    if (googleFinalizedRef.current) return; // only once per mount

    googleFinalizedRef.current = true;

    (async () => {
      try {
        setLoading(true);
        const email = googleUser.email;
        const uid = googleUser.uid;

        const payload = mapGamerPayload({
          email,
          emailVerified: true,
          provider: "google.com",
          authUid: uid,
          password: "", // not used for google
        });

        const res = await fetch(`${API_BASE}/verify-complete`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, payload }),
        });

        if (res.ok) {
          setOkMsg("Google signup complete — profile saved.");
        } else {
          // Even if backend finalize fails, tell the user they can try sign-in
          setOkMsg("Google account connected. If you cannot sign in, try again in a moment.");
        }
      } catch (e) {
        setOkMsg("Google account connected. If you cannot sign in, try again.");
      } finally {
        setLoading(false);
      }
    })();
  }, [googleUser, formData.role, formData.signupMethod]); // runs when user clicked Google and Firebase session exists

  return (
    <div className="flex items-center justify-center min-h-screen font-barlow overflow-x-hidden relative">
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

      {/* Banner only; no redirects */}
      <div className="absolute top-4 w-full flex justify-center z-10">
        {errorMsg ? (
          <div className="px-4 py-2 rounded bg-red-600/90 text-white text-sm shadow">{errorMsg}</div>
        ) : okMsg ? (
          <div className="px-4 py-2 rounded bg-green-600/90 text-white text-sm shadow">{okMsg}</div>
        ) : null}
      </div>

      <SignUpIn
        formData={formData}
        handleChange={handleChange}
        handleSubmit={handleSubmit}
      />
    </div>
  );
}
