// Backend/utils/username.js
export const normalizeUsername = (u) => String(u || "").trim().toLowerCase();

const RESERVED = new Set([
  "admin","root","support","api","system","help","staff","moderator"
]);

export const isReserved = (u) => RESERVED.has(normalizeUsername(u));
