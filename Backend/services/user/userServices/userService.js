
const { admin,db } = require("../../../Firebase/firebaseBackend");
const { FieldValue } = require("firebase-admin").firestore;

/** Counter doc for sequential IDs (user1, user2, ...) */
const COUNTER_REF = db.doc("meta/userCounter");
/** Auth link map: authLinks/{authUid} -> { userId }  */
const AUTH_LINKS = db.collection("authLinks");

const lower = (s = "") => String(s).trim().toLowerCase();
const normalizeEmail = (email = "") => lower(email);
const badRequest = (msg) => { const e = new Error(msg); e.status = 400; return e; };
const conflict = (msg) => { const e = new Error(msg); e.status = 409; return e; };
const USER_GAMES = db.collection("userGames");

/** Allocate next sequential id inside the transaction */
async function allocateSequentialId(tx) {
  const snap = await tx.get(COUNTER_REF);
  if (!snap.exists) {
    tx.set(COUNTER_REF, { next: 2 });
    return "user1";
  }
  const next = snap.get("next") || 1;
  tx.update(COUNTER_REF, { next: next + 1 });
  return `user${next}`;
}

//Writes Games
function toGameIds(raw = []) {
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      raw = parsed;
    } catch {
      raw = raw.split(",").map(s => s.trim()).filter(Boolean);
    }
  }
  if (!Array.isArray(raw)) {
    return [];
  }
  const ids = raw
    .map((g) =>
      typeof g === "string"
        ? g.trim()
        : typeof g === "object"
          ? String(g.gameid || g.id || "").trim()
          : ""
    )
    .filter(Boolean);
  const uniq = Array.from(new Set(ids));

  return uniq;
}

async function writeUserGames(userid, rawGames = []) {
  const gameIds = toGameIds(rawGames);
  console.log("[writeUserGames] begin", { userid, gameIds, count: gameIds.length });
  if (gameIds.length === 0) {
    return;
  }
  const batch = db.batch();
  for (const gameid of gameIds) {
    const ref = USER_GAMES.doc();
    batch.set(ref, {
      gameid,
      rank: 0,
      userid,
      username: "-" 
    });
  }
  await batch.commit();
}



async function usernameExistsByLower(usernameLower) {
  const snap = await db
    .collection("users")
    .where("username_lower", "==", String(usernameLower || "").trim())
    .limit(1)
    .get();
  return !snap.empty;
}



