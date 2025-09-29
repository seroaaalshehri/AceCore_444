"use client";

import { useEffect, useRef, useState } from "react";
import { User } from "lucide-react";
import countries from "world-countries";

/* ✅ Same testing path as Gamer: client → Firestore/Storage */
import { db, storage } from "../../../../lib/firebaseClient";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

import Particles from "../../Components/Particles";
import LeftSidebar, { SIDEBAR_WIDTH } from "../../Components/LeftSidebar";
import { useRouter } from "next/navigation";

/** -------- CONFIG -------- */
const USER_ID = "user123";
const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE?.replace(/\/+$/, "") || "http://localhost:4000";
const VIEW_PROFILE_URL = `/club/${USER_ID}`;

/** -------- styles -------- */
/* SIZE-ONLY: match Gamer AdInfo (bigger field padding, font, placeholder) */
const FIELD_CLS =
  "w-full p-4 rounded-md bg-[#eee] text-[#1C1633] text-lg placeholder:text-lg " +
  "border border-[#3b2d5e] hover:shadow-[0_0_12px_#5f4a87] focus:outline-none " +
  "focus:ring-2 focus:ring-[#5f4a87] focus:border-[#5f4a87] focus:shadow-[0_0_12px_#5f4a87]";
const DISABLED_FIELD = "opacity-60 cursor-not-allowed";
/* SIZE-ONLY: slightly larger buttons */
const GOLD_BTN =
  "bg-[#FCCC22] text-[#2b2142b3] font-bold px-4 py-2 rounded text-base " +
  "disabled:opacity-60 hover:shadow-[0_0_16px_#FCCC22] transition-shadow";

const deepClone = (obj) => JSON.parse(JSON.stringify(obj));

/* helpers */
const withHttps = (v) => {
  const s = (v || "").trim();
  if (!s) return "";
  return /^https?:\/\//i.test(s) ? s : `https://${s}`;
};

// --- Social URL rules ---
const SOCIAL_PATTERNS = {
  twitch: [/^https?:\/\/(www\.)?twitch\.tv\/[A-Za-z0-9_]+\/?$/i],
  x: [/^https?:\/\/(www\.)?(x\.com|twitter\.com)\/[A-Za-z0-9_]{1,15}(\/.*)?$/i],
  youtube: [
    /^https?:\/\/(www\.)?youtube\.com\/(watch\?v=|shorts\/|channel\/|c\/|user\/|@)[\w\-]+/i,
    /^https?:\/\/youtu\.be\/[\w\-]+/i,
  ],
  discord: [
    /^https?:\/\/(www\.)?discord\.gg\/[A-Za-z0-9-]+\/?$/i,
    /^https?:\/\/(www\.)?discord\.com\/invite\/[A-Za-z0-9-]+\/?$/i,
  ],
};

const SOCIAL_ERROR_MSG = {
  twitch: "Invalid Twitch link. Ex: https://twitch.tv/yourname",
  x: "Invalid X link. Ex: https://x.com/yourhandle",
  youtube: "Invalid YouTube link. Ex: youtube.com/@name",
  discord: "Invalid Discord invite. Ex: discord.gg/abc123",
};

const isValidSocialUrlByPlatform = (platform, url) => {
  const v = (url || "").trim();
  if (!v) return false;
  const rules = SOCIAL_PATTERNS[platform] || [];
  const candidate = withHttps(v);
  return rules.some((re) => re.test(candidate));
};

/* SIZE-ONLY SocialField to match Gamer */
function SocialField({ iconSrc, placeholder, value, onChange, disabled, error }) {
  const cls =
    `${FIELD_CLS} ${disabled ? DISABLED_FIELD : ""}` +
    (error
      ? " border-red-500 focus:ring-red-400 focus:border-red-400 focus:shadow-[0_0_12px_#f87171]"
      : "");
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          const v = withHttps(value);
          if (!v) return;
          window.open(v, "_blank", "noopener,noreferrer");
        }}
        className="absolute left-3 top-1/2 -translate-y-1/2 focus:outline-none"
        aria-label={`Open ${placeholder || "link"}`}
        title={`Open ${placeholder || "link"}`}
        tabIndex={-1}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={iconSrc} alt="icon" width={24} height={24} />
      </button>
      <input
        type="url"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`pl-12 ${cls}`}
      />
    </div>
  );
}

