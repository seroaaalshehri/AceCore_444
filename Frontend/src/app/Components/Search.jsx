"use client"

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link"
import { authedFetch } from "../../../lib/authedFetch";
import countries from "world-countries";

// Available games list - add more as needed
const AVAILABLE_GAMES = [
  { id: "code", label: "Call of Duty" },
  { id: "rl", label: "Rocket League" },
  { id: "ow", label: "Overwatch" },
  // Add more games here
];

const AVAILABLE_SCORES = ["S", "A", "B", "C", "D"];

export default function Search() {
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [results, setResults] = useState([])
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterTarget, setFilterTarget] = useState("gamer");
  const [selectedGames, setSelectedGames] = useState([]); // Multi-select games
  const [selectedScore, setSelectedScore] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const debounceRef = useRef(null);

  const getNationality = (c) =>
    c?.demonyms?.eng?.m || c?.demonym || c?.nationality || c?.name?.common;
  
  const NATIONALITY_OPTIONS = countries
    .filter((c) => c.cca2 !== "IL")
    .map((c) => ({ key: c.cca2, label: getNationality(c) }))
    .filter((o) => !!o.label)
    .sort((a, b) => a.label.localeCompare(b.label));
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
  
        const res = await authedFetch(`http://localhost:4000/api/Search?${params.toString()}`);
        const data = await res.json();
        if (!res.ok || !data?.success) throw new Error(data?.error || `HTTP ${res.status}`);
  
        setResults(data.results || []);
        setError("");
      } catch (err) {
        console.error("live search error:", err);
        setError("Search failed.");
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  
    return () => clearTimeout(debounceRef.current);
  }, [query]);
  
  function toggleGame(gameId) {
    setSelectedGames(prev => 
      prev.includes(gameId) 
        ? prev.filter(id => id !== gameId)
        : [...prev, gameId]
    );
  }

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
      setError("");
    } catch (e) {
      console.error("Search error:", e);
      setError("Search failed. Check Network tab and server logs.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  async function applyFilter() {
    // Validation checks
    if (selectedGames.length === 0) {
      setAlertMessage("Please select at least one game.");
      setShowAlert(true);
      return;
    }
  
    if (filterTarget === "gamer" && !selectedScore) {
      setAlertMessage("Please select a score.");
      setShowAlert(true);
      return;
    }
    if (!selectedCountry) {
      setAlertMessage(`Please select a ${filterTarget === "gamer" ? "nationality" : "country"}.`);
      setShowAlert(true);
      return;
    }
    setLoading(true);  
    setLoading(true);
    setError("");
  
    try {
      // Search for each selected game and combine results (OR logic)
      const allResults = [];
      const seenIds = new Set();
  
      for (const gameId of selectedGames) {
        const params = new URLSearchParams();
        params.set("gameId", gameId);
        params.set("role", filterTarget);
  
        if (filterTarget === "gamer" && selectedScore) {
          params.set("score", selectedScore);
        }

        if (selectedCountry) {
          params.set("country", selectedCountry);
        }
  
        console.log("🔍 Filter request:", params.toString());
  
        const res = await authedFetch(
          `http://localhost:4000/api/Search/by-game?${params.toString()}`
        );
  
        const data = await res.json();
        console.log("📦 Filter response for", gameId, ":", data);
  
        if (data.success && data.results) {
          // Deduplicate results - this is the OR logic
          // If a user appears in ANY game search, add them once
          for (const user of data.results) {
            if (!seenIds.has(user.id)) {
              seenIds.add(user.id);
              allResults.push(user);
              console.log("✅ Added user:", user.username || user.clubName, "from game:", gameId);
            } else {
              console.log("⏭️ User already added:", user.username || user.clubName);
            }
          }
        }
      }
  
      console.log("🎯 Total unique results:", allResults.length);
      setResults(allResults);
      setError("");
      setQuery("");
    } catch (e) {
      console.error("Filter error:", e);
      setError(`Filtering failed: ${e.message}`);
      setResults([]);
    } finally {
      setLoading(false);
      setIsFilterOpen(false);
    }
  }

  function onKeyDown(e) {
    if (e.key === "Enter") runSearch()
  }

  function clearFilters() {
    setSelectedGames([]);
    setSelectedScore("");
    setSelectedCountry("");
  }

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
          
          <button
            onClick={() => setIsFilterOpen(true)}
            className="rounded-xl bg-[#FCCC22] text-black px-4 py-3 font-bold hover:bg-transparent hover:text-[#FCCC22] border border-[#FCCC22] transition"
          >
            Filter
          </button>
        </div>
        {error && <div className="text-red-400 mt-3">{error}</div>}
      </div>

      {/* Results list */}
      <div className="flex flex-col gap-4">
        {loading && <div className="text-gray-400">Loading...</div>}
        
        {results.map((item) => (
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
                <p className="text-[20px] text-gray-300 truncate">
                  @{item.username || "-"}
                </p>
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

        {!loading && results.length === 0 && query.trim().length === 0 && (
          <div className="text-gray-400">Enter a search term or use filters</div>
        )}
        
        {!loading && results.length === 0 && query.trim().length > 0 && (
          <div className="text-gray-400">No results found</div>
        )}
      </div>



{/* Alert Pop-up */}
{showAlert && (
<div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 z-[60]">
            <div className="bg-[#1C1633] text-white p-6 rounded-xl shadow-2xl w-[350px] text-center">
            <p className="text-lg font-bold mb-4">{alertMessage}</p>
            <button
              onClick={() => setShowAlert(false)}
              className="w-full bg-[#4682B4] hover:bg-[#5a9fd6] px-4 py-2 rounded text-sm transition"
            >
              Okay
            </button>
          </div>
        </div>
      )}

   


      {/* Filter Modal */}
      {isFilterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="relative bg-[#1c1430] p-6 rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsFilterOpen(false)}
              className="absolute top-3 right-3 text-white text-2xl hover:text-[#FCCC22] transition"
            >
              ×
            </button>

            <h2 className="text-white text-xl font-bold mb-4 text-center">Filter Search</h2>

            {/* Role Toggle */}
            <div className="flex justify-center mb-6">
              <div className="flex overflow-hidden rounded-full border border-[#FCCC22]">
                <button
                  onClick={() => setFilterTarget("club")}
                  className={`px-6 py-2 transition ${
                    filterTarget === "club" ? "bg-[#FCCC22] text-black" : "text-white hover:bg-[#FCCC22]/20"
                  }`}
                >
                  Club
                </button>

                <button
                  onClick={() => setFilterTarget("gamer")}
                  className={`px-6 py-2 transition ${
                    filterTarget === "gamer" ? "bg-[#FCCC22] text-black" : "text-white hover:bg-[#FCCC22]/20"
                  }`}
                >
                  Gamer
                </button>
              </div>
            </div>

            {/* Game Selection */}
            <div className="mb-4">
              <label className="text-white mb-2 block font-semibold">
                Select Games: <span className="text-gray-400 font-normal text-sm">({selectedGames.length} selected)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_GAMES.map((game) => (
                  <button
                    key={game.id}
                    onClick={() => toggleGame(game.id)}
                    className={`px-4 py-2 rounded-lg border transition ${
                      selectedGames.includes(game.id)
                        ? "bg-[#FCCC22] text-black border-[#FCCC22] font-semibold"
                        : "bg-[#2b2142] text-white border-[#FCCC22]/40 hover:border-[#FCCC22] hover:bg-[#2b2142]/80"
                    }`}
                  >
                    {game.label}
                  </button>
                ))}
              </div>
              {selectedGames.length > 0 && (
                <button
                  onClick={() => setSelectedGames([])}
                  className="text-gray-400 text-sm mt-2 hover:text-white transition"
                >
                  Clear selection
                </button>
              )}
            </div>

            {/* Score Filter (Gamer only) */}
{filterTarget === "gamer" && (
  <div className="mb-4">
    <label className="text-white mb-2 block font-semibold">Select Score</label>
    <select
      className="w-full bg-[#2b2142] text-white px-3 py-2 rounded-lg border border-[#FCCC22]/40 focus:border-[#FCCC22] focus:outline-none"
      value={selectedScore}
      onChange={(e) => setSelectedScore(e.target.value)}
    >
      <option value="">All Scores</option>
      {AVAILABLE_SCORES.map(score => (
        <option key={score} value={score}>{score}</option>
      ))}
    </select>
  </div>
)}

{/* Country/Nationality Filter */}
<div className="mb-4">
  <label className="text-white mb-2 block font-semibold">
    {filterTarget === "gamer" ? "Select Nationality" : "Select Country"}
  </label>
  <select
    className="w-full bg-[#2b2142] text-white px-3 py-2 rounded-lg border border-[#FCCC22]/40 focus:border-[#FCCC22] focus:outline-none"
    value={selectedCountry}
    onChange={(e) => setSelectedCountry(e.target.value)}
  >
    <option value="">
      {filterTarget === "gamer" ? "All Nationalities" : "All Countries"}
    </option>
    {filterTarget === "gamer" 
      ? NATIONALITY_OPTIONS.map((o) => (
          <option key={o.key} value={o.label}>
            {o.label}
          </option>
        ))
      : countries
          .filter((c) => c.cca2 !== "IL")
          .sort((a, b) => a.name.common.localeCompare(b.name.common))
          .map((c) => (
            <option key={c.cca2} value={c.name.common}>
              {c.name.common}
            </option>
          ))
    }
  </select>
</div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={clearFilters}
                className="flex-1 bg-transparent text-white py-2 rounded-xl font-bold border border-gray-600 hover:border-white transition"
              >
                Reset
              </button>
              <button
                onClick={applyFilter}
                className="flex-1 bg-[#FCCC22] text-black py-2 rounded-xl font-bold hover:bg-[#e5b81f] transition"
              >
                Apply Filter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
//searchByGame