"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { User as UserIcon } from "lucide-react";

import Particles from "../../../Components/Particles";
import LeftSidebar, { SIDEBAR_WIDTH } from "../../../Components/LeftSidebar";
import { authedFetch } from "../../../../../lib/authedFetch";


const RAW_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000";
const API_ROOT = String(RAW_BASE).replace(/\/+$/, "");


function api(path) {
  const p = path.startsWith("/") ? path : `/${path}`;
  if (API_ROOT.endsWith("/api")) return `${API_ROOT}${p.replace(/^\/api/, "")}`;
  return `${API_ROOT}${p}`;
}

/* -------------------- UI classes -------------------- */
const GOLD_BTN =
  "bg-[#FCCC22] text-[#2b2142b3] font-bold px-3 py-1 rounded text-l disabled:opacity-60 hover:shadow-[0_0_16px_#FCCC22] transition-shadow";
const GOLD_BTN_GHOST =
  "border border-[#FCCC22] text-[#FCCC22] font-bold px-3 py-1 rounded text-l hover:shadow-[0_0_16px_#FCCC22] transition-shadow";
const ZEN_TAB =
  "px-3 py-1 text-l font-bold border-b-2 border-transparent text-[#dee1e6] hover:text-[#FCCC22] hover:border-[#FCCC22] transition-colors";
const ZEN_TAB_ACTIVE =
  "px-3 py-1 text-l font-bold border-b-2 border-[#FCCC22] text-[#FCCC22]";

/* -------------------- helper components -------------------- */
function PersonRow({ u }) {
  const username = u?.username || "unknown";
  const firstName = u?.firstName || "";
  const lastName = u?.lastName || "";
  const display = (firstName || lastName) ? `${firstName} ${lastName}`.trim() : username;
  const avatarUrl = u?.profilePhoto || u?.profilePhotoUrl || u?.avatarUrl || "";
  const role = (u?.role || "").toLowerCase();

  return (
    <div className="flex items-center gap-3 px-3 py-2 rounded hover:bg-[#1C1633]/30">
      <div className="relative h-10 w-10 rounded-full overflow-hidden bg-[#1C1633] border border-[#5f4a87]">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt={username} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <UserIcon className="h-5 w-5 text-gray-400" />
          </div>
        )}
      </div>
      <div className="min-w-0">
        <div className="text-white text-sm truncate">{display}</div>
        <div className="text-xs text-gray-300 truncate">
          @{username}{role ? ` • ${role}` : ""}
        </div>
      </div>
    </div>
  );
}

