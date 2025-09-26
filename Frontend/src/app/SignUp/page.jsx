"use client";

import { SignUpIn } from "../Components/SignUpIn";
import Particles from "../Components/Particles";
import React, { useState } from "react";

import "../SignUpIn.css";

export default function Home() {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    birthdate: "",
    gamerEmail: "",       
    clubEmail: "",         
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch("http://localhost:4000/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
       
      });

      const data = await res.json();
      if (res.ok) {
        console.log("✅ User created:", data);
        alert("User created successfully!");
      } else {
        console.error("❌ Error:", data.message);
        alert("Failed to create user.");
      }
    } catch (err) {
      console.error("❌ Request failed:", err);
      alert("Error sending request.");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen font-barlow overflow-x-hidden relative">
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

      {/* Sign Up Component */}
      <SignUpIn
        formData={formData}
        handleChange={handleChange}
        handleSubmit={handleSubmit}
      />
    </div>
  );
}
