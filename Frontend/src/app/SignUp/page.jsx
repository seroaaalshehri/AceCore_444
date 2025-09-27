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

const actionCodeSettings = {
  url: "http://localhost:3000/SignUp?postVerify=1",
  handleCodeInApp: false,
};

export default function SignUpPage() {
  const [formData, setFormData] = useState({
  // Gamer fields
  gamerUsername: "",
  gamerEmail: "",
  gamerPassword: "",
  gamerBirthdate: "",

  // Club fields
  clubUsername: "",
  clubEmail: "",
  clubPassword: "",
  clubBirthdate: "",
  clubName: "",
  clubAvatar: null,

  // Shared
  role: "",
  games: [],
  gender: "",
  nationality: "",
});


  const [okMsg, setOkMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // Track if the user is currently signed in with Google (from the Google button)
  const [googleUser, setGoogleUser] = useState(null);
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      const isGoogle = u?.providerData?.some((p) => p.providerId === "google.com");
      setGoogleUser(isGoogle ? u : null);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setOkMsg(""); setErrorMsg("");

    // Gamer must pick at least one game
    if (formData.role === "gamer") {
      const games = Array.isArray(formData.games) ? formData.games : [];
      if (games.length === 0) {
        setErrorMsg("Please select at least one game.");
        return;
      }
    }

    try {
      setLoading(true);

      // ===== GAMER FLOW =====
      if (formData.role === "gamer") {
        // If the user already signed in via Google, finalize using that Google account
        if (googleUser) {
          const email = googleUser.email;
          const payload = {
            ...formData,
            email,
            gamerEmail: email,
            uid: googleUser.uid,
            emailVerified: true,
            provider: "google.com",
          };

          // You can either hit your create endpoint or your verify-complete flow.
          const res = await fetch("http://localhost:4000/api/users/verify-complete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, payload }),
          });
          const data = await res.json();

          if (res.ok) {
            setOkMsg("Signed up with Google. Your account is ready — you can log in now.");
          } else {
            // Even if backend finalize fails, don’t block signup UX.
            setOkMsg("Signed up with Google. You can log in now.");
          }
          return;
        }

        // Email+Password path (no Google session)
        const email = String(formData.gamerEmail || "").trim();
        const password = String(formData.password || "").trim();
        if (!email || !password) {
          setErrorMsg("Email and password are required.");
          return;
        }

        // Prevent “email already in use” & provider mixups
        const methods = await fetchSignInMethodsForEmail(auth, email);
        if (methods.includes("google.com")) {
          setErrorMsg(
            "This email is already registered with Google. Please use “Continue with Google”."
          );
          return;
        }
        if (methods.includes("password")) {
          setErrorMsg("This email already has a password account. Please Sign In instead.");
          return;
        }

        // Create password user and send verification
        await createUserWithEmailAndPassword(auth, email, password);
        window.localStorage.setItem("signupPayload", JSON.stringify(formData));
        await sendEmailVerification(auth.currentUser, actionCodeSettings);

        setOkMsg("Verification link sent. After verifying, you’ll be redirected here.");
        return;
      }

      // ===== CLUB (or any non-gamer) FLOW — call your backend as before =====
      const res = await fetch("http://localhost:4000/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (res.ok) setOkMsg("Signed up. Your request is pending admin review.");
      else setErrorMsg(data.message || "Failed to create user.");
    } catch (err) {
      setErrorMsg(err?.message || "Sign up failed.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ On redirect from Firebase (postVerify=1), finalize on backend
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("postVerify") === "1") {
      (async () => {
        try {
          setLoading(true);

          const saved = window.localStorage.getItem("signupPayload");

          // If no saved payload (different device/browser), just confirm success.
          if (!saved) {
            setOkMsg("Your email is verified. You can log in now.");
            const clean = new URL(window.location.href);
            clean.search = "";
            window.history.replaceState({}, "", clean.toString());
            return;
          }

          const payload = JSON.parse(saved);
          const email = payload.gamerEmail || payload.email;
          if (!email) {
            setOkMsg("Your email is verified. You can log in now.");
            const clean = new URL(window.location.href);
            clean.search = "";
            window.history.replaceState({}, "", clean.toString());
            return;
          }

          const res = await fetch("http://localhost:4000/api/users/verify-complete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, payload }),
          });
          const data = await res.json();

          if (res.ok) {
            setOkMsg("Email verified. Your account is ready. You can log in now.");
            window.localStorage.removeItem("signupPayload");
          } else {
            setOkMsg("Your email is verified. You can log in now.");
          }

          const clean = new URL(window.location.href);
          clean.search = "";
          window.history.replaceState({}, "", clean.toString());
        } catch {
          setOkMsg("Your email is verified. You can log in now.");
          const clean = new URL(window.location.href);
          clean.search = "";
          window.history.replaceState({}, "", clean.toString());
        } finally {
          setLoading(false);
        }
      })();
    }
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
