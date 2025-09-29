"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import Particles from "../../Components/Particles";
import LeftSidebar, { SIDEBAR_WIDTH } from "../../Components/LeftSidebar";
import { Plus } from "lucide-react";

const CARD = "bg-[#1C1633]/60 border border-[#3b2d5e] rounded-xl";

/* --- demo posts (will change in coming sprints) --- */
const seedPosts = [
  { id: "p1", title: "Valorant — Game starts 4 Oct · 3pm", team: "Falcons" },
  { id: "p2", title: "Call Of Duty — Game starts 12 Oct · 4pm", team: "Twisted Minds" },
  { id: "p3", title: "Valorant — Game starts 20 Oct · 2pm", team: "Vitality" },
  { id: "p4", title: "Rocket League — Game starts 22 Oct · 12pm", team: "Liquid" },
  { id: "p5", title: "Call Of Duty — Game starts 26 Oct · 3pm", team: "Falcons" },
];

/* expand seed data so load-more is visible during dev (replace with API later) */
const ALL_POSTS = Array.from({ length: 48 }, (_, i) => {
  const base = seedPosts[i % seedPosts.length];
  return { id: `p-${i + 1}`, title: base.title, team: base.team };
});

export default function ClubHomePage() {
  const [leftTab, setLeftTab] = useState("home");
  const [q, setQ] = useState("");

  /* ---- Load-more for POSTS ---- */
  const PAGE_SIZE = 6;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loadingMore, setLoadingMore] = useState(false);

  /* filter posts by search (matches title or team) */
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return ALL_POSTS;
    return ALL_POSTS.filter((p) => {
      const title = p.title?.toLowerCase() || "";
      const team = p.team?.toLowerCase() || "";
      return title.includes(s) || team.includes(s);
    });
  }, [q]);

  const canLoadMore = visibleCount < filtered.length;

  /* reset when search changes */
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
    setLoadingMore(false);
  }, [q]);

  /* click handler for "Load more" */
  const handleLoadMore = async () => {
    if (!canLoadMore || loadingMore) return;
    try {
      setLoadingMore(true);
      await new Promise((r) => setTimeout(r, 800)); // simulate API latency
      setVisibleCount((c) => Math.min(c + PAGE_SIZE, filtered.length));
    } finally {
      setLoadingMore(false);
    }
  };

  /* add post */
  const onAddPost = () => {
    // TODO: open modal or navigate to your "create post" page
    // e.g. router.push("/club/posts/new")
    console.log("Add Post clicked");
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
        style={{ marginLeft: SIDEBAR_WIDTH + 100, marginRight: 24 }}
      >

        {/* POSTS (vertical grid + load-more) */}
        <section >
          <div className=" flex items-center justify-between">
            <h2 className="font-semibold text-xl text-[#FCCC22]">Posts</h2>
            <button
              type="button"
              onClick={onAddPost}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-bold bg-[#FCCC22] text-[#2b2142b3] hover:shadow-[0_0_12px_#FCCC22] transition-shadow"
              aria-label="Add Post"
              title="Add Post"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Post</span>
            </button>
          </div>

          <div className="mt-3">
            {/* 3 columns on large, 2 on md, 1 on small */}
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-3 gap-4">
              {filtered.slice(0, visibleCount).map((p) => (
                <article
                  key={p.id}
                  className={`${CARD} p-4 hover:bg-[#1C1633]/80 transition-colors`}
                >
                  <div className="h-80 w-full rounded-lg bg-gradient-to-br from-[#5f4a87] to-[#2b2142]" />
                  <div className="mt-3 text-xl text-white font-semibold line-clamp-2">
                    {p.title}
                  </div>
                  <div className="text-s text-gray-300">Team: {p.team}</div>
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

      </main >
    </>
  );
}
