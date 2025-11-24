"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import LeftSidebar, { SIDEBAR_WIDTH } from "../../../Components/LeftSidebar";
import Particles from "../../../Components/Particles";
import { authedFetch } from "../../../../../lib/authedFetch";
import ScrimAppointmentCard from "../../../Components/scrimAppointments";
import StatusSelect from "../../../Components/StatusSelect";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import {Alert} from "@heroui/react";

const RAW_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000";
const API_BASE = String(RAW_BASE).replace(/\/+$/, "");
const PLACEHOLDER = "/defaults/game-placeholder.jpg";

async function readJsonOrThrow(res) {
  const ct = res.headers.get("content-type") || "";
  const body = await res.text();
  if (ct.includes("application/json")) {
    try {
      return JSON.parse(body);
    } catch (e) {
      throw new Error(`JSON parse failed: ${e.message}. Body: ${body.slice(0, 160)}…`);
    }
  }
  throw new Error(`Non-JSON ${res.status}. Body: ${body.slice(0, 160)}…`);
}

function toDate(v) {
  if (!v) return null;
  if (v._seconds) return new Date(v._seconds * 1000);
  if (typeof v === "string") return new Date(v);
  if (v instanceof Date) return v;
  return null;
}

export default function ClubScheduledScrimsPage() {
  const { userId } = useParams();
  const [slots, setSlots] = useState([]);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);

  // UI filter state
  const [statusFilter, setStatusFilter] = useState("all");

  // Firebase auth state
  const [authReady, setAuthReady] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // Now tick (used to enable button & update ended status)
  const [now, setNow] = useState(Date.now());

  // Wait for Firebase session
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthReady(true);
    });
    return unsubscribe;
  }, []);

  // tick every 10 seconds
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 10_000);
    return () => clearInterval(id);
  }, []);

  // Fetch scrims only after auth is ready
  useEffect(() => {
    if (!userId || !authReady || !currentUser) return;

    (async () => {
      setLoading(true);
      setMsg("");
      try {
        const r = await authedFetch(`${API_BASE}/club/${userId}/schedule/scrimswithgames`);
        const j = await readJsonOrThrow(r);
        if (!j?.success) throw new Error(j?.error || "Failed to load schedule");

        const nowMs = Date.now();
        const onlyFutureScheduled = (j.slots || [])
          .sort((a, b) => toDate(a.scrimTime) - toDate(b.scrimTime));

        setSlots(onlyFutureScheduled);
      } catch (e) {
        console.error("scrimswithgames:", e);
        setMsg(e.message);
        setSlots([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [userId, authReady, currentUser]);

  // Constants
  const FIVE_MIN = 5 * 60 * 1000;
  const ONE_DAY = 24 * 60 * 60 * 1000;

  // Compute visible slots with overridden status
  const visibleAndAnnotatedSlots = useMemo(() => {
    const matchesStatusFilter = (status) =>
      statusFilter === "all" || String(status || "scheduled").toLowerCase() === statusFilter;

    return (slots || [])
      .map((s) => {
        const startDate = toDate(s.scrimTime);
        const startMs = startDate ? startDate.getTime() : null;
        const endDate = toDate(s.scrimEndTime);
        const endMs = endDate ? endDate.getTime() : null;
      

        const serverStatus = String(s.status || "").toLowerCase();
        const overriddenStatus =serverStatus || (endMs !== null && now > endMs ? "ended" : "scheduled");

        return { _original: s, startMs, endMs, overriddenStatus };
      })
      .filter((meta) => {
        if (meta.startMs == null) return false;

        const notStartedYet = meta.startMs >= now;
        const endedRecently = meta.endMs !== null && now <= (meta.endMs + ONE_DAY);

        if (!notStartedYet && !endedRecently) return false;

        return matchesStatusFilter(meta.overriddenStatus);
      });
  }, [slots, statusFilter, now]);

  
 const grid = useMemo(
    () =>
      visibleAndAnnotatedSlots.map((meta) => {
        const s = meta._original;
        const gameName = s.game?.gameName || "Scrim";
        const cover = s.game?.gamePhoto || PLACEHOLDER;
      
        const startMs = meta.startMs || 0;
        const endMs = meta.endMs ?? Infinity;
     
      const isEnded = meta.overriddenStatus === "ended";
      const canCreate =
        !isEnded && (now >= (startMs - FIVE_MIN)) && now <= endMs;

      const gameId = s.gameid || s.gameId || s.game?.id;

      let evalPath;
      switch (gameId) {
        case "ow":
          evalPath = `/club/scrimappointments/${userId}/${s.id}/eval_OW`;
          break;
        case "rl":
          evalPath = `/club/scrimappointments/${userId}/${s.id}/eval_RL`;
          break;
        case "code":
          evalPath = `/club/scrimappointments/${userId}/${s.id}/eval_CoD`;
          break;
        
      }

      let rightAction;

      if (isEnded && evalPath) {
        rightAction = (
          <a
            href={evalPath}
            className="px-3 py-2 rounded bg-[#FCCC22] text-[#0C0817] font-semibold text-sm"
          >
            Evaluate
          </a>
        );
      } else if (canCreate) {
        rightAction = (
          <a
            href={`/club/scrimappointments/createscrimarena/${userId}/${s.scrimId}`}
            className="px-3 py-2 rounded bg-[#FCCC22] text-[#0C0817] font-semibold text-sm"
          >
            Create
          </a>
        );
      } else {
        rightAction = (
          <button
            type="button"
            disabled
            aria-disabled="true"
            title={
              meta.overriddenStatus === "ended"
                ? "This scrim has ended"
                : "Create will be enabled 5 minutes before the stream starts"
            }
            className="px-3 py-2 rounded bg-[#FCCC22]/30 text-[#0C0817] font-semibold text-sm cursor-not-allowed opacity-60"
            onClick={(e) => e.preventDefault()}
          >
            Create
          </button>
        );
      }


        return (
          <ScrimAppointmentCard
            key={s.id}
            id={s.id}
            gameName={gameName}
            cover={cover}
            status={meta.overriddenStatus}
            scrimType={s.scrimType}
            maxGamers={s.maxGamers}
            inviteLink={s.inviteLink}
            start={s.scrimTime}
            end={s.scrimEndTime}
            rightAction={rightAction}
          />
        );
      }),
    [visibleAndAnnotatedSlots,userId, now]
  )

  return (
    <div className="bg-[#0b0c10]" style={{ display: "flex", width: "100vw", height: "100vh" }}>
      <LeftSidebar role="club" active="scrimsarena" fixed userId={String(userId)} clubDynamic />
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

        <div className="relative z-10 p-6 text-white">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-semibold text-4xl text-[#FCCC22]">Scheduled Scrim Arenas</h2>
           
            <div className="flex items-center gap-3">
              <span className="status-label text-xl font-semibold">Status</span>
              <StatusSelect value={statusFilter} onChange={(v) => setStatusFilter(v)} />
            </div>
          </div>




<div className="flex flex-col gap-4">
  <Alert
    variant="flat"
    title={
      <>
        <span className="font-bold text-xl text-[#A1222F]">Note</span><span className="font-bold " >:</span> You can stream to Twitch using
        <span className="font-bold "> OBS Studio</span>. When you go live, your gamer followers
        can discover your stream on <span className="font-bold">AceCore</span>.
      </>
    }
    classNames={{
      base: "inline-flex w-fit self-start whitespace-nowrap rounded-xl border border-auroraPurple/60 bg-auroraPurple/20 px-4 py-3 ]",
      icon: "text-auroraPurple",
      title: "text-white text-l ",
    }}
  />
</div>


          {msg && <div className="mb-3 text-red-400 break-all">{msg}</div>}
          {loading && <div className="mb-3 text-white/60">Loading…</div>}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 mt-7">
            {!loading && grid.length === 0 ? <div className="text-white/60">No scrims for this filter.</div> : grid}
          </div>
        </div>
      </div>
    </div>
  );
}
