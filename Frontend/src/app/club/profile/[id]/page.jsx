"use client";


import React, { useState, useEffect } from "react";
import Image from "next/image";
import "../../../globals.css";
import Particles from "../../../Components/Particles";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { getYear, getMonth } from "date-fns";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import LeftSidebar, { SIDEBAR_WIDTH } from "../../../Components/LeftSidebar";
import { FaTrash, FaTrophy } from "react-icons/fa";
import { MapPin, FileText, Image as ImageIcon, File, User } from "lucide-react";
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

function DeleteConfirmModal({ open, onClose, onConfirm, itemType }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50">
      <div className="bg-[#1d1530] rounded-xl p-6 w-100 relative text-left" dir="ltr">
        <p className="text-2xl font-bold flex justify-center mb-4 text-red-400">
          Warning!
        </p>
        <p className="text-lg font-bold text-white flex justify-center mb-2">
          Are you sure you want to delete the {itemType === "achievement" ? "achievement" : "game"}?
        </p>
        <p className="text-base font-bold text-white-300 flex justify-center mb-4">
          This action is permanent and cannot be undone
        </p>
        <div className="flex w-full space-x-2 mt-4">
          <button
            onClick={onConfirm}
            className="w-1/2 bg-red-600 hover:bg-red-500 px-4 py-2 rounded text-lg text-white font-bold"
          >
            Delete
          </button>
          <button
            onClick={onClose}
            className="w-1/2 bg-gray-500 hover:bg-gray-400 px-4 py-2 rounded text-lg text-white font-bold"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

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
          router.replace(`/club/profile/${meId || ""}`);
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

function scrimTypes(gameName = "") {
  const n = gameName.toLowerCase();
  if (n === "rocket league") return ["1v1", "2v2", "3v3"];
  if (n === "overwatch") return ["4v4", "5v5"];
  if (n === "call of duty") return ["1v1", "2v2", "3v3", "4v4", "5v5", "6v6"];
  return ["1v1"];
}

const todayStr = (() => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`; // yyyy-mm-dd in LOCAL time
})();

//*******************************************Achievements method*******************************************
export function AddAchievement({ userid, onDeleteAchievement, reloadFlag }) {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
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
  const [loading, setLoading] = useState(false);

  async function fetchAchievements() {
    const res = await authedFetch(`http://localhost:4000/api/club/${uid}/achievements`);
    const data = await res.json();
    if (data.success) setAchievements(data.achievements);
  }
  useEffect(() => {
    if (!uid) return;
    fetchAchievements();
  }, [uid, reloadFlag]);

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
    if (loading) return;
    setLoading(true);

    const nextErrors = {};
    if (!form.name?.trim()) nextErrors.name = "Required.";
    if (!form.game?.trim()) nextErrors.game = "Required.";
    if (!form.association?.trim()) nextErrors.association = "Required.";
    if (!form.date?.trim()) nextErrors.date = "Required.";
    if (!editingId && !form.file) nextErrors.file = "Required.";

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length || fileErr) {
      setLoading(false);
      return;
    }

    try {
      if (editingId) {
        const url = `http://localhost:4000/api/club/${uid}/achievements/${editingId}`;

        const formData = new FormData();
        formData.append("name", form.name);
        formData.append("association", form.association);
        formData.append("game", form.game);
        formData.append("date", form.date);
        if (form.file) {
          formData.append("file", form.file);
        }

        const res = await authedFetch(url, {
          method: "PUT",
          body: formData,
        });

        const data = await res.json();
        if (!data.success) {
          throw new Error(data.error || "Unknown error");
        }

        await fetchAchievements();
        setEditingId(null);
      } else {
        // POST add
        const formData = new FormData();
        formData.append("name", form.name);
        formData.append("association", form.association);
        formData.append("game", form.game);
        formData.append("date", form.date);
        if (form.file) {
          formData.append("file", form.file);
        }
        const url = `http://localhost:4000/api/club/${uid}/add`;
        console.debug("authedFetch ->", url, "(FormData)");
        const res = await authedFetch(url, { method: "POST", body: formData });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || "Unknown error");
        await fetchAchievements();
      }
      setForm({ name: "", association: "", game: "", date: "", file: null });
      setErrors({});
      setFileErr("");
      setOpen(false);

    } catch (err) {
      console.error("❌ Error saving achievement:", err);
      alert("Failed to save achievement. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="p-6 mt-0 px-4 sm:px-6 lg:px-14 mx-auto w-full max-w-15xl grid grid-cols-1 gap-8">
        <div className="flex items-center gap-3 mb-6 -ml-6">
          <h1 className="text-5xl font-bold text-[#fccc22]">ACHIEVEMENTS</h1>
          <button
            onClick={() => setOpen(true)}
            className="text-white hover:text-[#6449b5] font-bold text-5xl"
          >
            +
          </button>
        </div>

        <div className="space-y-6">
          {achievements.map((ach) => (
            <div
              key={ach.id}
              className="flex items-center justify-between bg-[#1c1430] relative -top-5 rounded-xl pt-7 pb-7 pr-10 pl-12 shadow-md hover:scale-[1.01] transition-transform duration-200 gap-6 -ml-10 min-w-[109%]"
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
                  onClick={() => {
                    setForm({
                      name: ach.name || "",
                      association: ach.association || "",
                      game: ach.game || "",
                      date: ach.date ? (typeof ach.date === 'string' ? ach.date.slice(0, 10) : (ach.date._seconds ? new Date(ach.date._seconds * 1000).toISOString().slice(0, 10) : "")) : "",
                      file: null
                    });
                    setEditingId(ach.id);
                    setOpen(true);
                    setErrors({});
                    setFileErr("");
                  }}
                  title="Edit Achievement"
                >
                  <span className="inline-block transform -scale-x-100">✎</span>
                </button>

                <button
                  className="text-gray-400 hover:text-[#FCCC22]"
                  onClick={() => onDeleteAchievement(ach)}
                  title="Delete Achievement"
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
              onClick={() => {
                setOpen(false);
                setForm({ name: "", association: "", game: "", date: "", file: null });
                setErrors({});
                setFileErr("");
              }}
              className="absolute top-3 right-3 text-gray-400 hover:text-white text-4xl">
              × </button>

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
              <div id="name-err" className="text-s text-gray-400 mb-2">
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
              <div id="game-err" className="text-s text-red-400 mb-2">{errors.game || ""}</div>

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
              <div id="assoc-err" className="text-s text-gray-400 mb-2">
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
              <div id="date-err" className="text-s text-red-400 mb-2">{errors.date || ""}</div>

              <p className="text-white text-lg font-semibold mb-2">Upload file / photo</p>
              <input
                type="file"
                accept=".png,.jpg,.jpeg,.webp,.svg,application/pdf"
                onChange={handleFileChange}
                className={`p-3 rounded bg-[#0C0817] mb-1 text-white ${(errors.file || fileErr) ? "ring-2 ring-red-500" : ""
                  }`}
                aria-describedby="file-help"
              />
              <div id="file-help" className="text-s mb-2">
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
                disabled={loading}
                className="px-9 py-2 mx-auto block bg-[#FCCC22] text-[#0C0817] font-bold rounded-md text-xl mt-4 mb-2 hover:scale-105 transition-transform duration-200 disabled:opacity-80"
              >
                {loading ? "Saving..." : "Save"}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

//*******************************************Schedule method*******************************************
export function ScrimArenaSchedule({ userid, userGames }) {
  const uid = userid;
  const [active, setActive] = React.useState("all");
  const [slots, setSlots] = React.useState([]);
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState({ date: "", time: "", maxGamers: "", scrimType: "" });
  const [errors, setErrors] = React.useState({});
  const [weekSlots, setWeekSlots] = React.useState([]);
  const types = scrimTypes(active?.gameName || "");
  const [loading, setLoading] = React.useState(false);
  const params = useParams();

  const clubId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const weekAhead = new Date(tomorrow);
  weekAhead.setDate(tomorrow.getDate() + 6);

  const minDate = tomorrow.toISOString().split("T")[0];
  const maxDate = weekAhead.toISOString().split("T")[0];
  const router = useRouter();

  const tsToDate = (scrimTime) =>
    new Date(scrimTime?._seconds ? scrimTime._seconds * 1000 : Date.parse(scrimTime));

  React.useEffect(() => {
    if (!uid || !active) return;
    fetchSlots();
  }, [uid, active]);

  async function addSlot() {
    if (loading) return;
    setLoading(true);

    const { date, time, maxGamers, scrimType } = form;
    const newErrors = {};

    let maxAcceptance = 0;
    switch (scrimType) {
      case "1v1":
        maxAcceptance = 2;
        break;
      case "2v2":
        maxAcceptance = 4;
        break;
      case "3v3":
        maxAcceptance = 6;
        break;
      case "4v4":
        maxAcceptance = 8;
        break;
      case "5v5":
        maxAcceptance = 10;
        break;
      case "6v6":
        maxAcceptance = 12;
        break;
    }

    if (!date?.trim()) newErrors.date = "Required.";
    if (!time?.trim()) newErrors.time = "Required.";
    if (!scrimType?.trim()) newErrors.scrimType = "Required.";
    if (!maxGamers) newErrors.maxGamers = "Required.";
    if (isNaN(Number(maxGamers)) || Number(maxGamers) < maxAcceptance)
      newErrors.maxGamers = "Minimum " + maxAcceptance + " Requests.";
    else if (Number(maxGamers) > 500)
      newErrors.maxGamers = "Maximum " + 500 + " Requests.";

    if (date) {
      const newDateOnly = new Date(`${date}T00:00:00`);

      const sameDaySlots = weekSlots.filter((slot) => {
        const d = tsToDate(slot.scrimTime);
        return (
          d.getFullYear() === newDateOnly.getFullYear() &&
          d.getMonth() === newDateOnly.getMonth() &&
          d.getDate() === newDateOnly.getDate()
        );
      });


      if (sameDaySlots.length >= 5) {
        newErrors.date = "You already have 5 time slots for this date.";
      }
    }

    if (date && time) {
      const newSlotDate = new Date(`${date}T${time}:00`);

      const sameDaySlots = weekSlots.filter((slot) => {
        const d = tsToDate(slot.scrimTime);
        return (
          d.getFullYear() === newSlotDate.getFullYear() &&
          d.getMonth() === newSlotDate.getMonth() &&
          d.getDate() === newSlotDate.getDate()
        );
      });

      const is2H = 2 * 60 * 60 * 1000;
      const tooClose = sameDaySlots.some((slot) => {
        const diff = Math.abs(tsToDate(slot.scrimTime).getTime() - newSlotDate.getTime());
        return diff < is2H;
      });

      if (tooClose) {
        newErrors.time = "Leave at least 2 hours between slots on the same date.";
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setLoading(false);
      return;
    }

    const iso = new Date(`${date}T${time}:00`).toISOString();
    const newSlotDate = new Date(`${date}T${time}:00`);
    const endTime = new Date(newSlotDate.getTime() + 1.5 * 60 * 60 * 1000)
    const scrimEndISO = endTime.toISOString();

    const body = {
      gameid: active.gameid,
      scrimTime: iso,
      scrimEndTime: scrimEndISO,
      maxGamers: Number(maxGamers),
      scrimType,
      maxAcceptance: Number(maxAcceptance),
    };

    try {
      const res = await authedFetch(`http://localhost:4000/api/club/${uid}/schedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Unknown error");

      await fetchSlots();
      setOpen(false);
      setForm({ date: "", time: "", maxGamers: "", scrimType: "" });
      setErrors({});
    } catch (err) {
      console.error("Error saving slot:", err);
      setErrors({
        date: "Network or server error. Please try again.",
      });
    }
    finally {
      setLoading(false);
    }
  }


  async function fetchSlots() {
    if (!uid) return;

    const activeParam = active?.gameid ? `gameid=${active.gameid}&` : "";

    const fromDate = new Date();
    fromDate.setHours(0, 0, 0, 0);

    const toDate = new Date();
    toDate.setDate(toDate.getDate() + 7);
    toDate.setHours(23, 59, 59, 999);

    const urlActive = `http://localhost:4000/api/club/${uid}/schedule?${activeParam}from=${fromDate.toISOString()}&to=${toDate.toISOString()}`;
    const urlAll = `http://localhost:4000/api/club/${uid}/schedule?from=${fromDate.toISOString()}&to=${toDate.toISOString()}`;

    const [resActive, resAll] = await Promise.all([authedFetch(urlActive), authedFetch(urlAll)]);
    const dataA = await resActive.json();
    const dataAll = await resAll.json();

    setSlots(dataA?.success ? (dataA.slots || []) : []);

    setWeekSlots(dataAll?.success ? (dataAll.slots || []) : []);
  }

  const groupedSlots = slots.reduce((acc, slot) => {
    const ms = slot.scrimTime?._seconds
      ? slot.scrimTime._seconds * 1000
      : Date.parse(slot.scrimTime);

    const d = new Date(ms);

    const dateKey = d.toLocaleDateString([], {
      weekday: "short",
      month: "short",
      day: "numeric",
    });

    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(slot);
    return acc;
  }, {});

  return (
    <div>
      <div className="p-6 mt-0 px-4 sm:px-6 lg:px-14 mx-auto w-full grid grid-cols-1 gap-8">
        <div className="flex items-center justify-between mb-6 -mt-5">
          <h1 className="text-5xl font-bold text-[#fccc22] -ml-6">SCRIMS SCHEDULING</h1>
          <div className="-mr-10">
            <div className="flex gap-3">
              <button
                onClick={() => setActive("all")}
                className={`px-4 py-2 rounded-md text-xl font-semibold ${active === "all"
                  ? "bg-[#FCCC22] text-[#0C0817]"
                  : "bg-[#2b2142] text-white hover:bg-[#3a2b57]"
                  }`}
              >
                All
              </button>

              {userGames.map((g) => (
                <button
                  key={g.id}
                  onClick={() => setActive(g)}
                  className={`px-4 py-2 rounded-md text-xl font-semibold ${active?.id === g.id
                    ? "bg-[#FCCC22] text-[#0C0817]"
                    : "bg-[#2b2142] text-white hover:bg-[#3a2b57]"
                    }`}
                >
                  {g.gameName}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Active game info */}
        {active?.scrimPhoto && (
          <div className="relative w-[108.5%] -ml-[3.5%] rounded-xl overflow-hidden shadow-md -mt-4">
            <img
              src={active?.scrimPhoto}
              alt={active?.gameName}
              className="w-full h-64 object-cover"
            />
            <div className="absolute inset-0 flex items-center px-10
            bg-gradient-to-r
            from-[#0A0810FF]/95 from-0%
            via-[#110D1AFF]/65 via-35%
            to-transparent to-90%">
              <div>
                <h2 className="text-4xl font-bold text-white">{active?.gameName}</h2>
                <p className="text-[#BE1728FF] font-extrabold text-xl
               [text-shadow:0_0_0.5px_gray]
               [-webkit-text-stroke:0.3px_#270406FF]">
                  Maximum 5 time slots per day for all games
                </p>
              </div>
            </div>
          </div>
        )}

        {active && active !== "all" && (
          <div className="flex justify-end mt-6">
            <button
              onClick={() => {
                setOpen(true);
                setForm({ date: "", time: "", maxGamers: "", scrimType: "" });
                setErrors({});
              }}
              className="px-5 py-2 -mr-9 -mt-7 bg-[#FCCC22] text-[#0C0817] font-bold rounded-md text-xl hover:scale-105 transition-transform duration-200"
            >
              + Add Time Slot
            </button>
          </div>
        )}

        {/* Weekly schedule for the active game only */}
        {slots.length > 0 && (
          <div className="flex flex-col -mt-2 space-y-10">
            {Object.entries(groupedSlots)
              .sort(([a], [b]) => new Date(a) - new Date(b))
              .map(([dateStr, slots]) => (
                <div
                  key={dateStr}
                  className="flex items-center relative left-[48px]"
                >
                  <div className="-ml-20">
                    <div className="w-[200px] flex-shrink-0 text-[#fccc22] font-extrabold text-[34px] flex justify-end pr-6 tracking-wide">
                      {dateStr}
                    </div>
                  </div>

                  <div className="absolute left-[120px] h-[90px] w-[2.5px] bg-[#7a68b9] rounded-full opacity-70"></div>

                  <div className="ml-7 flex flex-wrap gap-4">
                    {slots
                      .filter((slot) => {
                        const start = tsToDate(slot.scrimTime);
                        const startOfToday = new Date();
                        startOfToday.setHours(0, 0, 0, 0);
                        return start >= startOfToday;
                      })

                      .sort((a, b) => tsToDate(a.scrimTime) - tsToDate(b.scrimTime))
                      .map((slot) => {
                        const start = tsToDate(slot.scrimTime).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        });
                        const end = slot.scrimEndTime
                          ? tsToDate(slot.scrimEndTime).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                          : null;
                        return (
                          <div
                            key={slot.id}
                            className="relative flex items-center justify-between bg-[#231a3b] border border-[#3a2f56] rounded-xl px-5 py-5 "
                            style={{
                              width: "300px",
                              height: "125px",
                            }}
                          >
                            <div className="flex flex-col leading-tight">
                              <span className="text-[#fccc22] font-bold text-2xl">
                                {start} – {end}
                              </span>

                                                            <div className="flex flex-row gap-5 leading-tight">
                                {/* Scrim type + max gamers in one row */}
                                  <span className="text-white text-2xl mt-1">
                                    {slot.scrimType}
                                  </span>
                                  <span className="text-gray-300 text-xl mt-1 ml-3">

                                    Max {slot.maxGamers} requests
                                  </span>
                                </div>
                                <span className="text-white text-2xl ">{slot.gameName}</span>

                                <button
                                  onClick={() => router.push(`/club/requests/${clubId}/${slot.id}`)}
                                  className={`w-[77px] h-[38px] absolute bottom-4 right-4 text-[20px] font-bold rounded-md hover:opacity-80 transition-transform ${slot.acceptedCount >= slot.maxAcceptance
                                    ? "bg-green-500 text-[#0C0817]"
                                    : "bg-[#FCCC22] text-[#0C0817]"
                                    }`}

                                >
                                  Manage
                                </button>

                              </div>
                            </div>
                          
                        );
                      })}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-[5000]">
          <div className="bg-[#1d1530] rounded-xl p-6 w-96 relative">
            <button
              onClick={() => {
                setOpen(false);
                setForm({ date: "", time: "", maxGamers: "", scrimType: "" });
                setErrors({});
              }}
              className="absolute top-3 right-3 text-gray-400 hover:text-white text-4xl"
            >
              ×
            </button>

            <h3 className="text-2xl font-bold mb-4 text-white">Add Time Slot</h3>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                addSlot();
              }}
            >
              <style jsx>{`
              input[type="date"]::-webkit-datetime-edit-month-field,
              input[type="date"]::-webkit-datetime-edit-year-field {
              color: white !important; }
              `}</style>

              {/* DATE */}
              <p className="text-white text-lg font-semibold mb-2">Date</p>
              <input
                type="date"
                min={minDate}
                max={maxDate}
                value={form.date}
                onChange={(e) =>
                  setForm({ ...form, date: e.target.value })
                }
                className={`p-3 rounded bg-[#0C0817] mb-1 text-white w-full ${errors.date ? "ring-2 ring-red-500" : ""
                  }`}
              />
              <div className="text-s text-red-400 mb-2">
                {errors.date || ""}
              </div>

              {/* TIME */}
              <p className="text-white text-lg font-semibold mb-2">Time</p>
              <input
                type="time"
                value={form.time}
                onChange={(e) =>
                  setForm({ ...form, time: e.target.value })
                }
                className={`p-3 rounded bg-[#0C0817] mb-1 text-white w-full ${errors.time ? "ring-2 ring-red-500" : ""
                  }`}
              />
              <div className="text-s text-red-400 mb-2">
                {errors.time || ""}
              </div>

              {/* MAX GAMERS */}
              <p className="text-white text-lg font-semibold mb-2">Maximum Gamers Requests</p>
              <input
                type="number"
                value={form.maxGamers}
                onChange={(e) => setForm({ ...form, maxGamers: e.target.value })}
                className={`p-3 rounded bg-[#0C0817] mb-1 text-white w-full ${errors.maxGamers ? "ring-2 ring-red-500" : ""
                  }`}
              />
              <div className="text-s text-red-400 mb-2">{errors.maxGamers || ""} </div>

              {/* SCRIM TYPE */}
              <p className="text-white text-lg font-semibold mb-2">Scrim Type</p>
              <select
                value={form.scrimType}
                onChange={(e) =>
                  setForm({ ...form, scrimType: e.target.value })
                }
                className={`p-3 rounded bg-[#0C0817] mb-4 text-white w-full ${errors.scrimType ? "ring-2 ring-red-500" : ""
                  }`}
              >
                <option value="">Select Scrim Type</option>
                {types.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <div className="text-s text-red-400 mb-2">
                {errors.scrimType || ""}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="px-9 py-2 mx-auto block bg-[#FCCC22] text-[#0C0817] font-bold rounded-md text-xl hover:scale-105 transition-transform duration-200 disabled:opacity-80"
              >
                {loading ? "Saving..." : "Save"}
              </button>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}

//*******************************************Main method*******************************************
export default function ClubProfile() {
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
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentRole, setCurrentRole] = useState("club");
  const [deleteModal, setDeleteModal] = useState({ open: false, item: null, type: null });
  const [achievementsReloadFlag, setAchievementsReloadFlag] = useState(0);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser) return setCurrentUser(null);
      try {
        const res = await authedFetch("http://localhost:4000/api/users/me");
        const data = await res.json();
        if (data?.user) {
          setCurrentUser(data.user);
          setCurrentRole(data.user.role || "club");
        }
      } catch (err) {
        console.error("fetch me failed", err);
      }
    });
    return () => unsub();
  }, []);

  // followers / following
  useEffect(() => {
    if (!ready || !uid) return;
    (async () => {
      try {
        const res = await authedFetch(`http://localhost:4000/api/club/${uid}/followNums`);
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
        const res = await authedFetch("http://localhost:4000/api/club/games/all");
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
      const res = await authedFetch(`http://localhost:4000/api/club/${uid}/games`);
      const data = await res.json();
      if (data.success) setGames(data.games);
    } catch (e) {
      console.error("listGames:", e);
    }
  };

  useEffect(() => { refreshGames(); }, [uid, ready]);

  async function handleAdd() {
    if (!selectedGame) {
      setLoading(false);
      setError(" Please select a game");
      return;
    }
    setError("");
    if (loading) return;
    setLoading(true);

    await authedFetch(`http://localhost:4000/api/club/${uid}/add/games`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        gameid: selectedGame.id,

      })
    });

    await refreshGames();
    setIsModalOpen(false);
    setSelectedGame(null);
    setUsername("");
    setLoading(false);
  } 


  const availableGames = allGames.filter(
    (g) => !games.some((ug) => ug.gameid === g.id)
  );

  const [profile, setProfile] = useState(null);
  useEffect(() => {
    if (!ready || !uid) return;

    (async () => {
      try {
        const res = await authedFetch(`http://localhost:4000/api/club/${uid}/profile`);
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

  function handleDeleteAchievement(ach) { setDeleteModal({ open: true, item: ach, type: 'achievement' }); }
  function handleDeleteGame(game) { setDeleteModal({ open: true, item: game, type: 'game' }); }
  async function handleConfirmDelete() {
    if (!deleteModal.open || !deleteModal.item || !deleteModal.type) return;
    try {
      if (deleteModal.type === 'achievement') {
        await authedFetch(`http://localhost:4000/api/club/${uid}/achievements/${deleteModal.item.id}`, { method: 'DELETE' });
        setAchievementsReloadFlag(f => f + 1);
      } else if (deleteModal.type === 'game') {
        await authedFetch(`http://localhost:4000/api/club/${uid}/games/${deleteModal.item.id}`, { method: 'DELETE' });
        await refreshGames();
      }
      setDeleteModal({ open: false, item: null, type: null });
    } catch (err) {
      alert('An error occurred while deleting');
      setDeleteModal({ open: false, item: null, type: null });
    }
  }
  return (
    <div className="flex min-h-screen">
      <div className="w-[250px]">
        <LeftSidebar
          role={currentRole}
          active="profile"
          userId={currentRole === "club" ? currentUser?.id : userId}
        />
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

            <section className="relative z-10 rounded-xl pt-14 -pb-20 pr-14 pl-20 px-12 shadow-lg bg-[#1c1430] flex flex-col justify-start">
              <button
                onClick={() => router.push(`/club/addinfo/${uid}`)}
                className="absolute top-6 right-6 text-[#fff] hover:text-[#FCCC22] font-bold pt-1 pr-1 text-[20px] z-30"
              >
                <span className="inline-block transform -scale-x-100">✎</span>
              </button>


              <div className="flex relative top-0 -ml-5 items-start gap-6">
                {profile.profilePhoto ? (
                  <div className="w-44 h-44 rounded-full overflow-hidden bg-[#1C1633] border-3 border-[#5f4a87] shadow-[0_0_20px_#5f4a87,0_0_15px_rgba(95,74,135,0.5)]">
                    <Image
                      src={profile.profilePhoto}
                      alt="Profile Avatar"
                      width={176}
                      height={176}
                      className="w-full h-full object-cover rounded-full"
                    />
                  </div>
                ) : (
                  <div className="w-40 h-40 flex items-center justify-center rounded-full bg-[#1C1633] border-4 border-[#5f4a87] shadow-[0_0_20px_#5f4a87,0_0_15px_rgba(95,74,135,0.5)]">
                    <User size={80} className=" text-gray-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0 ml-3 mt-5">
                  <div className="relative top-2 min-w-0">
                    <h2 className="text-[40px] font-bold truncate">
                      {profile.clubName}
                    </h2>
                    <p className="text-[26px] text-gray-400 mt-1 truncate">
                      @{profile.username}
                    </p>
                  </div>
                </div>
              </div>

              <div className="absolute left-[55%] top-8 md:top-5 transform z-40">
                <div className="flex gap-4 bg-transparent ml-21 relative top-24 -mt-5 items-center">
                  <Link
                    href={`/club/followList/${uid}`}
                    className="cursor-pointer text-center"
                  >
                    <div className="text-4xl font-bold text-white">{followersCount}</div>
                    <div className="text-2xl text-gray-400">Followers</div>
                  </Link>

                  <Link
                    href={`/club/followList/${uid}`}
                    className="cursor-pointer text-center"
                  >
                    <div className="text-4xl font-bold text-white">{followingCount}</div>
                    <div className="text-2xl text-gray-400">Following</div>
                  </Link>
                </div>
              </div>


              <div className="mt-9 ml-2 text-white text-[25px] leading-relaxed
                w-3/4  sm:w-5/4 lg:w-2/3
                whitespace-normal break-words [overflow-wrap:anywhere]">
                {profile.bio}
              </div>

              <div className="flex flex-col items-end mt-[-95px] pb-6">
                <div className="text-white-400 text-xl text-right">
                  <div className="flex items-center gap-2">
                    <MapPin className="size-5 text-fuchsia-300 " />
                    {profile.country}
                  </div>
                </div>

                <div className="flex space-x-2 relative top-5 mt-6">
                  {profile.socials?.twitch && (
                    <a
                      href={profile.socials.twitch}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <img
                        src="/twitchIcon.svg"
                        alt="Twitch"
                        className="w-9 h-9 relative -top-1 icon-glow"
                      />
                    </a>
                  )}

                  {profile.socials?.discord && (
                    <a
                      href={profile.socials.discord}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <img
                        src="/discord.svg"
                        alt="Discord"
                        className="w-11 h-11 relative -top-2 ml-2.5 icon-glow"
                      />
                    </a>
                  )}

                  {profile.socials?.youtube && (
                    <a
                      href={profile.socials.youtube}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <img
                        src="/youtube.svg"
                        alt="YouTube"
                        className="w-[68px] h-[68px] relative -top-4 icon-glow"
                      />
                    </a>
                  )}

                  {profile.socials?.x && (
                    <a href={profile.socials.x} target="_blank" rel="noopener noreferrer">
                      <img src="/x.svg" alt="X" className="w-8 h-8 icon-glow" />
                    </a>
                  )}
                </div>
              </div>

            </section>

            {/* Add Games  */}
            <div className="p-6">
              <div className="flex relative mb-[30px] z-[50] items-center gap-3 mb-4">
                <h1 className="text-5xl font-bold text-[#fccc22]">GAMES</h1>
                {availableGames.length > 0 && (
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="text-[#ffff] font-bold text-5xl hover:text-[#6449b5]"
                  >
                    +
                  </button>
                )}
              </div>

              <div className="mt-0 grid grid-cols-3 sm:grid-cols-2 lg:grid-cols-3 gap-10 relative z-[20]">
                {games.map((g) => (
                  <div
                    key={g.id}
                    className="w-150 h-150 rounded-xl shadow-md bg-[#1d1530] border border-[#1f2430] overflow-hidden flex flex-col relative"
                  >
                    <img
                      src={g.gamePhoto}
                      alt={g.gameName}
                      className="w-full h-60 object-cover"
                    />

                    <div className="p-4 flex flex-col gap-1 text-left">
                      <div className="flex items-center justify-between">
                        {/* Game name on the left */}
                        <span className="font-bold text-white relative -top-2 text-[32px]">
                          {g.gameName}
                        </span>

                        {/* Trash icon on the right */}
                        <button
                          className="hover:text-[#fccc22] text-gray-400 text-sm"
                          onClick={() => handleDeleteGame(g)}
                          title="delete the game"
                        >                          <FaTrash />
                        </button>
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

                    <button
                      onClick={handleAdd}
                      disabled={loading}
                      className="px-9 py-1 mt-3 mx-auto block bg-[#FCCC22] text-[#0C0817] font-bold rounded-md text-xl hover:scale-105 transition-transform duration-200 disabled:opacity-80">
                      {loading ? "loading..." : "Add"}
                    </button>

                  </div>
                </div>
              )}
            </div>

            {/* Achievements section  */}
            <section className="relative z-100">
              <AddAchievement userid={uid} onDeleteAchievement={handleDeleteAchievement} reloadFlag={achievementsReloadFlag} />
            </section>

            <section className="relative z-100">
              <ScrimArenaSchedule userid={uid} userGames={games} />
            </section>

          </div>
        </div>
      </div>
      <DeleteConfirmModal
        open={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, item: null, type: null })}
        onConfirm={handleConfirmDelete}
        itemType={deleteModal.type}
      />
    </div>
  );
}