"use client"

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link"
import { authedFetch } from "../../../lib/authedFetch";

export default function Search() {
  const [query, setQuery] = useState("")
  const [role, setRole] = useState("all")           
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [results, setResults] = useState([])


  const debounceRef = useRef(null);

  useEffect(() => {
    const q = query.trim();
  
    if (q.length === 0) {
      setResults([]);
      setError("");
      return;
    }
  
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        setLoading(true);
  
        const params = new URLSearchParams({
          query: q,
          limit: "20",
          partial: "1", 
        });
        if (role !== "all") params.set("role", role);
  
        const res = await authedFetch(`http://localhost:4000/api/Search?${params.toString()}`);
        const data = await res.json();
        if (!res.ok || !data?.success) throw new Error(data?.error || `HTTP ${res.status}`);
  
        setResults(data.results || []);
      } catch (err) {
        console.error("live search error:", err);
        setError("Search failed.");
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  
    return () => clearTimeout(debounceRef.current);
  }, [query, role]);
  
  
  async function runSearch() {
    if (!query.trim()) return;
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        query: query.trim(),
        limit: "20",
      });

      const res = await authedFetch(
        `http://localhost:4000/api/Search?${params.toString()}`
      );

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.error("Search HTTP error:", res.status, text);
        throw new Error(`http_${res.status}`);
      }

      const data = await res.json();
      if (!data?.success) {
        console.error("Search API error:", data);
        throw new Error(data?.error || "search_failed");
      }

      setResults(data.results || []);
    } catch (e) {
      console.error("Search error:", e);
      setError("Search failed. Check Network tab and server logs.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  function onKeyDown(e) {
    if (e.key === "Enter") runSearch()
  }

  // Client-side filter (no backend change):
  // treat anything not 'club' as 'gamer' so it works even if DB uses 'user'
  const filtered = results.filter(r => {
    if (role === "all") return true
    const isClub = r.role === "club"
    const isGamer = !isClub
    return role === "club" ? isClub : isGamer
  })

  return (
    <div className="flex flex-col gap-6">
      {/* Search box card */}
      <div className="rounded-xl bg-[#2b2142b3] border border-[#1f2430] p-6 md:p-8">
        <div className="flex flex-col md:flex-row gap-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search by username or name"
            className="w-full rounded-xl bg-[#0C0817] border border-[#1f2430] px-4 py-3 text-white focus:outline-none focus:border-[#fccc22]"
          />
          {/* Enabled dropdown (filter works) */}
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="rounded-xl bg-[#0C0817] border border-[#1f2430] px-4 py-3 text-white focus:outline-none focus:border-[#fccc22]"
          >
            <option value="all">All</option>
            <option value="gamer">Gamers</option>
            <option value="club">Clubs</option>
          </select>
      
        </div>
        {error && <div className="text-red-400 mt-3">{error}</div>}
      </div>

      {/* Results list */}
      <div className="flex flex-col gap-4">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="rounded-lg border border-[#3b2d5e] bg-[#1C1633]/40 hover:bg-[#1C1633]/60 transition"
    >
            <div className="flex items-center gap-6 px-6 py-5">
              <img
                src={item.profilePhoto || "/default-avatar.png"}
                alt={item.role || "user"}
                className="h-24 w-24 rounded-full object-cover border-2 border-[#5f4a87] shadow-[0_0_12px_#5f4a87] bg-[#1C1633]"
        />
              <div className="flex-1 min-w-0">
                <p className="text-white text-[26px] font-bold truncate">
                  {item.clubName || item.username || "Unnamed"}
                </p>
                {/* username line */}
                <p className="text-[20px] text-gray-300 truncate">
                  @{item.username || "-"}
                </p>
                {/* role on its own line under username */}
                <p className="text-[20px] text-gray-300 truncate">
                  {item.role === "club" ? "Club" : "Gamer"}
                </p>
              </div>
              <Link
  href={
    item.role === "club"
    ? `/club/view/${item.id}?from=search`
    : `/gamer/view/${item.id}?from=search`
  }
  className="bg-[#FCCC22] text-[#0C0817] font-bold px-4 py-2 rounded text-xl hover:shadow-[0_0_16px_#FCCC22] transition-shadow"
        >
  View
</Link>
            </div>
          </div>
        ))}

        {!loading && filtered.length === 0 && (
          <div className="text-gray-400">No results</div>
        )}
      </div>
    </div>
  )
}