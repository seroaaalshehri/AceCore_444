"use client";

const APPBUILDER_URL =
  process.env.NEXT_PUBLIC_APPBUILDER_BASE_URL ||
  "https://scrim-arena.vercel.app";

export default function CreateScrimArenaPage() {
  const src = `${APPBUILDER_URL}/join`;

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <iframe
        src={src}
        title="AppBuilder join"
        style={{ border: "none", width: "100%", height: "100%" }}
        allow="camera; microphone; display-capture; clipboard-read; clipboard-write"
      />
    </div>
  );
}