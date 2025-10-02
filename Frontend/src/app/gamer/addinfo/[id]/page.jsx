"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import countries from "world-countries";
import { User } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
//import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import Particles from "../../../Components/Particles";
import LeftSidebar, { SIDEBAR_WIDTH } from "../../../Components/LeftSidebar";
import { authedFetch } from "../../../../../lib/authedFetch";

const API_BASE =process.env.NEXT_PUBLIC_API_BASE;

/** -------- styles -------- */
const FIELD_CLS =
  "w-full p-4 rounded-md bg-[#eee] text-[#1C1633] text-lg placeholder:text-lg " +
  "border border-[#3b2d5e] hover:shadow-[0_0_12px_#5f4a87] focus:outline-none " +
  "focus:ring-2 focus:ring-[#5f4a87] focus:border-[#5f4a87] focus:shadow-[0_0_12px_#5f4a87]";
const DISABLED_FIELD = "opacity-60 cursor-not-allowed";
const GOLD_BTN =
  "bg-[#FCCC22] text-[#2b2142b3] font-bold px-4 py-2 rounded text-base " +
  "disabled:opacity-60 hover:shadow-[0_0_16px_#FCCC22] transition-shadow";

/** -------- helpers  -------- */
function SocialField({ iconSrc, placeholder, value, onChange, label, error }) {
  const base =
    "w-full p-4 rounded-md bg-[#eee] text-[#1C1633] text-lg placeholder:text-lg " +
    "border border-[#3b2d5e] hover:shadow-[0_0_12px_#5f4a87] focus:outline-none " +
    "focus:ring-2 focus:ring-[#5f4a87] focus:border-[#5f4a87] focus:shadow-[0_0_12px_#5f4a87]";
  const cls =
    base +
    (error
      ? " border-red-500 focus:ring-red-400 focus:border-red-400 focus:shadow-[0_0_12px_#f87171]"
      : "");

  return (
    <div>
      {label && (
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <label className="block text-base font-semibold text-gray-300">
              {label}
            </label>
            {error && (
              <span
                className="text-red-400 text-xs whitespace-nowrap truncate max-w-[260px] md:max-w-[420px]"
                title={error}
              >
                {error}
              </span>
            )}
          </div>
          <span className="opacity-0 select-none">✎</span>
        </div>
      )}

      <div className="relative">
        <button
          type="button"
          onClick={() => {
            const v = (value || "").trim();
            if (!v) return;
            const url = /^https?:\/\//i.test(v) ? v : `https://${v}`;
            window.open(url, "_blank", "noopener,noreferrer");
          }}
          className="absolute left-3 top-1/2 -translate-y-1/2 focus:outline-none"
          aria-label={`Open ${placeholder}`}
          title={`Open ${placeholder}`}
          tabIndex={-1}
        >
          <Image src={iconSrc} alt={placeholder} width={24} height={24} />
        </button>
        <input
          type="url"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={"pl-12 " + cls}
        />
      </div>
    </div>
  );
}

const withHttps = (v) => {
  const s = (v || "").trim();
  if (!s) return "";
  return /^https?:\/\//i.test(s) ? s : `https://${s}`;
};

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


const getNationality = (c) =>
  c?.demonyms?.eng?.m || c?.demonym || c?.nationality || c?.name?.common;

const NATIONALITY_OPTIONS = countries
  .filter((c) => c.cca2 !== "IL")
  .map((c) => ({ key: c.cca2, label: getNationality(c) }))
  .filter((o) => !!o.label)
  .sort((a, b) => a.label.localeCompare(b.label));


async function readApiJson(res) {
  if (res.status === 204) return { success: true };
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return await res.json();
  const text = await res.text();
  throw new Error(
    `Non-JSON response ${res.status} ${res.statusText}: ${text.slice(0, 200)}`
  );
}

export default function AddInfoPage() {
  const router = useRouter();
  const { id } = useParams();
  const USER_ID = Array.isArray(id) ? id[0] : id;
  const VIEW_PROFILE_URL = `/gamer/profile/${USER_ID}`;

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    bio: "",
    nationality: "",
    socials: { twitch: "", youtube: "", x: "", discord: "" },
  });
  const [originalForm, setOriginalForm] = useState(form);

  const [photoPreview, setPhotoPreview] = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [isCountryEditing, setIsCountryEditing] = useState(false);

  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);

  const fileRef = useRef(null);

  const update = (path, value) => {
    if (!path.includes(".")) return setForm((p) => ({ ...p, [path]: value }));
    const [group, key] = path.split(".");
    setForm((p) => ({ ...p, [group]: { ...p[group], [key]: value } }));
  };


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
  };// this
  //Read from getProfile
