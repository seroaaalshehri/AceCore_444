"use client";

import { SignUpIn } from "../Components/SignUpIn";
import Particles from "../Components/Particles";
import React, { useEffect, useState } from "react";
import "../SignUpIn.css";

// 🔽 add these
import { auth } from "../../../lib/firebaseClient";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  onAuthStateChanged,
  applyActionCode,
  reload,
} from "firebase/auth";

export default function Home() {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    birthdate: "",
    gamerEmail: "",
    clubEmail: "",
    role: "",              // ← will be set by SignUpIn (gamer|club)
    games: [],             // for gamer validation
  });

  const [okMsg, setOkMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setOkMsg(""); setErrorMsg("");
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handles BOTH roles. For gamer with typed email: do Auth+verify first.
  const handleSubmit = async (e) => {
    e.preventDefault();
    setOkMsg(""); setErrorMsg("");

    // require at least one game if gamer
    if (formData.role === "gamer") {
      const games = Array.isArray(formData.games) ? formData.games : [];
      if (games.length === 0) {
        setErrorMsg("Please select at least one game.");
        return;
      }
    }

    try {
      setLoading(true);

      // ===== GAMER with typed email: do Firebase Auth + send verification =====
      if (formData.role === "gamer" && formData.gamerEmail) {
        const email = String(formData.gamerEmail).trim();
        const password = String(formData.password || "").trim();
        if (!email || !password) {
          setErrorMsg("Email and password are required.");
          return;
        }

        // 1) create auth user (if exists, Firebase will throw)
        const { user } = await createUserWithEmailAndPassword(auth, email, password);

        // 2) send verification link
        await sendEmailVerification(user);

        setOkMsg("We sent a verification link to your email. Please verify, then come back.");
        setLoading(false);
        return; // 🚪 stop here; we will create Firestore profile AFTER verification
      }

      // ===== CLUB or any non-gamer flow: just hit your backend as before =====
      const res = await fetch("http://localhost:4000/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (res.ok) {
        setOkMsg("Signed up. Your request is pending admin review.");
      } else {
        setErrorMsg(data.message || "Failed to create user.");
      }
    } catch (err) {
      setErrorMsg(err?.message || "Sign up failed.");
    } finally {
      setLoading(false);
    }
  };

  // When user clicks the email link, Firebase loads your app with ?mode=verifyEmail&oobCode=...
  // Handle that here, then create the Firestore document.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get("mode");
    const oobCode = params.get("oobCode");

    (async () => {
      if (mode === "verifyEmail" && oobCode) {
        try {
          setLoading(true);
          await applyActionCode(auth, oobCode);

          // ensure auth.currentUser reflects verified flag
          if (auth.currentUser) {
            await reload(auth.currentUser);
          }

          // Create the Firestore profile now (gamer path)
          const res = await fetch("http://localhost:4000/api/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...formData,
              // make sure gamerEmail is the canonical email we used
              email: formData.gamerEmail || formData.email,
              role: "gamer",
            }),
          });
          const data = await res.json();

          if (res.ok) {
            setOkMsg("Email verified. Your account is ready. You can log in now.");
            // (optional) clear query params from URL
            const clean = new URL(window.location.href);
            clean.search = "";
            window.history.replaceState({}, "", clean.toString());
          } else {
            setErrorMsg(data.message || "Failed to create user after verification.");
          }
        } catch (err) {
          setErrorMsg(err?.message || "Email verification failed.");
        } finally {
          setLoading(false);
        }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount

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

      {/* Simple inline alerts (you can style later) */}
      <div className="absolute top-4 w-full flex justify-center z-10">
        {errorMsg ? (
          <div className="px-4 py-2 rounded bg-red-600/90 text-white text-sm shadow">
            {errorMsg}
          </div>
        ) : okMsg ? (
          <div className="px-4 py-2 rounded bg-green-600/90 text-white text-sm shadow">
            {okMsg}
          </div>
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
