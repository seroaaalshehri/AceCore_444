"use client";

import { useParams } from "next/navigation";
import { useEffect, useState, useMemo, useRef } from "react";
import LeftSidebar, { SIDEBAR_WIDTH } from "../../../../../Components/LeftSidebar";

async function jsonOrThrow(r) {
  const t = await r.text();
  try { return JSON.parse(t); } catch {
    throw new Error(`Non-JSON ${r.status}: ${t.slice(0,160)}`);
  }
}

const APPBUILDER_BASE = process.env.NEXT_PUBLIC_APPBUILDER_BASE_URL;

const RAW_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000/api"; 
const API_BASE = String(RAW_BASE).replace(/\/+$/, "");

export default function JoinLivePage() {
  const { userId, scrimId } = useParams();
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");

  const APPBUILDER_ORIGIN = useMemo(() => {
    try { return new URL(APPBUILDER_BASE).origin; } catch { return "*"; }
  }, []);

  const iframeRef = useRef(null); 


  useEffect(() => {
    if (!userId || !scrimId) return;
    let cancel = false;
    (async () => {
      try {
        const r = await fetch(`${API_BASE}/gamer/scrims/${userId}/${scrimId}/ended`, {
          credentials: "include",
        });
        const j = await jsonOrThrow(r);
        if (cancel) return;
        if (j?.ok && j.ended) {
          window.location.href = `/gamer/scrimappointments/view/${userId}`;
        }
      } catch {
      
      }
    })();
    return () => { cancel = true; };
  }, [userId, scrimId]);

  useEffect(() => {
    if (!userId || !scrimId) return;
    let cancel = false;
    (async () => {
      try {
        const r = await fetch(`${API_BASE}/gamer/scrims/${userId}/scrim-appointments/${scrimId}`, {
          credentials: "include",
        });
        const j = await jsonOrThrow(r);
        if (!cancel) setData(j.scrim || null);
      } catch (e) {
        if (!cancel) setErr(String(e));
      }
    })();
    return () => { cancel = true; };
  }, [userId, scrimId]);

  useEffect(() => {
    const onMessage = (ev) => {
      if (iframeRef.current && ev.source !== iframeRef.current.contentWindow) return;
      if (APPBUILDER_ORIGIN !== "*" && ev.origin !== APPBUILDER_ORIGIN) return;

      const msg = ev.data;
      if (!msg || typeof msg !== "object") return;

      if (msg.type === "APPBUILDER_CALL_ENDED") {
        fetch(`${API_BASE}/api/gamer/scrims/${userId}/${scrimId}/end`, {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        })
        .catch(() => {})
        .finally(() => {
          window.location.href = `/gamer/scrimappointments/view/${userId}`;
        });
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [APPBUILDER_ORIGIN, API_BASE, userId, scrimId]); 

  if (err) return <div className="p-6 text-red-500">{err}</div>;
  if (!data) return <div className="p-6 text-white/60">Loading…</div>;

  const attendeeUrl = data?.attendeeUrl;

  return (
    <div className="bg-[#0b0c10]" style={{ display: "flex", width: "100vw", height: "100vh" }}>
      <LeftSidebar role="gamer" active="scrimsarena" fixed userId={String(userId)} />
      <div
        style={{
          marginLeft: SIDEBAR_WIDTH,
          width: `calc(100vw - ${SIDEBAR_WIDTH}px)`,
          height: "100vh",
        }}
      >
        {attendeeUrl ? (
          <iframe
            ref={iframeRef} 
            title="Scrim Arena Live"
            src={attendeeUrl}
            style={{ border: "none", width: "100%", height: "100%" }}
            allow="camera; microphone; display-capture; clipboard-read; clipboard-write; fullscreen"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            No attendee link yet.
          </div>
        )}
      </div>
    </div>
  );
}