useEffect(() => {
  (async () => {
    try {
      const res = await authedFetch(
        `${API_BASE}/gamer/${encodeURIComponent(USER_ID)}/profile`,
        { headers: { Accept: "application/json" } }
      );
      const data = await readApiJson(res);
      if (data?.success) {
        const d = data.profile || {};
        const next = {
          firstName: d.firstName || "",
          lastName:  d.lastName  || "",
          bio:       d.bio       || "",
          nationality: d.nationality || "",
          socials: {
            twitch:  d.socials?.twitch  || "",
            youtube: d.socials?.youtube || "",
            x:       d.socials?.x       || "",
            discord: d.socials?.discord || "",
          },
        };
        setForm(next);
        setOriginalForm(next);
        setPhotoPreview(d.profilePhoto || d.photoUrl || "");
      }
    } catch (e) {
      console.warn("[Load profile] failed:", e);
    } finally {
      setLoading(false);
    }
  })();
}, [USER_ID]);


  const validate = () => {
    const errs = {};
    if (!form.nationality.trim()) errs.nationality = "Nationality is required";
    ["twitch", "x", "youtube", "discord"].forEach((k) => {
      const v = (form.socials?.[k] || "").trim();
      if (v && !isValidSocialUrlByPlatform(k, v)) {
        errs[k] = SOCIAL_ERROR_MSG[k];
      }
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };


  const sendUpdate = async (method, body, headers) => {
    const res = await authedFetch(
      `${API_BASE}/gamer/${encodeURIComponent(USER_ID)}/profile`,
      { method, body, headers }
    );
    if (res.redirected || res.url.includes("/Signin") || res.status === 401) {
      window.location.href = `/Signin?next=${encodeURIComponent(window.location.pathname)}`;
      return { success: false };
    }
    const data = await readApiJson(res);
    if (!res.ok || !data?.success) {
      throw new Error(data?.error || `Save failed with ${res.status}`);
    }
    return data;
  };

  const doSave = async () => {
  if (!validate()) { setShowSaveConfirm(false); return; }

  const payload = {
    firstName: form.firstName || "",
    lastName:  form.lastName  || "",
    bio:       form.bio       || "",
    nationality: form.nationality || "",
    socials: {
      twitch:  withHttps(form.socials?.twitch  || ""),
      youtube: withHttps(form.socials?.youtube || ""),
      x:       withHttps(form.socials?.x       || ""),
      discord: withHttps(form.socials?.discord || ""),
    },
  };

  setSaving(true);
  try {
    let res, data;

    if (photoFile) {
      const fd = new FormData();
      fd.append("file", photoFile);
      fd.append("profile", JSON.stringify(payload));
      res = await authedFetch(`${API_BASE}/gamer/${encodeURIComponent(USER_ID)}/profile`, {
        method: "POST",
        body: fd,
      });
    } else {
      res = await authedFetch(`${API_BASE}/gamer/${encodeURIComponent(USER_ID)}/profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      });
    }

    data = await readApiJson(res);
    if (!res.ok || !data?.success) throw new Error(data?.error || `Save failed ${res.status}`);

    setOriginalForm(form);
    setIsCountryEditing(false);
    setShowSaveConfirm(false);
    router.push(VIEW_PROFILE_URL);
  } catch (err) {
    console.error("Save error:", err);
    alert(err?.message || "Failed to save profile");
  } finally {
    setSaving(false);
  }
};

  const onSubmit = (e) => {
    e.preventDefault();
    setShowSaveConfirm(true);
  };

  const onCancel = () => {
    setForm(originalForm);
    setErrors({});
    setIsCountryEditing(false);
    setPhotoFile(null);
  };

  const onPickAvatar = () => fileRef.current?.click();
  const onAvatarSelected = (e) => {
    const f = e.target.files?.[0] || null;
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      alert("Please select an image file.");
      return;
    }
    setPhotoFile(f);
    const url = URL.createObjectURL(f);
    setPhotoPreview(url);
  };

  return (
    <>
      <div className="absolute inset-2 z-0">
        <Particles
          particleColors={["#ffffff"]}
          particleCount={200}
          particleSpread={10}
          speed={0.1}
          particleBaseSize={100}
        />
      </div>

      <LeftSidebar role="gamer" active="profile" userId={USER_ID} />

      <main
        className="relative z-10 pt-8"
        style={{ marginLeft: SIDEBAR_WIDTH + 20, marginRight: 24 }}
      >
        <div className="mx-auto max-w-6xl" style={{ height: "calc(100vh - 100px)" }}>
          <div className="bg-[#2b2142b3] rounded-xl p-6 h-full">
            {loading ? (
              <p className="text-gray-300">Loading profile…</p>
            ) : (
              <form
                id="profile-form"
                onSubmit={onSubmit}
                className="h-full grid gap-8 md:grid-cols-[320px,1fr]"
              >
                {/* LEFT: avatar */}
                <div className="flex flex-col items-center justify-center">
                  <button
                    type="button"
                    onClick={onPickAvatar}
                    className="focus:outline-none"
                    title="Upload your Portfolio Picture"
                    aria-label="Upload your Portfolio Picture"
                  >
                    <div className="w-72 h-72 mx-auto rounded-full overflow-hidden bg-[#1C1633] border-4 border-[#5f4a87] shadow-[0_0_20px_#5f4a87,0_0_15px_rgba(95,74,135,0.5)] flex items-center justify-center cursor-pointer">
                      {photoPreview ? (
                        <img
                          src={photoPreview}
                          alt="preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-32 h-32 text-gray-400" />
                      )}
                    </div>
                  </button>

                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    onChange={onAvatarSelected}
                    className="hidden"
                  />

                  <span className="text-l font-bold text-gray-300 text-center mt-6">
                    Upload your Porfile Picture
                  </span>
                </div>

                <div className="flex mt-8 flex-col h-full">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-base font-semibold mb-1 text-gray-300">
                        First name
                      </label>
                      <input
                        placeholder="First name"
                        value={form.firstName}
                        onChange={(e) => update("firstName", e.target.value.slice(0, 20))}
                          maxLength={20}
                        className={FIELD_CLS}
                      />
                    </div>

                    <div>
                      <label className="block text-base font-semibold mb-1 text-gray-300">
                        Last name
                      </label>
                      <input
                        placeholder="Last name"
                        value={form.lastName}
                        onChange={(e) => update("lastName", e.target.value.slice(0,20))}
                        maxLength={20}
                        className={FIELD_CLS}
                      />
                    </div>

                    <div>
                      <label className="block text-base font-semibold mb-1 text-gray-300">
                        Bio
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Tell us about you"
                        value={form.bio}
                        onChange={(e) => update("bio", e.target.value.slice(0,180))}
                        maxLength={180}
                        className={FIELD_CLS}
                      />
                    </div>

                    <span className="block text-xl font-semibold text-gray-300 mb-2">
                      Social Media Links
                    </span>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                      <SocialField
                        iconSrc="/twitchIcon.svg"
                        label="Twitch"
                        placeholder="Twitch Link"
                        value={form.socials.twitch}
                        onChange={(v) => update("socials.twitch", v)}
                        error={errors.twitch}
                      />
                      <SocialField
                        iconSrc="/youtube.svg"
                        label="YouTube"
                        placeholder="YouTube Link"
                        value={form.socials.youtube}
                        onChange={(v) => update("socials.youtube", v)}
                        error={errors.youtube}
                      />
                      <SocialField
                        iconSrc="/x.svg"
                        label="X"
                        placeholder="X Link"
                        value={form.socials.x}
                        onChange={(v) => update("socials.x", v)}
                        error={errors.x}
                      />
                      <SocialField
                        iconSrc="/discord.svg"
                        label="Discord"
                        placeholder="Discord Link"
                        value={form.socials.discord}
                        onChange={(v) => update("socials.discord", v)}
                        error={errors.discord}
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <label className="block text-base font-semibold text-gray-300">
                            Nationality
                          </label>
                          {errors.nationality && (
                            <span className="text-red-400 text-xs">
                              Nationality is required
                            </span>
                          )}
                        </div>
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={() => setIsCountryEditing(true)}
                          className="cursor-pointer text-gray-300 hover:text-[#FCCC22] focus:text-[#FCCC22]"
                          title="Edit nationality"
                          aria-label="Edit nationality"
                        >
                          ✎
                        </span>
                      </div>
                      <select
                        value={form.nationality}
                        onChange={(e) => update("nationality", e.target.value)}
                        disabled={!isCountryEditing}
                        className={`${FIELD_CLS} ${!isCountryEditing ? DISABLED_FIELD : ""}`}
                      >
                        <option value="">Select nationality</option>
                        {NATIONALITY_OPTIONS.map((o) => (
                          <option key={o.key} value={o.label}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setShowDiscardConfirm(true)}
                      className={GOLD_BTN}
                    >
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

      {/* Cancel Confirmation */}
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

      {/* Save Confirmation */}
      {showSaveConfirm && (
        <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 z-50">
          <div className="bg-[#1C1633] text-white p-6 rounded-xl shadow-2xl w-[350px] text-center">
            <p className="text-lg font-bold mb-4">Are you sure you want to save your changes?</p>
            <div className="flex w-full space-x-2">
              <button
                onClick={async () => {
                  await doSave();
                }}
                className="w-1/2 bg-[#4682B4] hover:neon-btn-blue px-3 py-1 rounded text-sm"
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