export default function ClubPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    clubName: "",
    username: "",
    bio: "",
    country: "",
    socials: { twitch: "", youtube: "", x: "", discord: "" },
  });

  const [photoPreview, setPhotoPreview] = useState("");
  const initialFormRef = useRef(deepClone(form));

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  /* edit toggles (pen-only editing) */
  const [editClubName, setEditClubName] = useState(false);
  const [editUsername, setEditUsername] = useState(false);
  const [editCountry, setEditCountry] = useState(false);

  // Pens only for Twitch & X; YouTube/Discord are editable without a pen
  const [editSocials, setEditSocials] = useState({
    twitch: false,
    x: false,
    youtube: true,
    discord: true,
  });

  // sidebar/search UI state
  const [leftTab, setLeftTab] = useState("home");
  const [q, setQ] = useState("");

  // modals
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);

  // logo picker (pen-only trigger)
  const logoFileRef = useRef(null);
  const [logoFile, setLogoFile] = useState(null);
  const onPickLogo = () => logoFileRef.current?.click();
  const onLogoSelected = (e) => {
    const f = e.target.files?.[0] || null;
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      alert("Please select an image file.");
      return;
    }
    setLogoFile(f);
    const url = URL.createObjectURL(f);
    setPhotoPreview(url); // preview only
  };

  const update = (path, value) => {
    if (!path.includes(".")) return setForm((p) => ({ ...p, [path]: value }));
    const [group, key] = path.split(".");
    setForm((p) => ({ ...p, [group]: { ...p[group], [key]: value } }));
  };

  /** LOAD — Firestore */
  useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(doc(db, "users", USER_ID));
        const d = snap.exists() ? snap.data() : {};
        const loaded = {
          clubName: d.clubName || d.firstName || "",
          username: d.username || "",
          bio: d.bio || "",
          country: d.country || d.nationality || "",
          socials: {
            twitch: d.socials?.twitch || "",
            youtube: d.socials?.youtube || "",
            x: d.socials?.x || "",
            discord: d.socials?.discord || "",
          },
        };
        setForm(loaded);
        initialFormRef.current = deepClone(loaded);
        if (d.photoUrl || d.profilePhoto) setPhotoPreview(d.photoUrl || d.profilePhoto);
      } catch (e) {
        console.warn("[Club] Load profile failed:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /** Required-field validation (incl. URLs + logo) */
  const validate = () => {
    const errs = {};

    if (!form.clubName.trim()) errs.clubName = "This field is required";
    if (!form.username.trim()) errs.username = "This field is required";
    if (!form.country.trim()) errs.country = "This field is required";

    // Required: Twitch and X
    ["twitch", "x"].forEach((k) => {
      const v = (form.socials?.[k] || "").trim();
      if (!v) {
        errs[k] = "This field is required";
      } else if (!isValidSocialUrlByPlatform(k, v)) {
        errs[k] = SOCIAL_ERROR_MSG[k];
      }
    });

    // Optional: YouTube and Discord — validate only if provided
    ["youtube", "discord"].forEach((k) => {
      const v = (form.socials?.[k] || "").trim();
      if (v && !isValidSocialUrlByPlatform(k, v)) {
        errs[k] = SOCIAL_ERROR_MSG[k];
      }
    });

    if (!logoFile && !photoPreview) {
      errs.profilePhoto = "This field is required";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  /** Core save (used by Save modal's Yes) */
  const doSave = async () => {
    if (!validate()) {
      setShowSaveConfirm(false);
      return;
    }

    const payload = {
      clubName: form.clubName.trim(),
      username: form.username.trim(),
      bio: form.bio || "",
      country: form.country,
      socials: {
        twitch: withHttps(form.socials.twitch),
        youtube: withHttps(form.socials.youtube),
        x: withHttps(form.socials.x),
        discord: withHttps(form.socials.discord),
      },
    };

    if (logoFile) {
      const ext = (logoFile.name.split(".").pop() || "jpg").toLowerCase();
      const path = `profileImages/${USER_ID}.${ext}`;
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, logoFile);
      const url = await getDownloadURL(storageRef);
      payload.profilePhoto = url;
      setPhotoPreview(url);
    }

    setSaving(true);
    try {
      await setDoc(doc(db, "users", USER_ID), payload, { merge: true });
      initialFormRef.current = deepClone(form);
      setShowSaveConfirm(false);
      router.push(VIEW_PROFILE_URL);
    } catch (err) {
      console.error("[Club] Save error:", err);
      alert(err?.message || "Failed to save club profile");
    } finally {
      setSaving(false);
    }
  };

  const onSubmit = (e) => {
    e.preventDefault();
    setShowSaveConfirm(true);
  };

  const onCancel = () => {
    setForm(deepClone(initialFormRef.current));
    setErrors({});
    setEditClubName(false);
    setEditUsername(false);
    setEditCountry(false);
    setEditSocials({ twitch: false, x: false, youtube: true, discord: true });
  };

  const handleCancelClick = () => setShowDiscardConfirm(true);

  return (
    <>
      {/* bg */}
      <div className="absolute inset-2 z-0">
        <Particles
          particleColors={["#ffffff"]}
          particleCount={200}
          particleSpread={10}
          speed={0.1}
          particleBaseSize={100}
        />
      </div>

      {/* LEFT: Sidebar */}
      <LeftSidebar active={leftTab} onChange={setLeftTab} />

      {/* RIGHT: Editable card area */}
      <main
        className="relative z-10 pt-8"
        style={{ marginLeft: SIDEBAR_WIDTH + 20, marginRight: 24 }}
      >
        <div className="mx-auto max-w-6xl" style={{ height: "calc(100vh - 100px)" }}>
          <div className="bg-[#2b2142b3] rounded-xl p-8 h-full">
            {loading ? (
              <p className="text-gray-300">Loading club profile…</p>
            ) : (
              <form onSubmit={onSubmit} className="h-full grid gap-6 md:grid-cols-[320px,1fr]">
                {/* LEFT: logo column */}
                <div className="flex flex-col items-center justify-center">
                  {/* SIZE-ONLY: larger avatar to match Gamer */}
                  <div className="w-72 h-72 mx-auto rounded-full overflow-hidden bg-[#1C1633] border-4 border-[#5f4a87] shadow-[0_0_20px_#5f4a87,0_0_15px_rgba(95,74,135,0.6)] flex items-center justify-center">
                    {photoPreview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={photoPreview} alt="logo" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-32 h-32 text-gray-400" />
                    )}
                  </div>

                  <input
                    ref={logoFileRef}
                    type="file"
                    accept="image/*"
                    onChange={onLogoSelected}
                    className="hidden"
                  />

                  <div className="mt-4 flex items-center gap-3 flex-wrap">
                    <span className="text-l mt-3 font-bold text-gray-300">Upload Your Club Logo</span>
                    {errors.profilePhoto && (
                      <span className="text-red-400 text-l">This field is required</span>
                    )}
                    <button
                      type="button"
                      onClick={onPickLogo}
                      className="text-gray-300 mt-3 hover:text-[#FCCC22] focus:text-[#FCCC22] text-sm"
                      title="Edit logo"
                      aria-label="Edit logo"
                    >
                      ✎
                    </button>
                  </div>
                </div>

                {/* RIGHT: fields column */}
                <div className="flex mt-6 flex-col h-full">
                  <div className="space-y-5">
                    {/* club name */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          {/* SIZE-ONLY: bigger, bold label */}
                          <label className="block text-base font-semibold text-gray-300">Club name</label>
                          {errors.clubName && (
                            <span className="text-red-400 text-xs">This field is required</span>
                          )}
                        </div>
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={() => setEditClubName(true)}
                          className="cursor-pointer text-gray-300 hover:text-[#FCCC22] focus:text-[#FCCC22]"
                          title="Edit club name"
                          aria-label="Edit club name"
                        >
                          ✎
                        </span>
                      </div>
                      <input
                        placeholder="Club name"
                        value={form.clubName}
                        onChange={(e) => update("clubName", e.target.value)}
                        disabled={!editClubName}
                        className={`${FIELD_CLS} ${!editClubName ? DISABLED_FIELD : ""}`}
                      />
                    </div>

                    {/* username */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <label className="block text-base font-semibold text-gray-300">Username</label>
                          {errors.username && (
                            <span className="text-red-400 text-xs">This field is required</span>
                          )}
                        </div>
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={() => setEditUsername(true)}
                          className="cursor-pointer text-gray-300 hover:text-[#FCCC22] focus:text-[#FCCC22]"
                          title="Edit username"
                          aria-label="Edit username"
                        >
                          ✎
                        </span>
                      </div>
                      <input
                        placeholder="Unique username"
                        value={form.username}
                        onChange={(e) => update("username", e.target.value)}
                        disabled={!editUsername}
                        className={`${FIELD_CLS} ${!editUsername ? DISABLED_FIELD : ""}`}
                      />
                    </div>

                    {/* about the club */}
                    <div>
                      <label className="block text-base font-semibold mb-1 text-gray-300">About the club</label>
                      <textarea
                        rows={3}
                        placeholder="Tell gamers about your club"
                        className={FIELD_CLS}
                        value={form.bio}
                        onChange={(e) => update("bio", e.target.value)}
                      />
                    </div>

                    {/* socials */}
                    <div>
                      {/* SIZE-ONLY: section heading bigger/bolder */}
                      <span className="block text-xl font-semibold text-gray-300 mb-2">
                        Social Media Links
                      </span>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Twitch */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <label className="block text-base font-semibold text-gray-300">Twitch</label>
                              {errors.twitch && (
                                <span className="text-red-400 text-xs">{errors.twitch}</span>
                              )}
                            </div>
                            <span
                              role="button"
                              tabIndex={0}
                              onClick={() => setEditSocials((p) => ({ ...p, twitch: true }))}
                              className="cursor-pointer text-gray-300 hover:text-[#FCCC22] focus:text-[#FCCC22]"
                              title="Edit Twitch"
                              aria-label="Edit Twitch"
                            >
                              ✎
                            </span>
                          </div>
                          <SocialField
                            iconSrc="/twitchIcon.svg"
                            placeholder="Twitch link"
                            value={form.socials.twitch}
                            onChange={(v) => update("socials.twitch", v)}
                            disabled={!editSocials.twitch}
                            error={errors.twitch}
                          />
                        </div>

                        {/* X */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <label className="block text-base font-semibold text-gray-300">X (Twitter)</label>
                              {errors.x && (
                                <span className="text-red-400 text-xs">{errors.x}</span>
                              )}
                            </div>
                            <span
                              role="button"
                              tabIndex={0}
                              onClick={() => setEditSocials((p) => ({ ...p, x: true }))}
                              className="cursor-pointer text-gray-300 hover:text-[#FCCC22] focus:text-[#FCCC22]"
                              title="Edit X"
                              aria-label="Edit X"
                            >
                              ✎
                            </span>
                          </div>
                          <SocialField
                            iconSrc="/x.svg"
                            placeholder="X link"
                            value={form.socials.x}
                            onChange={(v) => update("socials.x", v)}
                            disabled={!editSocials.x}
                            error={errors.x}
                          />
                        </div>

                        {/* YouTube */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <label className="block text-base font-semibold text-gray-300">YouTube</label>
                              {errors.youtube && (
                                <span className="text-red-400 text-xs">{errors.youtube}</span>
                              )}
                            </div>
                            <span className="opacity-0 select-none">✎</span>
                          </div>
                          <SocialField
                            iconSrc="/youtube.svg"
                            placeholder="YouTube link"
                            value={form.socials.youtube}
                            onChange={(v) => update("socials.youtube", v)}
                            disabled={!editSocials.youtube}
                            error={errors.youtube}
                          />
                        </div>

                        {/* Discord */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <label className="block text-base font-semibold text-gray-300">Discord</label>
                              {errors.discord && (
                                <span className="text-red-400 text-xs">{errors.discord}</span>
                              )}
                            </div>
                            <span className="opacity-0 select-none">✎</span>
                          </div>
                          <SocialField
                            iconSrc="/discord.svg"
                            placeholder="Discord link"
                            value={form.socials.discord}
                            onChange={(v) => update("socials.discord", v)}
                            disabled={!editSocials.discord}
                            error={errors.discord}
                          />
                        </div>
                      </div>
                    </div>

                    {/* country */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <label className="block text-base font-semibold text-gray-300">Country</label>
                          {errors.country && (
                            <span className="text-red-400 text-xs">This field is required</span>
                          )}
                        </div>
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={() => setEditCountry(true)}
                          className="cursor-pointer text-gray-300 hover:text-[#FCCC22] focus:text-[#FCCC22]"
                          title="Edit country"
                          aria-label="Edit country"
                        >
                          ✎
                        </span>
                      </div>
                      <select
                        value={form.country}
                        onChange={(e) => update("country", e.target.value)}
                        disabled={!editCountry}
                        className={`${FIELD_CLS} ${!editCountry ? DISABLED_FIELD : ""}`}
                      >
                        <option value="">Select country</option>
                        {countries
                          .filter((c) => c.cca2 !== "IL")
                          .sort((a, b) => a.name.common.localeCompare(b.name.common))
                          .map((c) => (
                            <option key={c.cca2} value={c.name.common}>
                              {c.name.common}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>

                  {/* actions pinned inside the card */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button type="button" onClick={handleCancelClick} className={GOLD_BTN}>
                      Cancel
                    </button>
                    <div className="flex-1" />
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => setShowSaveConfirm(true)}
                      className={GOLD_BTN}
                    >
                      {saving ? "Saving…" : "Save"}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>

      {/* Cancel Confirmation (Yes/No) */}
      {showDiscardConfirm && (
        <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 z-50">
          <div className="bg-[#1C1633] text-white p-6 rounded-xl shadow-2xl w-[350px] text-center">
            <p className="text-lg font-bold mb-4">Are you sure you want to cancel?</p>
            <div className="flex w-full space-x-2">
              <button
                onClick={() => {
                  onCancel();
                  setShowDiscardConfirm(false);
                  router.push(VIEW_PROFILE_URL);
                }}
                className="w-1/2 bg-red-500 hover:neon-btn-red px-4 py-2 rounded text-sm"
              >
                Yes
              </button>
              <button
                onClick={() => setShowDiscardConfirm(false)}
                className="w-1/2 bg-gray-500 hover:neon-btn-gray px-4 py-2 rounded text-sm"
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save Confirmation (Yes/No) */}
      {showSaveConfirm && (
        <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 z-50">
          <div className="bg-[#1C1633] text-white p-6 rounded-xl shadow-2xl w-[350px] text-center">
            <p className="text-lg font-bold mb-4">Are you sure you want to save your changes?</p>
            <div className="flex w-full space-x-2">
              <button
                onClick={async () => {
                  await doSave();
                }}
                className="w-1/2 bg-[#4682B4] hover:neon-btn-blue px-4 py-2 rounded text-sm"
                disabled={saving}
              >
                Yes
              </button>
              <button
                onClick={() => setShowSaveConfirm(false)}
                className="w-1/2 bg-gray-500 hover:neon-btn-gray px-4 py-2 rounded text-sm"
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
