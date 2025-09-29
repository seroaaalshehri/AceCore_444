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



export function AddAchievement({ userid }) {
  const [open, setOpen] = useState(false);
  const [achievements, setAchievements] = useState([]);
  const [form, setForm] = useState({
    name: "",
    association: "",
    game: "",
    date: "",
    file: null,
  });

  const uid = userid;


  async function fetchAchievements() {
    const res = await fetch(`http://localhost:4000/api/gamer/${uid}/achievements`);
    const data = await res.json();
    if (data.success) setAchievements(data.achievements);
  }
  useEffect(() => {
    if (!uid) return;
    fetchAchievements();
  }, [uid]);




  async function handleSave(e) {
    e.preventDefault();

    if (!form.name || !form.association || !form.game || !form.date) {
      alert("Please enter all required fields.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("association", form.association);
      formData.append("game", form.game);
      formData.append("date", form.date);
      if (form.file) {
        formData.append("file", form.file);
      }

      const res = await fetch(`http://localhost:4000/api/gamer/${userid}/add`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Unknown error");

      await fetchAchievements();
      setForm({ name: "", association: "", game: "", date: "", file: null });
      setOpen(false);

    } catch (err) {
      console.error("❌ Error saving achievement:", err);
      alert("Failed to save achievement. Try again.");
    }
  }


  return (
    <div>
      <div className="p-6 mt-0 px-4 sm:px-6 lg:px-8 mx-auto w-full max-w-6xl grid grid-cols-1 gap-8">
        <div className="flex items-center gap-3 mb-6">
          <h1 className="text-3xl  mr-3 font-bold text-[#fccc22]">ACHIEVEMENTS</h1>
          <button
            onClick={() => setOpen(true)}
            className="text-white hover:text-[#6449b5]  font-bold text-4xl"
          >
            +
          </button>
        </div>

        <div className="space-y-4">
          {achievements.map((ach) => (
            <div
              key={ach.id}
              className="flex items-center justify-between bg-[#2b2142b3] relative -top-5 rounded-xl p-6 shadow-md hover:scale-[1.01] transition-transform duration-200 gap-8"
            > {/* bg-[#1C1633]/60 border border-[#3b2d5e] rounded-xl   bg-[#34285a]     bg-[#2b2142b3] bg-gradient-to-br from-[#0C0817] via-[#28213a] to-[#1C1633]*/}

              <FaTrophy size={22} className="text-[#FCCC22] text-3xl flex-shrink-0" />

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


              <div className="flex items-center gap-3">
                <button
                  className="text-gray-400 hover:text-[#FCCC22] font-bold text-[17px]"
                >
                  <span className="inline-block transform -scale-x-100">✎</span>
                </button>

                <button
                  className="text-gray-400 hover:text-[#FCCC22]"
                >
                  <FaTrash size={13} />
                </button>
              </div> </div>
          ))}
        </div>  </div>

      {open && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50">
          <div className="bg-[#34285a]  rounded-xl p-6 w-96 relative">
            <button
              onClick={() => setOpen(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-white text-21xl"
            >
              ×
            </button>

            <form onSubmit={(e) => {
              handleSave(e);
            }} className="flex flex-col">

              <p className="text-white text-lg font-semibold mb-2">Enter achievement name</p>
              <input
                type="text"
                placeholder="Achievement"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="p-3 rounded [#3b2d5e] mb-2"
              />

              <p className="text-white text-lg font-semibold mb-2">Select game</p>
              <select
                value={form.game}
                onChange={(e) => setForm({ ...form, game: e.target.value })}
                required
                className="p-3 rounded bg-[#0C0817] text-white mb-2"
              >
                <option value="">Select</option>
                <option value="Overwatch">Overwatch</option>
                <option value="Rocket League">Rocket League</option>
                <option value="Call of Duty">Call of Duty</option>
              </select>

              <p className="text-white text-lg font-semibold mb-2">Enter official association</p>
              <input
                type="text"
                placeholder="Association"
                value={form.association}
                onChange={(e) => setForm({ ...form, association: e.target.value })}
                required
                className="p-3 rounded bg-[#0C0817] mb-2"
              />

              <p className="text-white text-lg font-semibold mb-2">Enter the issued date</p>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                required
                className="p-3 rounded bg-[#0C0817] mb-2 date-yellow"
              />

              <p className="text-white text-lg font-semibold mb-2">Upload file / photo</p>
              <input
                type="file"
                onChange={(e) => setForm({ ...form, file: e.target.files[0] })}
                required
                className="p-3 rounded bg-[#0C0817] mb-4"
              />

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


// followers / following
useEffect(() => {
  if (!uid) return;
  (async () => {
    try {
      const res = await fetch(`http://localhost:4000/api/gamer/${uid}/followNums`);
      const data = await res.json();
      if (data.success) {
        setFollowersCount(data.followersCount);
        setFollowingCount(data.followingCount);
      }
    } catch (err) {
      console.error("followNums:", err);
    }
  })();
}, [uid]);

// all available games (doesn't need uid but fine to keep separate)
useEffect(() => {
  (async () => {
    try {
      const res = await fetch("http://localhost:4000/api/gamer/");
      const data = await res.json();
      if (data.success) setAllGames(data.games);
    } catch (e) {
      console.error("getAllGames:", e);
    }
  })();
}, []);

// user’s games
const refreshGames = async () => {
  if (!uid) return;
  try {
    const res = await fetch(`http://localhost:4000/api/gamer/${uid}`);
    const data = await res.json();
    if (data.success) setGames(data.games);
  } catch (e) {
    console.error("listGames:", e);
  }
};

useEffect(() => { refreshGames(); }, [uid]);


  async function handleAdd() {
    if (!selectedGame) {
      setError("⚠️ Please select a game");
      return;
    }
    setError("");

    await fetch("http://localhost:4000/api/gamer/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userid: uid,
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
  if (!uid) return; 

  (async () => {
    try {
      const res = await fetch(`http://localhost:4000/api/gamer/${uid}/profile`);
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
}, [uid]);

if (!profile) {
  return <div className="text-gray-400 p-6">Loading profile...</div>;
}

  return (

    <div className="flex min-h-screen">
      <div className="w-[250px]">
        <LeftSidebar />
      </div>
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
                onClick={() => router.push("/gamer/addinfo")}
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
                      width={260}           // match w-72 (18rem = 288px)
                      height={260}
                      className="w-60 h-60 object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-60 h-60 flex items-center justify-center rounded-full bg-[#1C1633] border-4 border-[#5f4a87] shadow-[0_0_20px_#5f4a87,0_0_15px_rgba(95,74,135,0.5)]">
                    <User className="w-32 h-32 text-gray-400" /> {/* ≈128×128 */}
                    {/* or: <User size={128} className="text-gray-400" /> */}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className=" relative top-2 min-w-0">
                    <h2 className="text-[32px] font-bold truncate">
                      {profile.firstName} {profile.lastName}
                    </h2>
                    <p className="text-[21px] text-gray-400 mt-1 truncate">
                      @{profile.username}
                    </p>
                  </div>
                </div>
              </div>

              <div className="absolute left-1/2 top-8 md:top-10 transform z-40">
                <div className="flex gap-8 bg-transparent relative top-5 items-center">
                  <Link href="/gamer/profile/followers" className="cursor-pointer text-center">
                    <div className="text-3xl font-bold text-white">
                      {followersCount}
                    </div>
                    <div className="text-xl text-gray-400">Followers</div>
                  </Link>

                  <Link href="/gamer/profile/following" className="cursor-pointer text-center">
                    <div className="text-3xl font-bold text-white">
                      {followingCount}
                    </div>
                    <div className="text-xl text-gray-400">Following</div>
                  </Link>
                </div>
              </div>

              <div className="-mt-5 flex justify-between relative top-7 items-start">
                <div className="max-w-[650px] text-white mt-8 md:mt-8 pl-[140px]">
                  <p className="text-xl mb-5">{profile.bio}</p>
                </div>


                <div className="flex flex-col items-end">
                  <div className="text-white-400 text-lg text-right -mt-4 md:-mt-6">
                    <div className="mt-3 flex items-center gap-2">
                      <Flag className="size-5 text-fuchsia-300 relative top-1" />
                      {profile.nationality}
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <Cake className="size-5 text-fuchsia-300" />
                      <p>Born</p>{formatDate(profile.birthdate)}</div>
                  </div>


                  <div className="flex space-x-2 relative top-10 mt-8">
                    {profile.socials?.twitch && (
                      <a href={profile.socials.twitch} target="_blank" rel="noopener noreferrer">
                        <img src="/twitchIcon.svg" alt="Twitch" className="w-7 h-7 relative -top-1 icon-glow" />
                      </a>
                    )}
                    {profile.socials?.discord && (
                      <a href={profile.socials.discord} target="_blank" rel="noopener noreferrer">
                        <img src="/discord.svg" alt="Discord" className="w-9 h-9 relative -top-2 ml-2.5 icon-glow" />
                      </a>
                    )}
                    {profile.socials?.youtube && (
                      <a href={profile.socials.youtube} target="_blank" rel="noopener noreferrer">
                        <img src="/youtube.svg" alt="YouTube" className="w-[55px] h-[55px] relative -top-4 icon-glow" />
                      </a>
                    )}
                    {profile.socials?.x && (
                      <a href={profile.socials.x} target="_blank" rel="noopener noreferrer">
                        <img src="/x.svg" alt="X" className="w-6 h-6 icon-glow" />
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

              <div className="mt-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 relative z-[20]">
                {games.map((g) => (
                  <div
                    key={g.id}
                    className="w-80 rounded-xl shadow-md  bg-[#2b2142b3] border border-[#1f2430] overflow-hidden flex flex-col"
                  >
                    <img
                      src={g.gamePhoto}
                      alt={g.gameName}
                      className="w-full h-48 object-cover"
                    />

                    <div className="p-4 flex flex-col gap-2 text-left">
                      <div className="flex items-center">

                        <div className="flex flex-col">
                          <span className="font-bold text-white relative -top-4 text-[32px]">{g.gameName}</span>
                          <span className="text-[20px] text-gray-400">@{g.username}</span>
                        </div>

                        <div className="flex-grow flex justify-center">
                          <span className="font-bold text-[#fccc22] text-[65px]">{g.rank}</span>
                        </div>

                        <div className="flex gap-2 relative -top-9">
                          <button className="hover:text-[#fccc22]">
                            <span className="inline-block transform -scale-x-100 text-lg">✎</span>
                          </button>
                          <button className="hover:text-[#fccc22] text-sm">
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
                  <div className="bg-[#2b2142b3] rounded-xl p-6 w-96 relative">
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
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full mb-4 p-3 rounded bg-[#0C0817]"
                    />

                    <button
                      onClick={handleAdd}
                      className="px-9 py-1 mx-auto block bg-[#FCCC22] text-[#0C0817] font-bold rounded-md text-xl hover:scale-105 transition-transform duration-200">
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
      </div>
    </div>


  );
}








