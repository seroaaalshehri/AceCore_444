"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import "../../../globals.css";
import Particles from "../../../Components/Particles";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import LeftSidebar from "../../../Components/LeftSidebar";
import { FaTrophy } from "react-icons/fa";
import { Flag, FileText, Image as ImageIcon, File, User, Cake } from "lucide-react";
import { authedFetch } from "../../../../../lib/authedFetch";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../../../../lib/firebaseClient";
import InfoTooltip from "../../../Components/InfoTooltip";
import CODE_Info from "../../../Components/CODE_Info";

const GOLD_BTN =
  "bg-[#FCCC22] text-[#0C0817] font-bold px-9 py-2 rounded-lg text-2xl " +
  "disabled:opacity-60 hover:shadow-[0_0_16px_#FCCC22] transition-shadow";

function formatDate(date) {
  if (!date) return "";
  const d = date?._seconds ? new Date(date._seconds * 1000) : new Date(date);
  return d.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

export default function GamerPublicView() {
  const params = useParams();
  const raw = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const uid = decodeURIComponent(raw ?? "");
  const searchParams = useSearchParams();
  const fromSearch = searchParams.get("from") === "search";

  const [profile, setProfile] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [games, setGames] = useState([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentRole, setCurrentRole] = useState("gamer");
  const [isFollowing, setIsFollowing] = useState(false);
  const [loadingFollow, setLoadingFollow] = useState(false);

  useEffect(() => {
    if (!uid) return;
    (async () => {
      const p = await fetch(`http://localhost:4000/api/gamer/${uid}/profile/public`);
      const pj = await p.json();
      if (pj.success) setProfile(pj.profile);

      const a = await fetch(`http://localhost:4000/api/gamer/${uid}/achievements/public`);
      const aj = await a.json();
      if (aj.success) setAchievements(aj.achievements || []);

      const g = await fetch(`http://localhost:4000/api/gamer/${uid}/games/public`);
      const gj = await g.json();
      if (gj.success) setGames(gj.games || []);

      const f = await fetch(`http://localhost:4000/api/gamer/${uid}/followNums`);
      const fj = await f.json();
      try {
        const s = await authedFetch(`http://localhost:4000/api/follow/${uid}/status`);
        const sj = await s.json();
        if (sj.success) {
          setFollowersCount(sj.followersCount ?? 0);
          setFollowingCount(sj.followingCount ?? 0);
          setIsFollowing(!!sj.isFollowing);
        }
      } catch (e) {
        // status might fail if unauthenticated; leave defaults
      }
    })();
  }, [uid]);

  const handleFollowToggle = async () => {
    if (!auth.currentUser) {
      alert("Please login first");
      return;
    }
    if (auth.currentUser.uid === uid) return; // cannot follow yourself
    try {
      setLoadingFollow(true);
      const method = isFollowing ? "DELETE" : "POST";
      const res = await authedFetch(`http://localhost:4000/api/follow/${uid}`, { method });
      const data = await res.json();
      if (data.success) {
        setIsFollowing(!!data.isFollowing);
        setFollowersCount(data.followersCount ?? followersCount);
        setFollowingCount(data.followingCount ?? followingCount);
      }
    } catch (e) {
      console.error("follow toggle failed", e);
    } finally {
      setLoadingFollow(false);
    }
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser) return setCurrentUser(null);
      try {
        const res = await authedFetch("http://localhost:4000/api/users/me");
        const data = await res.json();
        if (data?.user) {
          setCurrentUser(data.user);
          setCurrentRole(data.user.role || "gamer");
        }
      } catch (err) {
        console.error("fetch me failed", err);
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    // Lock body scroll for this page so tooltips can't create a second scrollbar
    const prevOverflow = document.body.style.overflow;
    const prevHeight = document.body.style.height;

    document.body.style.overflow = "hidden";
    document.body.style.height = "100vh";

    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.height = prevHeight;
    };
  }, []);

  if (!profile) return <div className="text-gray-400 p-6">Loading profile...</div>;

  const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(" ");

  function formatShortDate(ts) {
    if (!ts) return "—";
    const millis = ts._seconds ? ts._seconds * 1000 : ts;
    const d = new Date(millis);

    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  }
  return (
  <div className="flex h-screen overflow-hidden">

      <div className="w-[250px]">
        <LeftSidebar
          role={currentRole}
          active={fromSearch ? "search" : "profile"}
          userId={currentRole === "gamer" ? currentUser?.id : uid}
        />
      </div>

<div className="flex-1 flex flex-col bg-[acecoreBackground] font-barlow overflow-x-hidden">
        <div className="relative w-full h-screen">
          <div className="fixed inset-0 z-0 h-full">
            <Particles
              particleColors={["#ffffff", "#ffffff"]}
              particleCount={200}
              particleSpread={10}
              speed={0.1}
              particleBaseSize={100}
            />
          </div>

<div className="flex-1 p-6 space-y-2 max-w-7xl mx-auto">
              {/* Header (match Club) */}
            <section className="relative z-10 rounded-xl pt-14 pr-4 lg:pr-6 pl-20 shadow-lg bg-[#1c1430] mt-6">
              {/* ONE ROW / SIX COLUMNS WITH SYMMETRIC SPACERS */}
              <div className="grid w-full items-center gap-8
                grid-cols-1 md:grid-cols-[auto_minmax(260px,1fr)_1fr_auto_auto_1fr]">

                {/* col 1 — AVATAR */}
                <div className="col-start-1">
                  {profile.profilePhoto ? (
                    <div className="w-44 h-44 rounded-full overflow-hidden bg-[#1C1633] border-3 border-[#5f4a87] shadow-[0_0_20px_#5f4a87,0_0_15px_rgba(95,74,135,0.5)]">
                      <Image src={profile.profilePhoto} alt="Profile Avatar" width={176} height={176}
                        className="w-full h-full object-cover rounded-full" />
                    </div>
                  ) : (
                    <div className="w-40 h-40 flex items-center justify-center rounded-full bg-[#1C1633] border-4 border-[#5f4a87] shadow-[0_0_20px_#5f4a87,0_0_15px_rgba(95,74,135,0.5)]">
                      <User size={80} className="text-gray-400" />
                    </div>
                  )}
                </div>

                {/* col 2 — NAME + USERNAME */}
                <div className="col-start-2 min-w-0">
                  <h2 className="text-[40px] font-bold truncate">{fullName || profile.username}</h2>
                  <p className="text-[26px] text-gray-400 mt-1 truncate">@{profile.username}</p>
                </div>

                {/* col 3 — SPACER (no content) */}

                {/* col 4 — COUNTERS (center of entire header) */}
                <div className="col-start-3">
                  <div className="flex items-center justify-center gap-10">
                    <Link href={`/club/followList/${uid}`} className="cursor-pointer text-center">
                      <div className="text-4xl font-bold text-white">{followersCount}</div>
                      <div className="text-2xl text-gray-400">Followers</div>
                    </Link>
                    <Link href={`/club/followList/${uid}`} className="cursor-pointer text-center">
                      <div className="text-4xl font-bold text-white">{followingCount}</div>
                      <div className="text-2xl text-gray-400">Following</div>
                    </Link>
                  </div>
                </div>

                {/* col 5 — BUTTON (left-aligned in its column) + nationality */}
                <div className="col-start-6 justify-self-end text-right ml-10">
                  {auth.currentUser?.uid !== uid && (
                    <button
                      onClick={handleFollowToggle}
                      className={`${GOLD_BTN} !mx-0`}
                      disabled={loadingFollow}
                    >
                      {isFollowing ? "Unfollow" : "Follow"}
                    </button>
                  )}
                </div>

                {/* col 6 — SPACER (no content) */}
              </div>

              <div className="mt-9 ml-2 text-white text-[25px] leading-relaxed w-3/4 whitespace-normal break-words [overflow-wrap:anywhere]">
                {profile.bio}
              </div>

              <div className="flex flex-col gap-5 items-end mt-[-95px] pb-6">
                <div className="text-white-400 text-xl text-right">

                  <div className="flex items-center gap-2 mt-4">
                    <Flag className="size-5 text-fuchsia-300" />
                    {profile.nationality || "—"}
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <Cake className="size-5 text-fuchsia-300" />
                    <p>Born</p>
                    {formatDate(profile.birthdate)}
                  </div>
                </div>

                <div className="flex space-x-2 relative top-5 -mt-2">
                  {profile.socials?.twitch && (
                    <a href={profile.socials.twitch} target="_blank" rel="noreferrer">
                      <img src="/twitchIcon.svg" className="w-9 h-9 -top-1 relative icon-glow" />
                    </a>
                  )}
                  {profile.socials?.discord && (
                    <a href={profile.socials.discord} target="_blank" rel="noreferrer">
                      <img src="/discord.svg" className="w-11 h-11 -top-2 ml-2.5 relative icon-glow" />
                    </a>
                  )}
                  {profile.socials?.youtube && (
                    <a href={profile.socials.youtube} target="_blank" rel="noreferrer">
                      <img src="/youtube.svg" className="w-[68px] h-[68px] -top-4 relative icon-glow" />
                    </a>
                  )}
                  {profile.socials?.x && (
                    <a href={profile.socials.x} target="_blank" rel="noreferrer">
                      <img src="/x.svg" className="w-8 h-8 icon-glow" />
                    </a>
                  )}
                </div>
              </div>
            </section>

           {/* GAMES */}
<section className="p-6">
  <div className="flex relative z-[50] items-center gap-3 mb-4">
    <h1 className="text-5xl font-bold text-[#fccc22]">GAMES</h1>
  </div>

  <div className="grid grid-cols-3 sm:grid-cols-2 lg:grid-cols-3 gap-10 relative">
    {games.map((g) => (
      <div
        key={g.id}
        className="relative w-150 h-150 rounded-xl shadow-md bg-[#1d1530] border border-[#1f2430]"
      >
        <img
          src={g.gamePhoto}
          alt={g.gameName}
          className="w-full h-60 object-cover rounded-t-xl"
        />
   <span className="absolute top-79 mt-4 right-4 z-[3000] text-white text-[32px]">
    {g.gameName === "Call of Duty" ? <CODE_Info /> : <InfoTooltip />}
  </span>
        <div className="p-4 text-left">
          <div className="relative flex items-start">
            <div className="flex flex-col flex-1 min-w-0">
  <span className="font-bold text-white mt-1 text-[32px] leading-none truncate pb-1 block">
    {g.gameName}
  </span>
              <span className="text-[26px] mt-1 text-gray-400 truncate">
                @{g.username}
              </span>

              <span className="flex items-baseline gap-2 mt-1">
                <span className="text-[29px] text-white font-bold">
                  {g.scrimCount ?? 0}
                </span>
                <span className="text-[23px] text-white font-normal">
                  {(g.scrimCount ?? 0) <= 1 ? "Scrim Arena" : "Scrim Arenas"}
                </span>
              </span>

              <span className="text-[23px] text-white mt-1 -mb-9">
                Scores on:{" "}
                {g.lastRankUpdate ? formatShortDate(g.lastRankUpdate) : "—"}
              </span>
            </div>

              {g.score !== undefined && g.score !== null ? (
                <span className="font-bold text-[#fccc22] text-[80px] mt-14 flex items-end justify-end pr-16">
                  {g.score}
                </span>
              ) : (
                <div className="font-bold text-[#fccc22] text-[80px] mt-14 flex items-end justify-end pr-10">

                  NE
                </div>
              )}
          </div>
        </div>
      </div>
    ))}

    {games.length === 0 && (
      <div className="text-gray-400">No games</div>
    )}
  </div>
</section>


            {/* ACHIEVEMENTS — aligned with GAMES */}
            <section className="p-6">
              <div className="flex relative z-[50] items-center gap-3 mb-7 -mt-3">
                <h1 className="text-5xl font-bold text-[#fccc22]">ACHIEVEMENTS</h1>
              </div>

              <div className="space-y-6 relative z-[20]">
                {achievements.map((ach) => (
                  <div
                    key={ach.id}
                    className="flex items-center justify-between bg-[#1c1430] rounded-xl pt-7 pb-7 pr-10 pl-12 shadow-md gap-6"
                  >
                    <FaTrophy size={30} className="text-[#FCCC22] flex-shrink-0" />

                    <div className="flex flex-col min-w-[220px]">
                      <h3 className="text-3xl font-bold text-white break-words whitespace-normal">{ach.name}</h3>
                      <p className="text-xl text-gray-300">{ach.game}</p>
                    </div>

                    <div className="flex flex-col min-w-[200px]">
                      {ach.association && <p className="text-2xl text-gray-200">{ach.association}</p>}
                      {(ach.date || ach.achievedAt) && (
                        <p className="text-xl text-gray-400">{formatDate(ach.date || ach.achievedAt)}</p>
                      )}
                    </div>

                    <div className="px-4">
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-[#2b2142] w-[220px]">
                        <div className="w-10 h-10 flex items-center justify-center">
                          {ach.file?.endsWith(".pdf") ? (
                            <FileText className="w-6 h-6 text-red-500" />
                          ) : ach.file?.match(/\.(jpg|jpeg|png|webp|gif)$/i) ? (
                            <ImageIcon className="w-6 h-6 text-green-400" />
                          ) : (
                            <File className="w-6 h-6 text-[#fccc22]" />
                          )}
                        </div>
                        <div className="flex flex-col">
                          <p className="font-medium text-white truncate max-w-[150px]">
                            {ach.file?.split("/").pop()}
                          </p>
                          {ach.file && (
                            <a
                              href={ach.file}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-400 text-sm underline"
                            >
                              Open
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {achievements.length === 0 && <div className="text-gray-400">No achievements</div>}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}