"use client";

import { useState } from "react";
import Particles from "../../Components/Particles";
import LeftSidebar, { SIDEBAR_WIDTH } from "../../Components/LeftSidebar";
import CenteredSearch from "../../Components/CenteredSearch";

export default function SearchPage() {
    // highlight the Search tab in your sidebar
    const [leftTab, setLeftTab] = useState("search");
    const [q, setQ] = useState("");   // also rename set0 -> setQ (zero → Q)


    return (
        <>
            {/* background */}
            <div className="absolute inset-2 z-0">
                <Particles
                    particleColors={["#ffffff"]}
                    particleCount={200}
                    particleSpread={10}
                    speed={0.1}
                    particleBaseSize={100}
                />
            </div>

            {/* left sidebar */}
            <LeftSidebar active={leftTab} onChange={setLeftTab} />

            {/* MAIN (same layout margins as follow list page) */}
            <main
                className="relative z-10 pt-8"
                style={{ marginLeft: SIDEBAR_WIDTH + 20, marginRight: 24 }}
            >
                <div className="mx-auto max-w-6xl">
                    {/* Card wrapper — same look & feel as FollowListsPage */}
                    <div className="bg-[#2b2142b3] rounded-xl p-6 md:p-8">
                    

                        {/* Your existing CenteredSearch logic/UI */}
                        <CenteredSearch
                            value={q}
                            onChange={setQ}
                            placeholder="Search gamers or clubs…"
                            className="mt-2"
                        />
                    </div>
                </div>
            </main>
        </>
    );
}
