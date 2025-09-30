"use client";



import { useParams } from "next/navigation";
import { useState } from "react";
import Particles from "../../../Components/Particles";
import LeftSidebar, { SIDEBAR_WIDTH } from "../../../Components/LeftSidebar";
import CenteredSearch from "../../../Components/CenteredSearch";

export default function SearchPage() {
    const [leftTab, setLeftTab] = useState("search");
    const [q, setQ] = useState("");   
    const { id } = useParams();
    const userId = Array.isArray(id) ? id[0] : id;


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

           <LeftSidebar role="gamer" active="search" userId={userId} />
            <main className="p-4" style={{ marginLeft: SIDEBAR_WIDTH }}>
           
                <div className="mx-auto max-w-6xl">

                    <div className="bg-[#2b2142b3] rounded-xl p-6 md:p-8">


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
