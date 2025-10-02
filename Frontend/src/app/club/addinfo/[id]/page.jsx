"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { User } from "lucide-react";
import countries from "world-countries";
import { useParams, useRouter } from "next/navigation";
//import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import Particles from "../../../Components/Particles";
import LeftSidebar, { SIDEBAR_WIDTH } from "../../../Components/LeftSidebar";
import { authedFetch } from "../../../../../lib/authedFetch";


const API_BASE =process.env.NEXT_PUBLIC_API_BASE;


const FIELD_CLS =
  "w-full p-4 rounded-md bg-[#eee] text-[#1C1633] text-lg placeholder:text-lg " +
  "border border-[#3b2d5e] hover:shadow-[0_0_12px_#5f4a87] focus:outline-none " +
  "focus:ring-2 focus:ring-[#5f4a87] focus:border-[#5f4a87] focus:shadow-[0_0_12px_#5f4a87]";
const DISABLED_FIELD = "opacity-60 cursor-not-allowed";
const GOLD_BTN =
  "bg-[#FCCC22] text-[#2b2142b3] font-bold px-4 py-2 rounded text-base " +
  "disabled:opacity-60 hover:shadow-[0_0_16px_#FCCC22] transition-shadow";


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
async function readApiJson(res) {
  if (res.status === 204) return { success: true };
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return await res.json();
  const text = await res.text();
  throw new Error(
    `Non-JSON response ${res.status} ${res.statusText}: ${text.slice(0, 200)}`
  );
}

export default function ClubPage() {
  const router = useRouter();
  const { id } = useParams();
  const USER_ID = Array.isArray(id) ? id[0] : id;
  const VIEW_PROFILE_URL = `/club/profile/${USER_ID}`;

  const [form, setForm] = useState({
    clubName: "",
    username: "",
    bio: "",
    country: "",
    socials: { twitch: "", youtube: "", x: "", discord: "" },
  });
  const [originalForm, setOriginalForm] = useState(form);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [editClubName, setEditClubName] = useState(false);
  const [editUsername, setEditUsername] = useState(false);
  const [editCountry, setEditCountry] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [editSocials, setEditSocials] = useState({
    twitch: false,
    x: false,
    youtube: true,
    discord: true,
  });


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

 useEffect(() => {
  (async () => {
    try {
      const res = await authedFetch(
        `${API_BASE}/club/${encodeURIComponent(USER_ID)}/profile`,
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

    // Optional: YouTube and Discord 
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


  const sendUpdate = async (method, body, headers) => {
    const res = await authedFetch(
      `${API_BASE}/club/${encodeURIComponent(USER_ID)}/profile`,
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
      clubName: form.clubName.trim(),
      username: form.username.trim(),
      bio: form.bio || "",
      country: form.country,
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
      res = await authedFetch(`${API_BASE}/club/${encodeURIComponent(USER_ID)}/profile`, {
        method: "POST",
        body: fd,
      });
    } else {
      res = await authedFetch(`${API_BASE}/club/${encodeURIComponent(USER_ID)}/profile`, {
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
    setForm(initialFormRef.current);
    setErrors({});
    setEditClubName(false);
    setEditUsername(false);
    setEditCountry(false);
    setEditSocials({ twitch: false, x: false, youtube: true, discord: true });
  };

  const handleCancelClick = () => setShowDiscardConfirm(true);

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

      <LeftSidebar role="club" active="profile" userId={USER_ID} />

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
                <div className="flex flex-col items-center justify-center">
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

                <div className="flex mt-6 flex-col h-full">
                  <div className="space-y-5">
                    {/* club name */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
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
                        onChange={(e) => update("bio",e.target.value.slice(0,180))}
                          maxLength={180}
                      />
                    </div>

                    {/* socials */}
                    <div>
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
