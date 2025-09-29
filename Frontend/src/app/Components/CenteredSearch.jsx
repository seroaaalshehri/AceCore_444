"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import {
  collection, getDocs, query, where, limit, orderBy, startAfter
} from "firebase/firestore";
import { db } from "../../../lib/firebaseClient"; // ← adjust if needed

/* ---------- tiny helpers (JS version) ---------- */
function useDebounced(value, delay = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

const USERS = () => collection(db, "users");

/* ---------- exact, case-sensitive page fetchers (JS) ---------- */
async function gamersPage(input, pageSize = 10, after = null) {
  let qy = query(
    USERS(),
    where("role", "==", "gamer"),
    where("username", "==", input),
    orderBy("__name__"),
    limit(pageSize)
  );
  if (after) qy = query(qy, startAfter(after));

  const snap = await getDocs(qy);
  return {
    items: snap.docs.map((d) => ({ id: d.id, type: "gamer", ...d.data() })),
    lastDoc: snap.docs.length ? snap.docs[snap.docs.length - 1] : null,
  };
}

async function clubsByUsernamePage(input, pageSize = 10, after = null) {
  let qy = query(
    USERS(),
    where("role", "==", "club"),
    where("username", "==", input),
    orderBy("__name__"),
    limit(pageSize)
  );
  if (after) qy = query(qy, startAfter(after));

  const snap = await getDocs(qy);
  return {
    items: snap.docs.map((d) => ({ id: d.id, type: "club", matchedOn: "username", ...d.data() })),
    lastDoc: snap.docs.length ? snap.docs[snap.docs.length - 1] : null,
  };
}

async function clubsByNamePage(input, pageSize = 10, after = null) {
  let qy = query(
    USERS(),
    where("role", "==", "club"),
    where("clubName", "==", input),
    orderBy("__name__"),
    limit(pageSize)
  );
  if (after) qy = query(qy, startAfter(after));

  const snap = await getDocs(qy);
  return {
    items: snap.docs.map((d) => ({ id: d.id, type: "club", matchedOn: "clubName", ...d.data() })),
    lastDoc: snap.docs.length ? snap.docs[snap.docs.length - 1] : null,
  };
}

/* ---------- CenteredSearch with built-in logic + results (JS) ---------- */
export default function CenteredSearch({
  value,
  onChange,
  placeholder = "Search…",
  className = "",
}) {
  // allow controlled or internal state
  const [internal, setInternal] = useState(value ?? "");
  const q = value ?? internal;

  const [gamers, setGamers] = useState([]);
  const [clubs, setClubs] = useState([]);

  // cursors for pagination
  const [gamerCursor, setGamerCursor] = useState(null);
  const [clubUserCursor, setClubUserCursor] = useState(null);
  const [clubNameCursor, setClubNameCursor] = useState(null);

  const [loading, setLoading] = useState(false);
  const [loadingMoreGamers, setLoadingMoreGamers] = useState(false);
  const [loadingMoreClubs, setLoadingMoreClubs] = useState(false);

  const dq = useDebounced(q, 250);

  useEffect(() => {
    let alive = true;
    (async () => {
      const s = (dq || "").trim();
      if (!s) {
        setGamers([]); setClubs([]);
        setGamerCursor(null); setClubUserCursor(null); setClubNameCursor(null);
        return;
      }
      setLoading(true);
      try {
        const [g1, cu1, cn1] = await Promise.all([
          gamersPage(s, 10),
          clubsByUsernamePage(s, 10),
          clubsByNamePage(s, 10),
        ]);
        if (!alive) return;

        // merge & de-dupe clubs
        const map = new Map();
        [...cu1.items, ...cn1.items].forEach((c) => map.set(c.id, c));

        setGamers(g1.items);
        setClubs(Array.from(map.values()));

        setGamerCursor(g1.lastDoc);
        setClubUserCursor(cu1.lastDoc);
        setClubNameCursor(cn1.lastDoc);
      } catch (e) {
        console.error("Search failed", e);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [dq]);

  const handleInput = (next) => {
    if (onChange) onChange(next);
    else setInternal(next);
  };

  const loadMoreGamers = async () => {
    if (!gamerCursor) return;
    setLoadingMoreGamers(true);
    try {
      const res = await gamersPage((dq || "").trim(), 10, gamerCursor);
      setGamers((prev) => [...prev, ...res.items]);
      setGamerCursor(res.lastDoc);
    } finally {
      setLoadingMoreGamers(false);
    }
  };

  const loadMoreClubs = async () => {
    if (!clubUserCursor && !clubNameCursor) return;
    setLoadingMoreClubs(true);
    try {
      const [cu, cn] = await Promise.all([
        clubUserCursor ? clubsByUsernamePage((dq || "").trim(), 10, clubUserCursor) : Promise.resolve({ items: [], lastDoc: null }),
        clubNameCursor ? clubsByNamePage((dq || "").trim(), 10, clubNameCursor) : Promise.resolve({ items: [], lastDoc: null }),
      ]);
      const map = new Map(clubs.map((c) => [c.id, c]));
      [...cu.items, ...cn.items].forEach((c) => map.set(c.id, c));
      setClubs(Array.from(map.values()));
      setClubUserCursor(cu.lastDoc);
      setClubNameCursor(cn.lastDoc);
    } finally {
      setLoadingMoreClubs(false);
    }
  };

  const noResults = !loading && dq && gamers.length === 0 && clubs.length === 0;

  return (
    <div className={`mb-6 ${className}`}>
      {/* Input */}
      <div className="flex justify-center">
        <div className="relative w-full max-w-6xl">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={q}
            onChange={(e) => handleInput(e.target.value)}
            className="pl-9 pr-3 py-2 rounded-lg bg-[#0C0817]/80 border border-[#3b2d5e] text-l text-white placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-[#FCCC22] w-full"
            placeholder={placeholder}
          />
        </div>
      </div>

      {/* Results */}
      <div className="p-4">
        {loading && <p className="text-l text-gray-400">Searching…</p>}
        {noResults && <p className="text-l text-gray-400">No exact match for “{dq}”.</p>}

        {gamers.length > 0 && (
          <>
            <h3 className="mt-6 mb-2 text-[#FCCC22] font-bold">Gamers</h3>
            <ul className="space-y-2">
              {gamers.map((g) => (
                <li key={g.id} className="rounded-lg border border-[#3b2d5e] p-3 bg-[#1C1633]/60">
                  <div className="text-white text-l">@{g.username}</div>
                </li>
              ))}
            </ul>
            {gamerCursor && (
              <button
                onClick={loadMoreGamers}
                disabled={loadingMoreGamers}
                className="mt-3 px-3 py-1 rounded border border-[#FCCC22] text-[#FCCC22] text-l hover:shadow-[0_0_16px_#FCCC22]"
              >
                {loadingMoreGamers ? "Loading…" : "Load more gamers"}
              </button>
            )}
          </>
        )}

        {clubs.length > 0 && (
          <>
            <h3 className="mt-8 mb-2 text-[#FCCC22] font-bold">Clubs</h3>
            <ul className="space-y-2">
              {clubs.map((c) => (
                <li key={c.id} className="rounded-lg border border-[#3b2d5e] p-3 bg-[#1C1633]/60">
                  <div className="text-white text-l font-medium">{c.clubName || "Unnamed club"}</div>
                  <div className="text-gray-400 text-l">@{c.username}</div>
                </li>
              ))}
            </ul>
            {(clubUserCursor || clubNameCursor) && (
              <button
                onClick={loadMoreClubs}
                disabled={loadingMoreClubs}
                className="mt-3 px-3 py-1 rounded border border-[#FCCC22] text-[#FCCC22] text-l hover:shadow-[0_0_16px_#FCCC22]"
              >
                {loadingMoreClubs ? "Loading…" : "Load more clubs"}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
