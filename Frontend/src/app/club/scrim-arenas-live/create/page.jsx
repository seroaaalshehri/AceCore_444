"use client";

const AB_URL = "http://localhost:9000"; // put exactly what your dev server prints

export default function ClubCreateLivePage() {
  // For a quick test you can also append params:
  // const params = "?channel=club_DEVTEST&uid=DEV_CLUB_UID_123&role=host";
  const src = `${AB_URL}/index.html#/create`; // or + params for testing

  return (
    <iframe
      src={src}
      style={{ border: 0, width: "100%", height: "100vh" }}
      allow="camera; microphone; clipboard-read; clipboard-write; fullscreen"
      title="Agora Create"
    />
  );
}
