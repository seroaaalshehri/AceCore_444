"use client";

import { SignUpIn } from "../Components/SignUpIn";
import Particles from "../Components/Particles";
import React, { useEffect, useState } from "react";
import "../SignUpIn.css";
import { auth } from "../../../lib/firebaseClient";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
} from "firebase/auth";


const actionCodeSettings = {
  url: "http://localhost:3000/SignUp?postVerify=1",
  handleCodeInApp: false,
};

export default function SignUpPage() {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    birthdate: "",
    gamerEmail: "",
    clubEmail: "",
    role: "",
    games: [],
  });

  const [okMsg, setOkMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

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

    if (formData.role === "gamer") {
      const games = Array.isArray(formData.games) ? formData.games : [];
      if (games.length === 0) {
        setErrorMsg("Please select at least one game.");
        return;
      }
    }

    try {
      setLoading(true);

      if (formData.role === "gamer" && formData.gamerEmail) {
        const email = String(formData.gamerEmail).trim();
        const password = String(formData.password || "").trim();
        if (!email || !password) {
          setErrorMsg("Email and password are required.");
          return;
        }

    
        await createUserWithEmailAndPassword(auth, email, password);
        window.localStorage.setItem("signupPayload", JSON.stringify(formData));
        await sendEmailVerification(auth.currentUser, actionCodeSettings);

        setOkMsg("Verification link sent. After verifying, you’ll be redirected here.");
        setLoading(false);
        return; 
      }

      // ===== CLUB or any non-gamer flow — call your backend as before =====
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

          // NEW: If no saved payload (different device/browser), don't error—just show success.
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
            const clean = new URL(window.location.href);
            clean.search = "";
            window.history.replaceState({}, "", clean.toString());
          } else {
            // Even if finalize fails, don't scare the user—prompt login.
            setOkMsg("Your email is verified. You can log in now.");
            const clean = new URL(window.location.href);
            clean.search = "";
            window.history.replaceState({}, "", clean.toString());
          }
        } catch (e) {
          // Same: keep user flow simple → log in now.
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
