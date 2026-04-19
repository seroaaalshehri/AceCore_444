"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";

// import your sidebar
import LeftSidebar, { SIDEBAR_WIDTH } from "../../../Components/LeftSidebar";

// Where AppBuilder is hosted (Vercel)
const APPBUILDER_BASE =
  process.env.NEXT_PUBLIC_APPBUILDER_BASE_URL ||
  "https://scrim-arena.vercel.app";


export default function CreateScrimArenaPage() {
  const { id } = useParams(); // user id from URL segment

  // Build the AppBuilder URL (only /create as you asked)
  const appBuilderSrc = useMemo(() => {
    const u = new URL(`${APPBUILDER_BASE}/create`);
    // pass what you want AppBuilder to read
    u.searchParams.set("userId", String(id));
    
    return u.toString();
  }, [id]);

  return (
    <div
      style={{ display: "flex", width: "100vw", height: "100vh" }}
      className="bg-[#0b0c10]"
    >
      {/* Your sidebar (fixed) */}
      <LeftSidebar
        role="club"          // or "gamer"
        active ="scrims"// highlight the current item
        fixed={true}
        userId={String(id)}  // <-- give it the user id
        clubDynamic={true}   // use your dynamic route set
      />

      {/* Main area next to fixed sidebar */}
      <div
        style={{
          marginLeft: SIDEBAR_WIDTH, // keeps content to the right of fixed sidebar
          width: `calc(100vw - ${SIDEBAR_WIDTH}px)`,
          height: "100vh",
        }}
      >
        <iframe
          title="AppBuilder Create"
          src={appBuilderSrc}
          style={{ border: "none", width: "100%", height: "100%" }}
          // permissions AppBuilder needs
          allow="camera; microphone; display-capture; clipboard-read; clipboard-write"
        />
      </div>
    </div>
  );
}