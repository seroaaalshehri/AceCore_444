"use client";


import React, { useState, useEffect } from "react";
import Image from "next/image";
import '../../../globals.css';
import Particles from "../../../Components/Particles";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import LeftSidebar, { SIDEBAR_WIDTH } from "../../../Components/LeftSidebar";
import { FaTrash, FaTrophy } from "react-icons/fa";
import { Cake, Flag, FileText, Image as ImageIcon, File, User } from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../../../../lib/firebaseClient";
import { authedFetch } from "../../../../../lib/authedFetch";


const ALLOWED_MIME = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
  "application/pdf",
]);

function useOwnerGuard() {
  const router = useRouter();
  const params = useParams();
  const routeId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser) {
        router.replace(`/Signin?next=${encodeURIComponent(location.pathname)}`);
        return;
      }
      try {
        const res = await authedFetch("http://localhost:4000/api/users/me");
        if (res.status === 401) {
          router.replace(`/Signin?next=${encodeURIComponent(location.pathname)}`);
          return;
        }
        const data = await res.json();
        const meId = data?.user?.id;
        const currentId = decodeURIComponent(routeId || "");
        if (!meId || meId !== currentId) {
          router.replace(`/gamer/profile/${meId || ""}`);
          return;
        }
        setReady(true);
      } catch {
        router.replace("/Signin");
      }
    });
    return () => unsub && unsub();
  }, [router, routeId]);

  return ready;
}

