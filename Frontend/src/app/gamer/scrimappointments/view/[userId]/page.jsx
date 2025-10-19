"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { authedFetch } from "../../../../../../lib/authedFetch";
import LeftSidebar, { SIDEBAR_WIDTH } from "../../../../Components/LeftSidebar";
import ScrimAppointmentCard from "../../../../Components/scrimScheduled";
import Particles from "../../../../Components/Particles";
import StatusSelect from "../../../../Components/StatusSelect";
import { getAuth, onAuthStateChanged } from "firebase/auth";

const RAW_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";
const API_BASE = String(RAW_BASE).replace(/\/+$/, "");
const PLACEHOLDER = "/defaults/game-placeholder.jpg";
const ONE_DAY = 24 * 60 * 60 * 1000;

async function readJsonOrThrow(res) {
  const ct = (res && res.headers && typeof res.headers.get === "function") ? res.headers.get("content-type") || "" : "";
  const text = await (res && res.text ? res.text() : Promise.resolve(""));
  if (ct.includes("application/json")) {
    try {
      return JSON.parse(text);
    } catch (e) {
      throw new Error(`JSON parse failed: ${e.message}. Body: ${text.slice(0, 160)}…`);
    }
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Non-JSON ${res?.status ?? "?"}. Body: ${String(text).slice(0, 160)}…`);
  }
}

function toDate(v) {
  if (!v) return null;
  if (typeof v === "object" && v !== null && typeof v._seconds === "number") {
    return new Date(v._seconds * 1000);
  }
  if (typeof v === "string") {
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  }
  if (v instanceof Date) return v;
  if (typeof v === "number") return new Date(v < 1e12 ? v * 1000 : v);
  return null;
}


function normalizeStatus(s) {
  if (!s) return null;
  const v = String(s).trim().toLowerCase();
  if (v === "on_hold") return "scheduled"; 
  if (["scheduled", "live", "ended"].includes(v)) return v;
  return null;
}

export default function GamerAppointmentsPage() {
  const { userId } = useParams();
  const [slots, setSlots] = useState([]);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");

  const [authReady, setAuthReady] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 10_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthReady(true);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!userId || !authReady) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setErr("");
      setMsg("");
      try {
        const res = await authedFetch(`${API_BASE}/api/gamer/scrims/${userId}/scrim-appointments`);
        const j = await readJsonOrThrow(res);
        if (cancelled) return;
        setSlots(Array.isArray(j.scrims) ? j.scrims : []);
      } catch (e) {
        if (!cancelled) setErr(String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId, authReady]);

  // compute status: prefer DB status (if normalized), otherwise compute by times
  function statusFromDbOrTime(slot, nowMs) {
    // prefer DB status
    const dbStatus = normalizeStatus(slot?.status);
    if (dbStatus) return dbStatus;

    // otherwise compute by schedule times
    const schedule = slot?.schedule || {};
    const start = toDate(schedule.scrimTime);
    const end = toDate(schedule.scrimEndTime);
    const startMs = start ? start.getTime() : null;
    const endMs = end ? end.getTime() : null;

    if (endMs !== null && nowMs >= endMs) return "ended";
    if (startMs !== null && nowMs >= startMs && (endMs === null || nowMs < endMs)) return "live";
    return "scheduled";
  }

  const visibleSlots = useMemo(() => {
    if (!Array.isArray(slots)) return [];
    const nowMs = now;

    return slots
      .map((s) => {
        const schedule = s.schedule || {};
        const start = toDate(schedule.scrimTime);
        const end = toDate(schedule.scrimEndTime);
        const startMs = start ? start.getTime() : null;
        const endMs = end ? end.getTime() : null;

        const computedStatus = statusFromDbOrTime(s, nowMs); // uses DB if present
        return {
          ...s,
          schedule,
          startMs,
          endMs,
          overriddenStatus: computedStatus,
        };
      })
      .filter((s) => {
        // require a schedule or at least some time to show; accept slots with only end time too
        if (!s.startMs && !s.endMs) return false;

        // visible if future, currently live, or ended within last 24h
        const notStartedYet = s.startMs !== null ? s.startMs > nowMs : false;
        const isLive = s.startMs !== null ? (s.startMs <= nowMs && (s.endMs === null || nowMs < s.endMs)) : false;
        const endedRecently = s.endMs !== null ? nowMs <= s.endMs + ONE_DAY : false;
        if (!(notStartedYet || isLive || endedRecently)) return false;

        if (!statusFilter || statusFilter === "all") return true;
        return String(s.overriddenStatus) === String(statusFilter);
      });
  }, [slots, now, statusFilter]);

  const handleStatusChange = (valOrEvent) => {
    if (!valOrEvent) return setStatusFilter("all");
    if (typeof valOrEvent === "object" && valOrEvent !== null && typeof valOrEvent.target !== "undefined") {
      return setStatusFilter(String(valOrEvent.target.value));
    }
    setStatusFilter(String(valOrEvent));
  };

  const getStatusClass = (status) => {
    if (status === "ended") return "bg-[#A1222F]/20 text-[#A1222F]";
    if (status === "live") return "bg-green-500/20 text-green-500";
    return "bg-[#FCCC22]/20 text-[#FCCC22]";
  };

  return (
    <div className="bg-[#0b0c10]" style={{ display: "flex", width: "100vw", height: "100vh" }}>
      <LeftSidebar role="gamer" active="scrimsarena" fixed userId={String(userId)} />

      <div className="relative" style={{ marginLeft: SIDEBAR_WIDTH, width: `calc(100vw - ${SIDEBAR_WIDTH}px)` }}>
        <div className="fixed inset-0 z-0">
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

        <main className="relative z-10 p-6 text-white">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-4xl font-semibold text-[#FCCC22]">My Scrim Arenas Schedule</h1>
            <div className="flex items-center gap-3">
              <span className="status-label text-xl font-semibold">Status</span>
              <StatusSelect value={statusFilter} onChange={handleStatusChange} />
            </div>
          </div>

          {err && <p className="text-red-500 mb-4">{err}</p>}
          {msg && <p className="text-red-400 mb-4">{msg}</p>}
          {loading && <p className="text-white/60 mb-4">Loading…</p>}
          {!loading && visibleSlots.length === 0 && <p className="opacity-70">No bookings yet.</p>}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {visibleSlots.map((s) => {
              const startDate = toDate(s.schedule?.scrimTime);
              const endDate = toDate(s.schedule?.scrimEndTime);

              const canJoin = !!s.isjoin && !!(s.attendeeUrl || s.schedule?.attendeeUrl) && String(s.status).toLowerCase() !== "ended";
              const rightAction = (
                <a
                  href={canJoin ? `/gamer/scrimappointments/join/${userId}/${s.scrimId}` : "#"}
                  onClick={(e) => {
                    if (!canJoin) e.preventDefault();
                  }}
                  className={`px-3 py-2 rounded font-semibold text-sm ${
                    canJoin ? "bg-[#FCCC22] text-[#0C0817]" : "bg-[#FCCC22]/30 text-[#0C0817] cursor-not-allowed opacity-60"
                  }`}
                >
                  Join
                </a>
              );

              const cover = s.schedule?.game?.gamePhoto || s.gamePhoto || PLACEHOLDER;
              const clubName = s.clubName || s.club?.clubName || s.club?.displayName || "";

              return (
                <ScrimAppointmentCard
                  key={`${s.clubId || "club"}-${s.scrimId}`}
                  id={s.scrimId}
                  title={s.title || s.schedule?.game?.gameName || s.gameName || "Scrim"}
                  cover={cover}
                  status={s.overriddenStatus}
                  scrimType={s.schedule?.scrimType}
                  start={startDate}
                  end={endDate}
                  rightAction={rightAction}
                  clubName={clubName}
                />
              );
            })}
          </div>
        </main>
      </div>
    </div>
  );
}