/* -------------------- page -------------------- */
export default function FollowListsPage() {
  const params = useParams();
  const router = useRouter();
  const USER_ID = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [tab, setTab] = useState("following"); 
  const [roleFilter, setRoleFilter] = useState("all"); 

  const [following, setFollowing] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [nextCursor, setNextCursor] = useState({ following: null, followers: null });

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState("");

  const scrollRef = useRef(null);
  const sentinelRef = useRef(null);

  const activeListRaw = tab === "following" ? following : followers;
  const activeCursor = tab === "following" ? nextCursor.following : nextCursor.followers;

  const activeList = useMemo(() => {
    if (roleFilter === "all") return activeListRaw;
    return activeListRaw.filter((u) => (u?.role || "").toLowerCase() === roleFilter);
  }, [activeListRaw, roleFilter]);

  const hasMore = !!activeCursor;

  const dedupeById = (arr) => {
    const seen = new Set();
    const out = [];
    for (const x of arr) {
      if (!x?.id) continue;
      if (seen.has(x.id)) continue;
      seen.add(x.id);
      out.push(x);
    }
    return out;
  };

  // ---- fetch page from backend API ----
  const fetchPage = useCallback(
    async (which, cursor = null) => {
      if (!USER_ID) return;
      setLoading(true);
      setError("");

      try {
        const url = new URL(api(`/gamer/${USER_ID}/${which}`));
        url.searchParams.set("limit", "20");
        if (cursor) url.searchParams.set("cursor", cursor);

        const res = await authedFetch(url.toString(), {
          headers: { Accept: "application/json" },
          allowAnonymous: true, 
        });

        const ct = res.headers.get("content-type") || "";

        // Non-2xx: read text for diagnostics
        if (!res.ok) {
          const txt = await res.text();
          throw new Error(`HTTP ${res.status} on ${url}: ${txt.slice(0, 300)}`);
        }

        // Not JSON -> print snippet (likely HTML)
        if (!ct.includes("application/json")) {
          const txt = await res.text();
          throw new Error(
            `Expected JSON from ${url}, got content-type "${ct}". Body: ${txt.slice(0, 300)}`
          );
        }

        const data = await res.json();
        if (!data?.success) throw new Error(data?.message || "Failed to load");

        const users = Array.isArray(data.users) ? data.users : [];
        const next = data.next || null;

        if (which === "following") {
          setFollowing((prev) => (cursor ? dedupeById([...prev, ...users]) : users));
          setNextCursor((p) => ({ ...p, following: next }));
        } else {
          setFollowers((prev) => (cursor ? dedupeById([...prev, ...users]) : users));
          setNextCursor((p) => ({ ...p, followers: next }));
        }
      } catch (e) {
        console.error(e);
        setError(e?.message || "Failed to load");
      } finally {
        setLoading(false);
        setInitialLoading(false);
      }
    },
    [USER_ID]
  );

  
  useEffect(() => {
    console.log("API_ROOT:", API_ROOT);
    if (USER_ID) fetchPage("following", null);
  }, [USER_ID, fetchPage]);

  
  useEffect(() => {
    if (tab === "followers" && followers.length === 0 && !initialLoading) {
      fetchPage("followers", null);
    }
  }, [tab, followers.length, initialLoading, fetchPage]);


  useEffect(() => {
    const rootElem = scrollRef.current;
    const sentinel = sentinelRef.current;
    if (!rootElem || !sentinel) return;

    const ob = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          const cursor = tab === "following" ? nextCursor.following : nextCursor.followers;
          fetchPage(tab, cursor || null);
        }
      },
      { root: rootElem, threshold: 0.1 }
    );

    ob.observe(sentinel);
    return () => ob.disconnect();
  }, [tab, hasMore, loading, nextCursor.followers, nextCursor.following, fetchPage]);

  if (!USER_ID) {
    return (
      <main className="p-6 text-red-300">
        Missing user id in route.
      </main>
    );
  }

  return (
    <>
      <div className="absolute inset-2 z-0">
        <Particles
          particleColors={["#ffffff"]}
          particleCount={200}
          particleSpread={10}
          speed={0.1}
          particleBaseSize={100}
        />
      </div>

      <LeftSidebar role="gamer" active="profile" userId={USER_ID} />

      <main
        className="relative z-10 pt-8"
        style={{ marginLeft: SIDEBAR_WIDTH + 20, marginRight: 24 }}
      >
        <div className="mx-auto max-w-6xl">
          <div className="bg-[#2b2142b3] rounded-xl p-6 md:p-8">
            {/* Tabs + Role Filter */}
            <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
              <div className="flex gap-2">
                <button
                  className={tab === "following" ? GOLD_BTN : GOLD_BTN_GHOST}
                  onClick={() => setTab("following")}
                  type="button"
                >
                  Following
                </button>
                <button
                  className={tab === "followers" ? GOLD_BTN : GOLD_BTN_GHOST}
                  onClick={() => setTab("followers")}
                  type="button"
                >
                  Followers
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  className={roleFilter === "all" ? ZEN_TAB_ACTIVE : ZEN_TAB}
                  onClick={() => setRoleFilter("all")}
                  type="button"
                >
                  All
                </button>
                <button
                  className={roleFilter === "gamer" ? ZEN_TAB_ACTIVE : ZEN_TAB}
                  onClick={() => setRoleFilter("gamer")}
                  type="button"
                >
                  Gamers
                </button>
                <button
                  className={roleFilter === "club" ? ZEN_TAB_ACTIVE : ZEN_TAB}
                  onClick={() => setRoleFilter("club")}
                  type="button"
                >
                  Clubs
                </button>
              </div>
            </div>

            {/* Scrollable list */}
            <div
              ref={scrollRef}
              className="rounded-lg border border-[#3b2d5e] bg-[#1C1633]/40"
              style={{ maxHeight: "36rem", overflowY: "auto" }}
            >
              {initialLoading ? (
                <div className="p-6 text-gray-300">Loading…</div>
              ) : error ? (
                <div className="p-6 text-red-300 break-words">
                  {error}
                </div>
              ) : activeList.length === 0 ? (
                <div className="p-6  text-gray-300">
                  {tab === "following"
                    ? roleFilter === "all"
                      ? "Not following anyone yet."
                      : `No ${roleFilter}s in following.`
                    : roleFilter === "all"
                      ? "No followers yet."
                      : `No ${roleFilter}s in followers.`}
                </div>
              ) : (
                <ul className="divide-y divide-[#3b2d5e] text-l">
                  {activeList.map((u) => (
                    <li key={`${tab}-${u.id}`}>
                      <PersonRow u={u} />
                    </li>
                  ))}
                </ul>
              )}

              {/* sentinel for infinite scroll */}
              <div ref={sentinelRef} />
              <div className="p-3 text-center text-sm text-gray-400">
                {loading
                  ? "Loading more…"
                  : hasMore
                    ? "Scroll to load more"
                    : activeList.length > 0
                      ? "You've reached the end"
                      : null}
              </div>
            </div>

            <div className="flex justify-end mt-4">
              <button
                type="button"
                className="text-red-400 font-bold px-3 py-1 rounded text-l disabled:opacity-60 hover:bg-[#3b2d5e] transition-shadow"
                onClick={() => router.back()} 
              >
                Back
              </button>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