function formatDate(date) {
  if (!date) return "";
  const options = { day: "numeric", month: "short", year: "numeric" };
  const formatter = new Intl.DateTimeFormat("en-US", options);
  let d;
  if (date._seconds) {
    d = new Date(date._seconds * 1000);
  } else if (typeof date === "string") {
    d = new Date(date);
  } else if (date instanceof Date) {
    d = date;
  } else {
    return "";
  }
  const parts = formatter.formatToParts(d);
  const day = parts.find(p => p.type === "day").value;
  const month = parts.find(p => p.type === "month").value;
  const year = parts.find(p => p.type === "year").value;
  return `${day} ${month} ${year}`;
}
const todayStr = (() => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`; // yyyy-mm-dd in LOCAL time
})();

export function AddAchievement({ userid }) {
  const [open, setOpen] = useState(false);
  const uid = userid;
  const [achievements, setAchievements] = useState([]);
  const [form, setForm] = useState({
    name: "",
    association: "",
    game: "",
    date: "",
    file: null,
  });
  const [errors, setErrors] = useState({});
  const [fileErr, setFileErr] = useState("");



  async function fetchAchievements() {
    const res = await authedFetch(`http://localhost:4000/api/gamer/${uid}/achievements`);
    const data = await res.json();
    if (data.success) setAchievements(data.achievements);
  }

  useEffect(() => {
    if (!uid) return;
    fetchAchievements();
  }, [uid]);

  function handleFileChange(e) {
    const f = e.target.files?.[0] || null;
    if (!f) {
      setForm({ ...form, file: null });
      setFileErr("");
      return;
    }
    if (!ALLOWED_MIME.has(f.type)) {
      setFileErr("Only PNG, JPG, WebP, SVG, or PDF.");
      setForm({ ...form, file: null });
      e.target.value = "";
      return;
    }
    setFileErr("");
    setForm({ ...form, file: f });
  }

  async function handleSave(e) {
    e.preventDefault();

    const nextErrors = {};
    if (!form.name?.trim()) nextErrors.name = "Required.";
    if (!form.game?.trim()) nextErrors.game = "Required.";
    if (!form.association?.trim()) nextErrors.association = "Required.";
    if (!form.date?.trim()) nextErrors.date = "Required.";
    if (!form.file) nextErrors.file = "Required.";

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length || fileErr) return;

    try {
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("association", form.association);
      formData.append("game", form.game);
      formData.append("date", form.date);
      if (form.file) {
        formData.append("file", form.file);
      }

      const res = await authedFetch(`http://localhost:4000/api/gamer/${uid}/add`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Unknown error");

      await fetchAchievements();
      setForm({ name: "", association: "", game: "", date: "", file: null });
      setErrors({});
      setFileErr("");
      setOpen(false);

    } catch (err) {
      console.error("❌ Error saving achievement:", err);
      alert("Failed to save achievement. Try again.");
    }
  }

  return (
    <div>
      <div className="p-6 mt-0 px-4 sm:px-6 lg:px-14 mx-auto w-full max-w-15xl grid grid-cols-1 gap-8">
        <div className="flex items-center gap-3 mb-6">
          <h1 className="text-4xl mr-3 font-bold text-[#fccc22]">ACHIEVEMENTS</h1>
          <button
            onClick={() => setOpen(true)}
            className="text-white hover:text-[#6449b5]  font-bold text-4xl"
          >
            +
          </button>
        </div>

        <div className="space-y-6">
          {achievements.map((ach) => (
            <div
              key={ach.id}
              className="flex items-center justify-between bg-[#2b2142b3] relative -top-5 rounded-xl p-6 shadow-md hover:scale-[1.01] transition-transform duration-200 gap-6"
            >
              <FaTrophy size={30} className="text-[#FCCC22] text-3xl flex-shrink-0" />

              <div className="flex flex-col min-w-[220px]">
                <h3 className="text-3xl font-bold text-white">{ach.name}</h3>
                <p className="text-xl text-gray-300">{ach.game}</p>
              </div>

              <div className="flex flex-col min-w-[200px]">
                <p className="text-2xl text-gray-200">{ach.association}</p>
                <p className="text-xl text-gray-400"> {formatDate(ach.date)}</p>
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
                    <a
                      href={ach.file}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 text-sm underline"
                    >
                      Open
                    </a>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  className="text-gray-400 hover:text-[#FCCC22] font-bold text-[20px]"
                >
                  <span className="inline-block transform -scale-x-100">✎</span>
                </button>

                <button
                  className="text-gray-400 hover:text-[#FCCC22]"
                >
                  <FaTrash size={15} />
                </button>
              </div> </div>
          ))}
        </div>  </div>

      {open && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50">
          <div className="bg-[#1d1530]  rounded-xl p-6 w-96 relative">
            <button
              onClick={() => setOpen(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-white text-4xl"
            >
              ×
            </button>

            <form onSubmit={handleSave} className="flex flex-col">
              <p className="text-white text-lg font-semibold mb-2">Enter achievement name</p>
              <input
                type="text"
                placeholder="Achievement"
                value={form.name}
                onChange={(e) =>
                  setForm({ ...form, name: e.target.value.slice(0, 35) })
                }
                maxLength={35}
                className={`p-3 rounded bg-[#0C0817] mb-1 text-white ${errors.name ? "ring-2 ring-red-500" : ""
                  }`}
                aria-describedby="name-err"
              />
              <div id="name-err" className="text-xs text-gray-400 mb-2">
                {errors.name ? <span className="text-red-400">{errors.name}</span> : `${form.name?.length || 0}/35`}
              </div>

              <p className="text-white text-lg font-semibold mb-2">Select game</p>
              <select
                value={form.game}
                onChange={(e) => setForm({ ...form, game: e.target.value })}
                className={`p-3 rounded bg-[#0C0817] text-white mb-1 ${errors.game ? "ring-2 ring-red-500" : ""
                  }`}
                aria-describedby="game-err"
              >
                <option value="">Select</option>
                <option value="Overwatch">Overwatch</option>
                <option value="Rocket League">Rocket League</option>
                <option value="Call of Duty">Call of Duty</option>
              </select>
              <div id="game-err" className="text-xs text-red-400 mb-2">{errors.game || ""}</div>

              <p className="text-white text-lg font-semibold mb-2">Enter official association</p>
              <input
                type="text"
                placeholder="Association"
                value={form.association}
                onChange={(e) => setForm({ ...form, association: e.target.value.slice(0, 35) })}
                maxLength={35}
                className={`p-3 rounded bg-[#0C0817]  mb-1 text-white ${errors.association ? "ring-2 ring-red-500" : ""
                  }`}
                aria-describedby="assoc-err"
              />
              <div id="assoc-err" className="text-xs text-gray-400 mb-2">
                {errors.association ? <span className="text-red-400">{errors.association}</span> : `${form.association?.length || 0}/35`}
              </div>

              <p className="text-white text-lg font-semibold mb-2">Enter the issued date</p>
              <input
                type="date"
                value={form.date}
                max={todayStr}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v && v > todayStr) {

                    setForm((f) => ({ ...f, date: todayStr }));
                    setErrors((errs) => ({ ...errs, date: "Date cannot be in the future." }));
                  } else {
                    setForm((f) => ({ ...f, date: v }));

                    setErrors((errs) => ({ ...errs, date: "" }));
                  }
                }}
                className={`p-3 rounded bg-[#0C0817] mb-1 text-white date-yellow ${errors.date ? "ring-2 ring-red-500" : ""
                  }`}
                aria-describedby="date-err"
              />
              <div id="date-err" className="text-xs text-red-400 mb-2">{errors.date || ""}</div>

              <p className="text-white text-lg font-semibold mb-2">Upload file / photo</p>
              <input
                type="file"
                accept=".png,.jpg,.jpeg,.webp,.svg,application/pdf"
                onChange={handleFileChange}
                className={`p-3 rounded bg-[#0C0817] mb-1 text-white ${(errors.file || fileErr) ? "ring-2 ring-red-500" : ""
                  }`}
                aria-describedby="file-help"
              />
              <div id="file-help" className="text-xs mb-2">
                {fileErr ? (
                  <span className="text-red-400">{fileErr}</span>
                ) : errors.file ? (
                  <span className="text-red-400">{errors.file}</span>
                ) : (
                  <span className="text-gray-400">Only PNG, JPG, WebP, SVG, or PDF.</span>
                )}
              </div>
              <button
                type="submit"
                className="px-9 py-2 mx-auto block bg-[#FCCC22] text-[#0C0817] font-bold rounded-md text-xl mt-4 mb-2 hover:scale-105 transition-transform duration-200"
              >
                Save
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}


