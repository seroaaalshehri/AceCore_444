"use client"

import React from "react"
import "../globals.css"
import Particles from "../Components/Particles"
import Link from "next/link"
import LeftSidebar from "../Components/LeftSidebar"
import Search from "../Components/Search"
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../../lib/firebaseClient";
import { authedFetch } from "../../../lib/authedFetch";

export default function SearchPage() {
    const [userId, setUserId] = React.useState(null);
const [role, setRole] = React.useState(null);

  React.useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser) return;
      try {
        const res = await authedFetch("http://localhost:4000/api/users/me");
        const data = await res.json();
if (data?.user) {
  setUserId(data.user.id);
  setRole(data.user.role || "gamer");
}
      } catch (e) {
        console.error(e);
      }
    });
    return () => unsub();
  }, []);

  if (!userId) return <div className="text-gray-400 p-6">Loading...</div>;
  return (
    <div className="flex min-h-screen">
      <div className="w-[250px]">
<LeftSidebar role={role} active="search" userId={userId} clubDynamic />
      </div>

      <div className="flex-1 flex flex-col bg-[acecoreBackground] font-barlow overflow-x-hidden">
        <div className="relative w-full min-h-screen">
          <div className="fixed inset-0 z-0 h-full">
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

          <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-7xl mx-auto relative z-10">
            <section className="rounded-xl p-6 shadow-lg bg-[#2b2142b3]">
              <h1 className="text-4xl font-bold text-[#fccc22] mb-6">SEARCH</h1>
              <Search />
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}