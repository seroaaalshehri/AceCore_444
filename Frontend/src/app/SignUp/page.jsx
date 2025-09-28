"use client";

import { SignUpIn } from "../Components/SignUpIn";
import Particles from "../Components/Particles";
import React, { useEffect, useState } from "react";
import "../SignUpIn.css";
import { auth } from "../../../lib/firebaseClient";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  fetchSignInMethodsForEmail,
  onAuthStateChanged,
} from "firebase/auth";

const API_BASE = "http://localhost:4000/api/users";

const actionCodeSettings = {
  url: "http://localhost:3000/SignUp?postVerify=1",
  handleCodeInApp: false,
};

export default function SignUpPage() {
  const [formData, setFormData] = useState({
    // Gamer
    gamerUsername: "",
    gamerEmail: "",
    gamerPassword: "",
    // Club
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
    role: "", // "gamer" | "club" (set by SignUpIn toggle)
    birthdate: null,
    games: [],
    gender: "",
    nationality: "",
    // Set by the Google button in SignUpIn
    signupMethod: "", // "oauth" after clicking Google
  });

  const [okMsg, setOkMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // Track a Google OAuth session (but DO NOT auto-finalize)
  const [googleUser, setGoogleUser] = useState(null);
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      const byGoogle = u?.providerData?.some((p) => p.providerId === "google.com");
      setGoogleUser(byGoogle ? u : null);
    });
    return () => unsub();
  }, []);

  const handleChange = (eOrObj) => {
    setOkMsg("");
    setErrorMsg("");
    const name = eOrObj?.target?.name;
    const value = eOrObj?.target?.value;
    if (!name) return;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ---- payload mappers ----
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
      authUid: overrides.authUid ?? "",
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

  // ========================
  // SUBMIT (user pressed Sign Up)
  // ========================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setOkMsg("");
    setErrorMsg("");

    try {
      setLoading(true);

      // ---------------- Gamer ----------------
      if (formData.role === "gamer") {
        // A) Google OAuth path — finalize NOW (only on button press)
        if (formData.signupMethod === "oauth" && googleUser) {
          const email = googleUser.email;
          const uid = googleUser.uid;

          const payload = mapGamerPayload({
            email,
            emailVerified: true,
            provider: "google.com",
            authUid: uid,
            password: "", // not needed for Google
          });

          const res = await fetch(`${API_BASE}/verify-complete`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, payload }),
          });

          if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            throw new Error(body?.message || "Sign-up failed. Please try again.");
          }

          setOkMsg("Google sign-up successfully. you can sign in.");
          return;
        }

        // B) Email + Password path — create Auth user and send verification email
        const email = String(formData.gamerEmail || "").trim();
        const password = String(formData.gamerPassword || "").trim();
        if (!email || !password) {
          setErrorMsg("Sign-up failed. Please try again.");
          return;
        }

        // Avoid provider collisions
        const methods = await fetchSignInMethodsForEmail(auth, email);
        if (methods.includes("google.com")) {
          setErrorMsg("Sign-up failed. Please try again.");
          return;
        }
        if (methods.includes("password")) {
          setErrorMsg("Sign-up failed. Please try again.");
          return;
        }

        // Create Auth user, store payload for verify-complete, send verification
        const cred = await createUserWithEmailAndPassword(auth, email, password);

        const payloadForBackend = mapGamerPayload({
          email,
          emailVerified: false,
          provider: "password",
          authUid: cred.user.uid,
        });
        window.localStorage.setItem("signupPayload", JSON.stringify(payloadForBackend));

        await sendEmailVerification(auth.currentUser, actionCodeSettings);
        setOkMsg("Verification email sent.");
        return;
      }

      // ---------------- Club ----------------
      if (formData.role === "club") {
        const clubPayload = mapClubPayload();
        const res = await fetch(`${API_BASE}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(clubPayload),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.message || "Sign-up failed. Please try again.");
        }
        setOkMsg("Verification email sent."); // keep minimal; adjust if you prefer a different text for club
      }
    } catch (err) {
      setErrorMsg("Sign-up failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ========================
  // FINALIZE EMAIL FLOW (after clicking the link)
  // ========================
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("postVerify") !== "1") return;

    (async () => {
      try {
        setLoading(true);

        const saved = window.localStorage.getItem("signupPayload");
        if (saved) {
          const payload = JSON.parse(saved);
          const email = payload.gamerEmail || payload.email;

          if (email) {
            await fetch(`${API_BASE}/verify-complete`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email, payload }),
            }).catch(() => {});
            window.localStorage.removeItem("signupPayload");
          }
        }

        setOkMsg("Email verified. You can sign in now.");
      } catch {
        setOkMsg("Email verified. You can sign in now.");
      } finally {
        const clean = new URL(window.location.href);
        clean.search = "";
        window.history.replaceState({}, "", clean.toString());
        setLoading(false);
      }
    })();
  }, []);

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

      {/* Minimal banner */}
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
