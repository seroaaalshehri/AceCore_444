"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { User as UserIcon } from "lucide-react";
import {
  collection, getDocs, getDoc, doc, orderBy, limit, query, startAfter,
} from "firebase/firestore";
import { db, storage } from "../../../../../lib/firebaseClient";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getApp } from "firebase/app";

import Particles from "../../../Components/Particles";
import LeftSidebar, { SIDEBAR_WIDTH } from "../../../Components/LeftSidebar";

/** The user whose lists we’re showing */
const USER_ID = "user123";

/* ---- shared styles ---- */
const GOLD_BTN =
  "bg-[#FCCC22] text-[#2b2142b3] font-bold px-3 py-1 rounded text-l disabled:opacity-60 hover:shadow-[0_0_16px_#FCCC22] transition-shadow";
const GOLD_BTN_GHOST =
  "border border-[#FCCC22] text-[#FCCC22] font-bold px-3 py-1 rounded text-l hover:shadow-[0_0_16px_#FCCC22] transition-shadow";

/** ZenofBar-like tab styles (hover -> gold text + gold underline) */
const ZEN_TAB =
  "px-3 py-1 text-l font-bold border-b-2 border-transparent text-[#dee1e6] hover:text-[#FCCC22] hover:border-[#FCCC22] transition-colors";
const ZEN_TAB_ACTIVE =
  "px-3 py-1 text-l font-bold border-b-2 border-[#FCCC22] text-[#FCCC22]";

/** Hide “dangling” links if profile doc missing */
const HIDE_MISSING_PROFILES = false;

/* ---- list row ---- */
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

/* ---- helpers ---- */
async function loadIdsFromSubcollection(userId, sub, useStartAfter) {
  const colRef = collection(db, "users", userId, sub);
  const baseQ = query(colRef, orderBy("__name__"), limit(20));
  const q2 = useStartAfter ? query(baseQ, startAfter(useStartAfter)) : baseQ;
  const snap = await getDocs(q2);
  const ids = snap.docs.map((d) => d.id);
  const next = snap.docs.length === 20 ? snap.docs[snap.docs.length - 1] : null;
  return { ids, next };
}

async function loadProfilesByIds(ids) {
  const out = [];
  for (const id of ids) {
    const pd = await getDoc(doc(db, "users", id));
    if (pd.exists()) {
      out.push({ id, ...pd.data() });
    } else if (!HIDE_MISSING_PROFILES) {
      out.push({ id, username: "unknown" });
    }
  }
  return out;
}

function dedupeById(arr) {
  const seen = new Set();
  const out = [];
  for (const x of arr) {
    if (seen.has(x.id)) continue;
    seen.add(x.id);
    out.push(x);
  }
  return out;
}

/* ---- main page ---- */
export default function FollowListsPage() {
  const [tab, setTab] = useState("following");          // "following" | "followers"
  const [roleFilter, setRoleFilter] = useState("all");  // "all" | "gamer" | "club"

  const [following, setFollowing] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [lastDoc, setLastDoc] = useState({ following: null, followers: null });
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState("");

  const scrollRef = useRef(null);
  const sentinelRef = useRef(null);

  // NEW: sidebar & search UI state
  const [leftTab, setLeftTab] = useState("home");
  const [q, setQ] = useState("");

  const activeListRaw = tab === "following" ? following : followers;
  const activeLast = tab === "following" ? lastDoc.following : lastDoc.followers;

  // Apply role filter (client-side)
  const activeList = useMemo(() => {
    if (roleFilter === "all") return activeListRaw;
    return activeListRaw.filter(
      (u) => (u?.role || "").toLowerCase() === roleFilter
    );
  }, [activeListRaw, roleFilter]);

  const hasMore = useMemo(() => !!activeLast, [activeLast]);

  async function fetchPage(which, useStartAfter) {
    setLoading(true);
    setError("");
    try {
      if (which === "following") {
        const { ids, next } = await loadIdsFromSubcollection(USER_ID, "following", useStartAfter);
        const profiles = await loadProfilesByIds(ids);
        setFollowing((prev) => (useStartAfter ? dedupeById([...prev, ...profiles]) : profiles));
        setLastDoc((p) => ({ ...p, following: next }));
        console.debug("[DEBUG] following:", profiles);
      } else {
        const { ids, next } = await loadIdsFromSubcollection(USER_ID, "followers", useStartAfter);
        const profiles = await loadProfilesByIds(ids);
        setFollowers((prev) => (useStartAfter ? dedupeById([...prev, ...profiles]) : profiles));
        setLastDoc((p) => ({ ...p, followers: next }));
        console.debug("[DEBUG] followers:", profiles);
      }
    } catch (e) {
      console.error(e);
      setError(e?.message || "Failed to load from Firestore");
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }

  useEffect(() => {
    fetchPage("following", null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (tab === "followers" && followers.length === 0 && !initialLoading) {
      fetchPage("followers", null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  // infinite scroll
  useEffect(() => {
    if (!sentinelRef.current) return;
    const ob = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && hasMore && !loading) {
          const startAfterDoc = tab === "following" ? lastDoc.following : lastDoc.followers;
          fetchPage(tab, startAfterDoc || null);
        }
      },
      { root: scrollRef.current, threshold: 0.1 }
    );
    ob.observe(sentinelRef.current);
    return () => ob.disconnect();
  }, [tab, hasMore, loading, lastDoc.followers, lastDoc.following]);

  return (
    <>
      {/* bg particles */}
      <div className="absolute inset-2 z-0">
        <Particles
          particleColors={["#ffffff"]}
          particleCount={200}
          particleSpread={10}
          speed={0.1}
          particleBaseSize={100}
        />
      </div>

      {/* LEFT: Sidebar */}
      <LeftSidebar active={leftTab} onChange={setLeftTab} />

      {/* RIGHT: push main card to the remaining space */}
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

              {/* Role filter: All | Gamers | Clubs — ZenofBar style */}
              <div className="flex gap-2">
                <button
                  className={roleFilter === "all" ? ZEN_TAB_ACTIVE : ZEN_TAB}
                  onClick={() => setRoleFilter("all")}
                  type="button"
                  title="Show all roles"
                >
                  All
                </button>
                <button
                  className={roleFilter === "gamer" ? ZEN_TAB_ACTIVE : ZEN_TAB}
                  onClick={() => setRoleFilter("gamer")}
                  type="button"
                  title="Only gamers"
                >
                  Gamers
                </button>
                <button
                  className={roleFilter === "club" ? ZEN_TAB_ACTIVE : ZEN_TAB}
                  onClick={() => setRoleFilter("club")}
                  type="button"
                  title="Only clubs"
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
                <div className="p-6 text-red-300">Error: {error}</div>
              ) : activeList.length === 0 ? (
                <div className="p-6 text-gray-300">
                  {tab === "following"
                    ? roleFilter === "all"
                      ? "Not following anyone yet."
                      : `No ${roleFilter}s in following.`
                    : roleFilter === "all"
                      ? "No followers yet."
                      : `No ${roleFilter}s in followers.`}
                </div>
              ) : (
                <ul className="divide-y divide-[#3b2d5e]">
                  {activeList.map((u) => (
                    <li key={`${tab}-${u.id}`}>
                      <PersonRow u={u} />
                    </li>
                  ))}
                </ul>
              )}

              {/* sentinel */}
              <div ref={sentinelRef} />

              {/* footer state */}
              <div className="p-3 text-center text-xs text-gray-400">
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
                onClick={() => history.back()}
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