export default function GamerProfile() {
  const params = useParams();
  const raw = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const uid = decodeURIComponent(raw ?? "");
  const router = useRouter();
  const [games, setGames] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState(null);
  const [username, setUsername] = useState("");
  const [achievements, setAchievements] = useState([]);
  const [allGames, setAllGames] = useState([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [error, setError] = useState("");
  const ready = useOwnerGuard();
  const { id } = useParams();
  const userId = Array.isArray(id) ? id[0] : id;




  // followers / following
  useEffect(() => {
    if (!ready || !uid) return;
    (async () => {
      try {
        const res = await authedFetch(`http://localhost:4000/api/gamer/${uid}/followNums`);
        const data = await res.json();
        if (data.success) {
          setFollowersCount(data.followersCount);
          setFollowingCount(data.followingCount);
        }
      } catch (err) {
        console.error("followNums:", err);
      }
    })();
  }, [uid, ready]);

  // all available games 
  useEffect(() => {
    if (!ready) return;
    (async () => {
      try {
        const res = await authedFetch("http://localhost:4000/api/gamer/games/all");
        const data = await res.json();
        if (data.success) setAllGames(data.games);
      } catch (e) {
        console.error("getAllGames:", e);
      }
    })();
  }, [ready]);

  // user’s games
  const refreshGames = async () => {
    if (!ready || !uid) return;
    try {
      const res = await authedFetch(`http://localhost:4000/api/gamer/${uid}/games`);
      const data = await res.json();
      if (data.success) setGames(data.games);
    } catch (e) {
      console.error("listGames:", e);
    }
  };

  useEffect(() => { refreshGames(); }, [uid, ready]);

  async function handleAdd() {
    if (!selectedGame) {
      setError(" Please select a game");
      return;
    }
    setError("");

    await authedFetch(`http://localhost:4000/api/gamer/${uid}/add/games`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        gameid: selectedGame.id,
        username: username || "—",
        rank: 0
      })
    });

    await refreshGames();
    setIsModalOpen(false);
    setSelectedGame(null);
    setUsername("");
  }


  const availableGames = allGames.filter(
    (g) => !games.some((ug) => ug.gameid === g.id)
  );

  const [profile, setProfile] = useState(null);
  useEffect(() => {
    if (!ready || !uid) return;

    (async () => {
      try {
        const res = await authedFetch(`http://localhost:4000/api/gamer/${uid}/profile`);
        const data = await res.json();

        if (data.success) {
          setProfile(data.profile);
          setAchievements(data.achievements ?? []);
        } else {
          console.error("API Error:", data.message || data.error || "Unknown error");
        }
      } catch (err) {
        console.error("Fetch profile failed:", err);
      }
    })();
  }, [uid, ready]);

  if (!profile) {
    return <div className="text-gray-400 p-6">Loading profile...</div>;
  }

  return (




    <div className="flex min-h-screen">
      <div className="w-[250px]">
        <LeftSidebar role="gamer" active="profile" userId={id} />      </div>

      <div className="flex-1 flex flex-col bg-[acecoreBackground] font-barlow overflow-x-hidden">


        <div className="relative w-full min-h-screen">

          <div className="fixed inset-0 z-0 h-full">
            <Particles
              particleColors={["#ffffff", "#ffffff"]}
              particleCount={200}
              particleSpread={10}
              speed={0.1}
              particleBaseSize={100}
              moveParticlesOnHover={false}
              alphaParticles={false}
              disableRotation={false}
            />
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-2 max-w-7xl mx-auto">
            <div className="p-4 flex justify-start">
            </div>

            {/* Gamer Info  #1d1338*/}
            <section className="relative z-10 rounded-xl p-20 shadow-lg bg-[#2b2142b3]">
              <button
                onClick={() => router.push(`/gamer/addinfo/${uid}`)}
                className="absolute top-4 right-4 text-[#fff] hover:text-[#FCCC22] font-bold text-[20px] z-30"
              >
                <span className="inline-block transform -scale-x-100">✎</span>
              </button>

              <div className="flex relative top-2 ml-4 items-start gap-6">

                {profile.profilePhoto ? (
                  <div className="w-72 h-72 rounded-full overflow-hidden bg-[#1C1633] border-4 border-[#5f4a87] shadow-[0_0_20px_#5f4a87,0_0_15px_rgba(95,74,135,0.5)]">
                    <Image
                      src={profile.profilePhoto}
                      alt="Profile Avatar"
                      width={105}           // match w-72 (18rem = 288px)
                      height={105}
                      className="w-40 h-40 object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-40 h-40 flex items-center justify-center rounded-full bg-[#1C1633] border-4 border-[#5f4a87] shadow-[0_0_20px_#5f4a87,0_0_15px_rgba(95,74,135,0.5)]">
                    <User size={80} className=" text-gray-400" /> {/* ≈128×128 */}
                    {/* or: <User size={128} className="text-gray-400" /> */}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className=" relative top-2 min-w-0">
                    <h2 className="text-[40px] font-bold truncate">
                      {profile.firstName} {profile.lastName}
                    </h2>
                    <p className="text-[26px] text-gray-400 mt-1 truncate">
                      @{profile.username}
                    </p>
                  </div>
                </div>
              </div>

              <div className="absolute left-1/2 top-8 md:top-10  transform z-40">
                <div className="flex gap-4 bg-transparent ml-20 relative top-20 items-center">
                  <Link href={`/gamer/followList/${uid}`} className="cursor-pointer text-center">
                    <div className="text-4xl font-bold text-white">
                      {followersCount}
                    </div>
                    <div className="text-2xl text-gray-400">Followers</div>
                  </Link>

                  <Link href={`/gamer/followList/${uid}`} className="cursor-pointer text-center">
                    <div className="text-4xl font-bold text-white">
                      {followingCount}
                    </div>
                    <div className="text-2xl text-gray-400">Following</div>
                  </Link>
                </div>
              </div>

              {/* Bio + right info row */}
              <div className="-mt-5 flex justify-between   relative top-10 items-start gap-8">
                {/* Bio */}
                <div className="flex flex-col mb-8  ml-48 text-white-400 text-xl">
                  <p className="mb-8 max-w-[48ch] whitespace-pre-line break-words leading-relaxed">
                    {profile.bio}
                  </p>
                </div>


                <div className="flex flex-col items-end">
              
                  <div className="text-white-400 text-xl text-right">
                    <div className="mt-3 flex items-center gap-2">
                      <Flag className="size-5 text-fuchsia-300 relative top-1" />
                      {profile.nationality}
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <Cake className="size-5 text-fuchsia-300" />
                      <p>Born</p>{formatDate(profile.birthdate)}
                    </div>



                  </div>
                  <div className="flex space-x-2 relative top-10 mt-8">
                    {profile.socials?.twitch && (
                      <a href={profile.socials.twitch} target="_blank" rel="noopener noreferrer">
                        <img src="/twitchIcon.svg" alt="Twitch" className="w-9 h-9 relative -top-1 icon-glow" />
                      </a>
                    )}
                    {profile.socials?.discord && (
                      <a href={profile.socials.discord} target="_blank" rel="noopener noreferrer">
                        <img src="/discord.svg" alt="Discord" className="w-11 h-11 relative -top-2 ml-2.5 icon-glow" />
                      </a>
                    )}
                    {profile.socials?.youtube && (
                      <a href={profile.socials.youtube} target="_blank" rel="noopener noreferrer">
                        <img src="/youtube.svg" alt="YouTube" className="w-[68px] h-[68px] relative -top-4 icon-glow" />
                      </a>
                    )}
                    {profile.socials?.x && (
                      <a href={profile.socials.x} target="_blank" rel="noopener noreferrer">
                        <img src="/x.svg" alt="X" className="w-8 h-8 icon-glow" />
                      </a>
                    )}
                  </div>

                </div>
              </div>
            </section>

            {/*Add Games*/}
            <div className="p-6">
              <div className="flex relative mb-[30px] z-[50] items-center gap-3 mb-4">
                <h1 className="text-4xl font-bold text-[#fccc22]">GAMES</h1>
                {availableGames.length > 0 && (
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="text-[#ffff] font-bold text-4xl hover:text-[#6449b5]">
                    +
                  </button>
                )}
              </div>

              <div className="mt-0 grid grid-cols-3 sm:grid-cols-2 lg:grid-cols-3 gap-8 relative z-[20]">


                {games.map((g) => (
                  <div
                    key={g.id}
                    className="w-150 h-150 rounded-xl shadow-md  bg-[#2b2142b3] border border-[#1f2430] overflow-hidden flex flex-col"
                  >
                    <img
                      src={g.gamePhoto}
                      alt={g.gameName}
                      className="w-full h-60 object-cover"
                    />

                    <div className="p-4 flex flex-col gap-1 text-left">
                      <div className="flex items-center">

                        <div className="flex flex-col">
                          <span className="font-bold text-white relative -top-4 text-[32px]">{g.gameName}</span>
                          <span className="text-[20px] text-gray-400">@{g.username}</span>
                        </div>

                        <div className="flex-grow flex justify-center">
                          <span className="font-bold text-[#fccc22] text-[65px]">{g.rank}</span>
                        </div>

                        <div className="flex gap-2 relative -top-9">
                          <button className="hover:text-[#fccc22] text-gray-400">
                            <span className="inline-block transform -scale-x-100 text-xl">✎</span>
                          </button>
                          <button className="hover:text-[#fccc22] text-gray-400 text-sm">
                            <FaTrash />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>



              {isModalOpen && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-[5000]">
                  <div className="bg-[#1d1530] rounded-xl p-6 w-96 relative">
                    <button
                      onClick={() => { setIsModalOpen(false); setSelectedGame(null); setError(""); }}
                      className="absolute top-3 right-3 text-gray-400 hover:text-white text-4xl"
                    >
                      ×
                    </button>

                    <h2 className="text-2xl font-bold mb-4 text-white">Select Game</h2>
                    {error && <p className="text-red-500 text-lg mb-3 text-center">{error}</p>}

                    <div className="grid grid-cols-1 gap-3 mb-4">
                      {availableGames.map((game) => (
                        <button
                          key={game.id}
                          onClick={() => {
                            setSelectedGame(game);
                            setError(""); // clear error if user picks a game
                          }}
                          className={`p-3 rounded border flex items-center gap-3 ${selectedGame?.id === game.id
                            ? "border-yellow-400 bg-[#0C0817]"
                            : "border-[#0C0817] bg-[#0C0817] hover:border-[#fccc22]"
                            }`}
                        >
                          <img
                            src={game.gamePhoto}
                            alt={game.gameName}
                            className="w-14 h-14 rounded"
                          />
                          <span className="text-white text-xl">{game.gameName}</span>
                        </button>
                      ))}

                    </div>

                    <h2 className="text-2xl font-bold mb-4 text-white">Enter username (optional)</h2>
                    <input
                      type="text"
                      placeholder="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.slice(0, 16))}
                      maxLength={16}
                      className="w-full mb-1 p-3 rounded bg-[#0C0817] text-white outline-none"
                    />

                    <button
                      onClick={handleAdd}
                      className="px-9 py-1 mt-3 mx-auto block bg-[#FCCC22] text-[#0C0817] font-bold rounded-md text-xl hover:scale-105 transition-transform duration-200">
                      Add
                    </button>

                  </div>
                </div>
              )}
            </div>



            <section className="relative z-100 flex relative mb-[30px] z-[50] items-center gap-3 mb-4">
              <AddAchievement userid={uid} />
            </section>
          </div>
        </div>
      </div >
    </div >
  );
}
