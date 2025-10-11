"use client";
const AB_URL = "http://localhost:9000"; 
export default function GamerJoinLivePage() {
  const src = `${AB_URL}/index.html#/join`;
  return (
    <iframe
      src={src}
      style={{ border: 0, width: "100%", height: "100vh" }}
      allow="camera; microphone; clipboard-read; clipboard-write; fullscreen"
      title="Agora Join"
    />
  );
}
