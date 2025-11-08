"use client";

import { useMemo } from "react";
import useSWR from "swr";
import Particles from "../../../Components/Particles";
import LeftSidebar, { SIDEBAR_WIDTH } from "../../../Components/LeftSidebar";
import { Radio } from "lucide-react";
import { useParams } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";
const fetcher = (u) => fetch(u).then((r) => r.json());

// keep your styles
const CARD = "bg-[#1d1530] border border-[#3b2d5e] rounded-xl";

export default function GamerHomePage() {
  const params = useParams();
  const raw = params?.id;
  const viewerId = Array.isArray(raw) ? raw[0] : String(raw || "");

  // fetch live cards every 15s
  const { data, isLoading, error } = useSWR(
    viewerId ? `${API}/api/home/live-cards?viewerId=${viewerId}` : null,
    fetcher,
    { refreshInterval: 15000 }
  );

  const liveCards = useMemo(() => (data && data.ok ? data.cards || [] : []), [data]);

  return (
    <>
      {/* background */}
      <div className="absolute inset-2 z-0">
        <Particles
          particleColors={["#ffffff"]}
          particleCount={160}
          particleSpread={10}
          speed={0.1}
          particleBaseSize={100}
        />
      </div>

      <LeftSidebar role="gamer" active="twitchLives" userId={viewerId} />
      <main
        className="relative z-10 pt-8 p-4"
        style={{ marginLeft: SIDEBAR_WIDTH + 100, marginRight: 30 }}
      >
        {/* LIVE row */}
        <section className="mb-7">
          <div className="flex items-center gap-2 text-white/90 mb-3">
            <Radio className="h-6 w-6 text-[#FCCC22]" />
            <h3 className="font-semibold text-[#FCCC22] text-2xl">Lives on Twitch</h3>
          </div>

          {!viewerId && (
            <div className="text-red-400">
              Missing user id in the URL. (Expected route: /gamer/home/[id])
            </div>
          )}

          {viewerId && isLoading && (
            <div className="text-gray-300">Loading live streams…</div>
          )}

          {viewerId && error && (
            <div className="text-red-400">
              Failed to load live streams. Try again.
            </div>
          )}

          {viewerId && !isLoading && !error && liveCards.length === 0 && (
            <div className="text-gray-400">No clubs you follow are live right now.</div>
          )}

          {viewerId && !isLoading && !error && liveCards.length > 0 && (
            <div className="overflow-x-auto scrollbar-hide">
              <div className="flex gap-4 pr-4">
                {liveCards.map((lv) => (
                  <article
                    key={lv.clubId}
                    className={`${CARD} flex-shrink-0 w-[520px] p-0 overflow-hidden hover:bg-[#140e24] transition-colors`}
                  >
                    {/* banner */}
                      {lv.previewUrl ? (
    <img
      src={lv.previewUrl}
      alt={lv.title || lv.game || "Live preview"}
      className="h-56 w-full object-cover"
      loading="lazy"
    />
  ) : (
    <div className="h-56 w-full bg-gradient-to-br from-[#5f4a87] via-[#2b2142] to-[#1C1633]" />
  )}
                    <div className="p-5">
                      <div className="flex items-center gap-3">
                         <Radio className="h-6 w-6" style={{ color: "#FF4C4C" }} />
                        <span className="text-xl font-extrabold text-gray-300">Live</span>
                      </div>

                     <div className="flex items-center gap-2 mt-5">

  <div className="h-11 w-11 rounded-full overflow-hidden border border-[#3b2d5e] bg-[#1C1633] ">
    {lv.channelPhoto ? (
      <img 
        src={lv.channelPhoto} 
        alt={lv.clubName || "Club"} 
        className="w-full h-full object-cover"
      />
    ) : (
      <div className="w-full h-full bg-gradient-to-br from-[#5f4a87] via-[#2b2142] to-[#1C1633]" />
    )}
  </div>

  <p className="text-xl font-bold text-gray-400 ">
   {"@"}{lv.clubName || "Club"}
  </p>
</div>



                      <h3 className="mt-3 text-2xl font-extrabold text-white">
                        {lv.title || "Live now"}
                      </h3>
                 

                    <div className="mt-4 flex">
  <a
    href={lv.watchUrl}
    target="_blank"
    rel="noreferrer"
    className="ml-auto inline-block px-3 py-1.5 rounded-md text-sm font-bold bg-[#FCCC22] text-[#2b2142b3] hover:shadow-[0_0_12px_#FCCC22] transition-shadow"
  >
    Watch
  </a>
</div>

                      
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}
        </section>
      </main>

      {/* hide scrollbars for horizontal areas */}
      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </>
  );
}
