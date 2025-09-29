"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import Particles from "../../../Components/Particles";
import LeftSidebar, { SIDEBAR_WIDTH } from "../../../Components/LeftSidebar";
import { Radio } from "lucide-react";

const CARD = "bg-[#1C1633]/60 border border-[#3b2d5e] rounded-xl";

// demo posts (will change in coming sprints)
const seedPosts = [
  { id: "p1", title: "Valorant-Game start 4 Oct-3pm", team: "Falcons" },
  { id: "p2", title: "Call Of Duty-Game start 12 Oct-4pm", team: "Twisted Minds" },
  { id: "p3", title: "Valorant start 20 Oct-2pm", team: "Vitality" },
  { id: "p4", title: "Rocker League start 22 Oct-12pm", team: "liquid" },
  { id: "p5", title: "Call Of Duty-Game start 26 Oct-3pm", team: "Falcons" },
];

// expand seed data so load-more is visible during dev (replace with API in later sprints)
const ALL_POSTS = Array.from({ length: 48 }, (_, i) => {
  const base = seedPosts[i % seedPosts.length];
  return { id: `p-${i + 1}`, title: base.title, team: base.team };
});


// live row
const liveNow = [
  {
    id: "lv1",//usefule in loading/updating the cards in later sprints
    game: "Valorant",
    channel: "AceCore",
    team: "Team Falcons",
    avatarUrl: "/falcons-esports-csgo.png",
  },
  {
    id: "lv2",
    game: "Call Of Duty",
    channel: "AceCore",
    team: "Team Twisted Minds",
    avatarUrl: "/Logo_background.png",
  },
  {
    id: "lv3",
    game: "Valorant",
    channel: "AceCore",
    team: "Team Vitality",
    avatarUrl: "/OIP.webp",
  },
  {
    id: "lv4",
    game: "Rocker League",
    channel: "AceCore",
    team: "Team liquid",
    avatarUrl: "/R.png",
  },
];

export default function GamerHomePage() {
  const [leftTab, setLeftTab] = useState("home");
  const [q, setQ] = useState("");

  // ---- Load-more for POSTS ----
  const PAGE_SIZE = 6; // show 6, then load 6 more per click
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loadingMore, setLoadingMore] = useState(false);

  // filter posts by search (matches title or game)
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return ALL_POSTS;
    return ALL_POSTS.filter(
      (p) =>
        p.title.toLowerCase().includes(s) || p.game.toLowerCase().includes(s)
    );
  }, [q]);

  const canLoadMore = visibleCount < filtered.length;

  // reset when search changes
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
    setLoadingMore(false);
  }, [q]);

  // click handler for "Load more"
  const handleLoadMore = async () => {
    if (!canLoadMore || loadingMore) return;
    try {
      setLoadingMore(true);

      // If you’re calling an API, do it here and append results instead.
      // This timeout just simulates network latency.
      await new Promise((r) => setTimeout(r, 800));

      setVisibleCount((c) => Math.min(c + PAGE_SIZE, filtered.length));
    } finally {
      setLoadingMore(false);
    }
  };

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

      {/* left sidebar */}
      <LeftSidebar active={leftTab} onChange={setLeftTab} />

      {/* MAIN */}
      <main
        className="relative z-10 pt-8"
        style={{ marginLeft: SIDEBAR_WIDTH + 100, marginRight: 30 }}
      >


        {/* LIVE row  */}
        <section className="mb-7">
          <div className="flex items-center gap-2 text-white/90 mb-3">
            <Radio className="h-6 w-6 text-[#FCCC22]" />
            <h3 className="font-semibold text-[#FCCC22] text-2xl">Live</h3>
          </div>

          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex gap-4 pr-4">
              {liveNow.map((lv) => (
                <article
                  key={lv.id}
                  className={`${CARD} flex-shrink-0 w-[520px] p-0 overflow-hidden hover:bg-[#1C1633]/80 transition-colors`}
                >
                  <div className="h-56 w-full bg-gradient-to-br from-[#5f4a87] via-[#2b2142] to-[#1C1633]" />
                  <div className="p-5">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full overflow-hidden border border-[#3b2d5e] bg-[#1C1633]">
                        {lv.avatarUrl ? (
                          <img
                            src={lv.avatarUrl}
                            alt={lv.channel}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full bg-gradient-to-br from-[#5f4a87] to-[#2b2142]" />
                        )}
                      </div>
                      <Radio className="h-3.5 w-3.5" style={{ color: "#FF4C4C" }} />
                      <span className="text-sm text-gray-300">Live</span>
                    </div>

                    <h3 className="mt-3 text-xl font-extrabold text-white">
                      {lv.game}
                    </h3>
                    <p className="text-sm text-gray-300">{lv.team}</p>

                    <div className="mt-4">
                      <button
                        type="button"
                        className="px-3 py-1.5 rounded-md text-sm font-bold bg-[#FCCC22] text-[#2b2142b3] hover:shadow-[0_0_12px_#FCCC22] transition-shadow"
                      >
                        Watch
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* POSTS (vertical grid + load-more) */}
        <section>
          <h3 className="font-semibold text-2xl text-[#FCCC22]">Posts</h3>
          <div className="mt-3">
            {/* 3 columns on large, 2 on md, 1 on small */}
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-3 gap-4">

              {filtered.slice(0, visibleCount).map((p) => (
                <article
                  key={p.id}
                  className={`${CARD} p-4 hover:bg-[#1C1633]/80 transition-colors`}
                >
                  <div className="h-80 w-full rounded-lg bg-gradient-to-br from-[#5f4a87] to-[#2b2142]" />
                  <div className="mt-3 text-white text-xl font-semibold line-clamp-2">
                    {p.title}
                  </div>
                  <div className="text-sm text-gray-300">Team: {p.team}</div>
                  <div className="mt-4">
                    <button className="px-3 py-1.5 rounded-md text-sm font-bold bg-[#FCCC22] text-[#2b2142b3] hover:shadow-[0_0_12px_#FCCC22] transition-shadow">
                      View
                    </button>
                  </div>
                </article>
              ))}
            </div>

            {/* Load more control */}
            <div className="mt-6 flex items-center justify-center">
              {canLoadMore ? (
                <button
                  disabled={loadingMore}
                  onClick={handleLoadMore}
                  className={`px-4 py-2 rounded-lg font-semibold text-sm
                                bg-[#FCCC22] text-[#2b2142b3] border border-[#3b2d5e]
                                hover:shadow-[0_0_14px_#FCCC22] transition-all
                                disabled:opacity-60 disabled:cursor-not-allowed`}
                >
                  {loadingMore ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="h-4 w-4 inline-block rounded-full border-2 border-[#2b2142b3] border-t-transparent animate-spin" />
                      Loading…
                    </span>
                  ) : (
                    "Load more"
                  )}
                </button>
              ) : (
                <div className="text-xs text-gray-400">No more posts</div>
              )}
            </div>
          </div>
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
