
const { db } = require("../../../Firebase/firebaseBackend");
const { FieldValue } = require("firebase-admin").firestore;

/** Counter doc for sequential IDs (user1, user2, ...) */
const COUNTER_REF = db.doc("meta/userCounter");
/** Auth link map: authLinks/{authUid} -> { userId }  */
const AUTH_LINKS = db.collection("authLinks");

const lower = (s = "") => String(s).trim().toLowerCase();
const normalizeEmail = (email = "") => lower(email);
const badRequest = (msg) => { const e = new Error(msg); e.status = 400; return e; };
const conflict   = (msg) => { const e = new Error(msg); e.status = 409; return e; };
const USER_GAMES = db.collection("userGames");

/** Allocate next sequential id inside the transaction (READ then WRITE) */
async function allocateSequentialId(tx) {
  const snap = await tx.get(COUNTER_REF); // READ
  if (!snap.exists) {
    tx.set(COUNTER_REF, { next: 2 });     // WRITE #1
    return "user1";
  }
  const next = snap.get("next") || 1;
  tx.update(COUNTER_REF, { next: next + 1 }); // WRITE #1
  return `user${next}`;
}
function toGameIds(raw = []) {
  if (!Array.isArray(raw)) return [];
  const ids = raw
    .map((g) => (typeof g === "string" ? g.trim()
                 : typeof g === "object" ? String(g.gameid || g.id || "").trim()
                 : ""))
    .filter(Boolean);
  return Array.from(new Set(ids));
}

async function writeUserGames(userid, rawGames = []) {
  const gameIds = toGameIds(rawGames);
  if (gameIds.length === 0) return;
  const batch = db.batch();
  for (const gameid of gameIds) {
    const ref = USER_GAMES.doc(); 
    batch.set(ref, {
      gameid,
      rank:0,
      userid,
      username:"-"
    });
  }
  await batch.commit();
}

