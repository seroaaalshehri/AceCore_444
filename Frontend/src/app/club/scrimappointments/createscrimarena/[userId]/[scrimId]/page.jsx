"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import LeftSidebar, { SIDEBAR_WIDTH } from "../../../../../Components/LeftSidebar";
const APPBUILDER_BASE = process.env.NEXT_PUBLIC_APPBUILDER_BASE_URL; 
const API_BASE        = process.env.NEXT_PUBLIC_API_BASE_URL;       

export default function CreateScrimArenaPage() {
  const { userId, scrimId } = useParams();
  const iframeRef = useRef(null);
  const [src, setSrc] = useState("");
  const [err, setErr] = useState("");

  // (prod) tighten this to the exact origin of your AppBuilder deploy
  const APPBUILDER_ORIGIN = useMemo(() => {
    try { return new URL(APPBUILDER_BASE).origin; } catch { return "*"; }
  }, []);



  // Build iframe URL to AppBuilder's /create
  useEffect(() => {
    if (!APPBUILDER_BASE || !userId || !scrimId) return;
    const u = new URL(`${APPBUILDER_BASE}/create`);
   
    u.searchParams.set("userId", String(userId));
    u.searchParams.set("scrimId", String(scrimId));
    setSrc(u.toString());
  }, [userId, scrimId]);

  // Receive passphrases from AppBuilder and persist as links to your backend
  useEffect(() => {
    const onMessage = (ev) => {
      // Must come from our iframe
      if (iframeRef.current && ev.source !== iframeRef.current.contentWindow) return;
      // (prod) origin check
      if (APPBUILDER_ORIGIN !== "*" && ev.origin !== APPBUILDER_ORIGIN) return;

      const msg = ev.data;
      if (!msg || typeof msg !== "object") return;

    
      if (msg.type === "APPBUILDER_INVITE_READY" && msg.payload) {
        const { hostPass, attendeePass, meetingName } = msg.payload || {};
        if (!hostPass || !attendeePass) return;

        // Build the joining links and channelName
        const hostUrl     = `${APPBUILDER_BASE}/${hostPass}`;
        const attendeeUrl = `${APPBUILDER_BASE}/${attendeePass}`;
        const channelName=`${hostPass}`;
        const  title =`${meetingName}`;
        // Persist (no channel field)
        fetch(`${API_BASE}/api/club/${userId}/${scrimId}/links`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ channelName,title,hostUrl, attendeeUrl }),
        }).catch(() => {  });
      }

// 2) Call ended listener to agora
    if (msg.type === "APPBUILDER_CALL_ENDED") {

  fetch(`${API_BASE}/api/club/${userId}/${scrimId}/end`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "ended" }),
  })
  .catch(() => {})  
  .finally(() => {
    window.location.href = `/club/scrimappointments/${userId}`;
  });
  return;
}
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [APPBUILDER_ORIGIN, API_BASE, APPBUILDER_BASE,userId, scrimId]);

  return (
    <div className="bg-[#0b0c10]" style={{ display: "flex", width: "100vw", height: "100vh" }}>
      <LeftSidebar role="club" active="scrimsarena" fixed userId={String(userId)} clubDynamic />
      <div
        style={{
          marginLeft: SIDEBAR_WIDTH,
          width: `calc(100vw - ${SIDEBAR_WIDTH}px)`,
          height: "100vh",
        }}
      >
        {err && <div className="p-2 text-red-400">{err}</div>}
        {src ? (
          <iframe
            ref={iframeRef}
            title="AppBuilder Create"
            src={src}
            style={{ border: "none", width: "100%", height: "100%" }}
         
            allow="camera; microphone; display-capture; clipboard-read; clipboard-write fullscreen"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            Loading creator…
          </div>
        )}
      </div>
    </div>
  );
}