async function verifyCompleteService(payload = {}) {
  const rawEmail = payload.gamerEmail || payload.clubEmail || payload.email || "";
  const username = payload.username || "";
  const role = payload.role || "";
  const authUid = typeof payload.authUid === "string" ? payload.authUid.trim() : "";

  if (!rawEmail) throw badRequest("Email required.");
  if (!username) throw badRequest("Username required.");
  if (!role) throw badRequest("Role required.");

  const normalizedEmail = normalizeEmail(rawEmail);
  const usernameLower = lower(username);
  const usersCol = db.collection("users");

  const userId = await db.runTransaction(async (tx) => {
    //Read
    const qNorm = usersCol.where("normalizedEmail", "==", normalizedEmail).limit(1);
    const qEmail = usersCol.where("email", "==", rawEmail).limit(1);
    const qGamer = usersCol.where("gamerEmail", "==", rawEmail).limit(1);
    const qClub = usersCol.where("clubEmail", "==", rawEmail).limit(1);

    const [sNorm, sEmail, sGamer, sClub] = await Promise.all([
      tx.get(qNorm), tx.get(qEmail), tx.get(qGamer), tx.get(qClub),
    ]);
    if (!sNorm.empty || !sEmail.empty || !sGamer.empty || !sClub.empty) {
      throw conflict("Email already in use.");
    }

    // Username uniqueness
    const qUserLower = usersCol.where("username_lower", "==", usernameLower).limit(1);
    const qUserExact = usersCol.where("username", "==", username).limit(1);
    const [sUserLower, sUserExact] = await Promise.all([
      tx.get(qUserLower), tx.get(qUserExact)
    ]);
    if (!sUserLower.empty || !sUserExact.empty) {
      throw conflict("Username already in use.");
    }

    // Auth UID uniqueness 
    if (authUid) {
      const linkSnap = await tx.get(AUTH_LINKS.doc(authUid));
      if (linkSnap.exists) throw conflict("Auth user already linked.");
    }


    const docId = await allocateSequentialId(tx);


//Write
    // User profile 
    const userRef = usersCol.doc(docId);
    // normalize socials: accept either payload.socials or individual fields
    const socials = payload.socials || {
      twitch: String(payload.twitch || "").trim(),
      x: String(payload.x || "").trim(),
      youtube: String(payload.youtube || "").trim(),
      discord: String(payload.discord || "").trim(),
    };

    const nowData = {
      id: docId,
      role,
      username,
      username_lower: usernameLower,

      email: rawEmail,
      normalizedEmail,
      gamerEmail: role === "gamer" ? rawEmail : "",
      clubEmail: role === "club" ? rawEmail : "",

      authUid,

      password: payload.password || "",
      birthdate: payload.birthdate || null,
      nationality: payload.nationality || "",
      gender: payload.gender || "",
      clubName: payload.clubName || "",
      country: payload.country || "",
      socials,
      profilePhoto: payload.avatarUrl || "",
      emailVerified: !!payload.emailVerified,
      provider: payload.provider || "password",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };
    tx.set(userRef, nowData, { merge: true });

    // Auth link 
    if (authUid) {
      tx.set(AUTH_LINKS.doc(authUid), {
        userId: docId,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    return docId;
  });
  try { await writeUserGames(userId, payload.games); } catch (e) { console.error("userGames fanout failed:", e); }

  // ---------- NEW: create integrations/twitch doc ----------
  if (role === "club") {
    try {
      await ensureTwitchIntegrationOnSignup(userId, {
        broadcasterId: payload.broadcasterId || "",
        provider: payload.provider || "",
        email: payload.clubEmail || payload.email || ""
      });
    } catch (e) {
      console.error("ensureTwitchIntegrationOnSignup failed:", e);
    }

    // ---------- NEW: adopt pending tokens + fetch stream key, then CLEANUP tokens ----------
    try {
      await adoptPendingTwitchAndFetchKey(
        userId,
        payload.broadcasterId || "",
        payload.clubEmail || payload.email || ""
      );
    } catch (e) {
      console.error("adoptPendingTwitchAndFetchKey failed:", e);
      // non-fatal; user is created. You can attempt fetching the key later.
    }
  }
  return { id: userId };
}

async function getAllUsersService() {
  const snap = await db.collection("users").orderBy("__name__").get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

async function getUserService(id) {
  const doc = await db.collection("users").doc(id).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() };
}

async function getUserByAuthUidService(authUid) {
  if (!authUid) return null;
  const link = await AUTH_LINKS.doc(authUid).get();
  if (!link.exists) return null;
  const userId = link.get("userId");
  return await getUserService(userId);
}

async function updateUserService(id, payload) {
  await db.collection("users").doc(id).set({
    ...payload,
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });
  return { id };
}

async function deleteUserService(id) {
  const batch = db.batch();
  const snap = await AUTH_LINKS.where("userId", "==", id).get();
  snap.forEach((d) => batch.delete(AUTH_LINKS.doc(d.id)));
  batch.delete(db.collection("users").doc(id));
  await batch.commit();
  return { id };
}

//Twitch RTMP 

// Paths
const TWITCH_INTEG = (userId) =>
  db.collection("users").doc(userId).collection("integrations").doc("twitch");
const TWITCH_PENDING = (broadcasterId) =>
  db.collection("twitchPending").doc(String(broadcasterId));

/**
 * Create/update the Twitch integration doc at signup for CLUB.
 * This ensures the subcollection exists, and we record basic fields.
 * NOTE: streamKey is stored later (after we fetch it with tokens).
 */
async function ensureTwitchIntegrationOnSignup(userId, { broadcasterId = "", provider = "", email = "" } = {}) {
  const base = {
    broadcasterId: String(broadcasterId || ""),
    provider: provider || "",
    email: email || "",
    streamKey: "",          
    ingestServer: "",       
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };
  await TWITCH_INTEG(userId).set(base, { merge: true });
}

/**
 * Helix: exchange refresh token for a fresh access token.
 */
async function twitchRefresh(refreshToken) {
  const body = new URLSearchParams({
    client_id: process.env.TWITCH_CLIENT_ID,
    client_secret: process.env.TWITCH_CLIENT_SECRET,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });
  const r = await fetch("https://id.twitch.tv/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) {
    throw new Error(`Twitch refresh failed ${r.status}: ${JSON.stringify(j)}`);
  }
  return {
    accessToken: j.access_token,
    refreshToken: j.refresh_token || refreshToken,
  };
}

/**
 * Helix: get the broadcaster's stream key using a user access token.
 * Requires scope: channel:read:stream_key
 */
async function twitchGetStreamKey(accessToken, broadcasterId) {
  const r = await fetch(`https://api.twitch.tv/helix/streams/key?broadcaster_id=${encodeURIComponent(broadcasterId)}`, {
    headers: {
      "Client-Id": process.env.TWITCH_CLIENT_ID,
      "Authorization": `Bearer ${accessToken}`,
    }
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) {
    throw new Error(`Get Stream Key failed ${r.status}: ${JSON.stringify(j)}`);
  }
  const key = j?.data?.[0]?.stream_key || "";
  if (!key) throw new Error("Empty stream key from Helix");
  return key;
}

/**
 * On CLUB signup completion:
 * - read twitchPending/{broadcasterId}
 * - write tokens into users/{userId}/integrations/twitch (temporarily)
 * - fetch streamKey via Helix (refresh once if 401)
 * - store streamKey under integrations/twitch
 * - CLEANUP: remove tokens (per your conclusion) and delete twitchPending doc
 */
async function adoptPendingTwitchAndFetchKey(userId, broadcasterId, emailHint) {
  if (!broadcasterId) return;

  const pendSnap = await TWITCH_PENDING(broadcasterId).get();
  if (!pendSnap.exists) return; // No tokens pending; fine (stream key fetch will be handled elsewhere if needed)

  let { accessToken = "", refreshToken = "" } = pendSnap.data();

  // Temporarily write tokens to the integration doc (so we can fetch the key)
  const integRef = TWITCH_INTEG(userId);
  await integRef.set({
    broadcasterId: String(broadcasterId),
    accessToken,
    refreshToken,
    email: emailHint || "",
    provider: "twitch",
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });

  // Fetch stream key; refresh once on 401
  let streamKey = "";
  try {
    streamKey = await twitchGetStreamKey(accessToken, broadcasterId);
  } catch (e) {
    const msg = String(e?.message || "");
    if (msg.includes("401") && refreshToken) {
      const fresh = await twitchRefresh(refreshToken);
      accessToken  = fresh.accessToken;
      refreshToken = fresh.refreshToken;
      // persist fresh tokens (still temporary)
      await integRef.set({ accessToken, refreshToken, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
      // retry get key
      streamKey = await twitchGetStreamKey(accessToken, broadcasterId);
    } else {
      throw e;
    }
  }

  // Store the stream key under integrations/twitch
  await integRef.set({
    streamKey,
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });

  // CLEANUP (per your conclusion): remove tokens so you only keep the stream key
  await integRef.set({
    accessToken: admin.firestore.FieldValue.delete(),
    refreshToken: admin.firestore.FieldValue.delete(),
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });

  // Delete pending record
  await TWITCH_PENDING(broadcasterId).delete();
}




module.exports = {
  verifyCompleteService,
  getAllUsersService,
  getUserService,
  getUserByAuthUidService,
  updateUserService,
  deleteUserService,
  usernameExistsByLower,
 ensureTwitchIntegrationOnSignup,
  adoptPendingTwitchAndFetchKey,
};