async function verifyCompleteService(payload = {}) {
  const rawEmail = payload.gamerEmail || payload.clubEmail || payload.email || "";
  const username = payload.username || "";
  const role     = payload.role || ""; 
  const authUid  = typeof payload.authUid === "string" ? payload.authUid.trim() : "";

  if (!rawEmail) throw badRequest("Email required.");
  if (!username) throw badRequest("Username required.");
  if (!role)     throw badRequest("Role required.");

  const normalizedEmail = normalizeEmail(rawEmail);
  const usernameLower   = lower(username);
  const usersCol        = db.collection("users");

  const userId = await db.runTransaction(async (tx) => {
    // ---------------- ALL READS FIRST ----------------
    // Email uniqueness (check legacy/new fields)
    const qNorm   = usersCol.where("normalizedEmail", "==", normalizedEmail).limit(1);
    const qEmail  = usersCol.where("email",          "==", rawEmail).limit(1);
    const qGamer  = usersCol.where("gamerEmail",     "==", rawEmail).limit(1);
    const qClub   = usersCol.where("clubEmail",      "==", rawEmail).limit(1);

    const [sNorm, sEmail, sGamer, sClub] = await Promise.all([
      tx.get(qNorm), tx.get(qEmail), tx.get(qGamer), tx.get(qClub),
    ]);
    if (!sNorm.empty || !sEmail.empty || !sGamer.empty || !sClub.empty) {
      throw conflict("Email already in use.");
    }

    // Username uniqueness
    const qUserLower = usersCol.where("username_lower", "==", usernameLower).limit(1);
    const qUserExact = usersCol.where("username",       "==", username).limit(1);
    const [sUserLower, sUserExact] = await Promise.all([
      tx.get(qUserLower), tx.get(qUserExact)
    ]);
    if (!sUserLower.empty || !sUserExact.empty) {
      throw conflict("Username already in use.");
    }

    // Auth UID uniqueness (READ ONLY here)
    if (authUid) {
      const linkSnap = await tx.get(AUTH_LINKS.doc(authUid));
      if (linkSnap.exists) throw conflict("Auth user already linked.");
    }

    // Counter read happens inside this helper (still a READ)
    const docId = await allocateSequentialId(tx); // (WRITE #1 happens inside)


    // ---------------- WRITES ONLY AFTER THIS POINT ----------------
    // User profile (WRITE #2)
    const userRef = usersCol.doc(docId);
    const nowData = {
      id: docId,
      role,
      username,
      username_lower: usernameLower,

      email: rawEmail,
      normalizedEmail,
      gamerEmail: role === "gamer" ? rawEmail : "",
      clubEmail:  role === "club"  ? rawEmail : "",

      authUid, 

      password:    payload.password || "",
      birthdate:   payload.birthdate || null,
      nationality: payload.nationality || "",
      gender:      payload.gender || "",
      clubName:    payload.clubName || "",
      country:     payload.country || "",
      socials:     payload.socials || {},

      emailVerified: !!payload.emailVerified,
      provider:      payload.provider || "password",

      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };
    tx.set(userRef, nowData, { merge: true });

    // Auth link (WRITE #3) — NO READ HERE
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
  return { id: userId };
}

/**First ver of the logic
async function createUserService(payload = {}) {
  const rawEmail = payload.gamerEmail || payload.clubEmail || payload.email || "";
  const username = payload.username || "";
  const role     = payload.role || "";
  const authUid  = typeof payload.authUid === "string" ? payload.authUid.trim() : "";

  if (!rawEmail) throw badRequest("Email required.");
  if (!username) throw badRequest("Username required.");

  const normalizedEmail = normalizeEmail(rawEmail);
  const usernameLower   = lower(username);
  const usersCol        = db.collection("users");

  const newId = await db.runTransaction(async (tx) => {
    // READS
    const qNorm   = usersCol.where("normalizedEmail", "==", normalizedEmail).limit(1);
    const qEmail  = usersCol.where("email",          "==", rawEmail).limit(1);
    const qGamer  = usersCol.where("gamerEmail",     "==", rawEmail).limit(1);
    const qClub   = usersCol.where("clubEmail",      "==", rawEmail).limit(1);

    const [sNorm, sEmail, sGamer, sClub] = await Promise.all([
      tx.get(qNorm), tx.get(qEmail), tx.get(qGamer), tx.get(qClub),
    ]);
    if (!sNorm.empty || !sEmail.empty || !sGamer.empty || !sClub.empty) {
      throw conflict("Email already in use.");
    }

    const qUserLower = usersCol.where("username_lower", "==", usernameLower).limit(1);
    const qUserExact = usersCol.where("username",       "==", username).limit(1);
    const [sUserLower, sUserExact] = await Promise.all([
      tx.get(qUserLower), tx.get(qUserExact)
    ]);
    if (!sUserLower.empty || !sUserExact.empty) throw conflict("Username already in use.");

    if (authUid) {
      const linkSnap = await tx.get(AUTH_LINKS.doc(authUid));
      if (linkSnap.exists) throw conflict("Auth user already linked.");
    }

    const docId = await allocateSequentialId(tx); // write #1 inside

    // WRITES only
    tx.set(usersCol.doc(docId), {
      id: docId,
      role: role || null,
      username,
      username_lower: usernameLower,

      email: rawEmail,
      normalizedEmail,
      gamerEmail: role === "gamer" ? rawEmail : "",
      clubEmail:  role === "club"  ? rawEmail : "",
      authUid,

      password:    payload.password || "",
      birthdate:   payload.birthdate || null,
      nationality: payload.nationality || "",
      gender:      payload.gender || "",
      games:       Array.isArray(payload.games) ? payload.games : [],

      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });

    if (authUid) {
      tx.set(AUTH_LINKS.doc(authUid), {
        userId: docId,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    return docId;
  });
 try { await writeUserGames(newId, payload.games); } catch (e) { console.error("userGames fanout failed:", e); }
  return { id: newId };
}
*/
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

module.exports = {
  verifyCompleteService,
 // createUserService,
  getAllUsersService,
  getUserService,
  getUserByAuthUidService,
  updateUserService,
  deleteUserService,
};
