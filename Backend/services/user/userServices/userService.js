// Backend/services/user/userServices/userService.js
const admin = require("firebase-admin");
const { db } = require("../../../Firebase/firebaseBackend");
const { FieldValue } = admin.firestore;

const COUNTER_REF = db.doc("meta/userCounter");

// helpers
const normalizeEmail = (email = "") => String(email).trim().toLowerCase();
const lower = (s = "") => String(s).trim().toLowerCase();

const badRequest = (msg) => { const e = new Error(msg); e.status = 400; return e; };
const conflict   = (msg) => { const e = new Error(msg); e.status = 409; return e; };

// allocate userN atomically from a counter doc
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

async function createUserService(payload = {}) {
  const rawEmail = payload.gamerEmail || payload.clubEmail || payload.email || "";
  const username = payload.username || "";
  const role     = payload.role || ""; // "gamer" | "club"

  if (!rawEmail) throw badRequest("Email required.");
  if (!username) throw badRequest("Username required.");

  const normalizedEmail = normalizeEmail(rawEmail);
  const usernameLower   = lower(username);
  const usersCol        = db.collection("users");

  const newId = await db.runTransaction(async (tx) => {
    // ==== ALL READS (must be before any write) ====

    // 1) Email uniqueness against new & legacy fields
    const qNorm   = usersCol.where("normalizedEmail", "==", normalizedEmail).limit(1);
    const qEmail  = usersCol.where("email",          "==", rawEmail).limit(1);       // legacy
    const qGamer  = usersCol.where("gamerEmail",     "==", rawEmail).limit(1);       // legacy
    const qClub   = usersCol.where("clubEmail",      "==", rawEmail).limit(1);       // legacy

    const [sNorm, sEmail, sGamer, sClub] = await Promise.all([
      tx.get(qNorm),
      tx.get(qEmail),
      tx.get(qGamer),
      tx.get(qClub),
    ]);

    if (!sNorm.empty || !sEmail.empty || !sGamer.empty || !sClub.empty) {
      throw conflict("Email already in use.");
    }

    // 2) Username uniqueness against new & legacy fields
    const qUserLower = usersCol.where("username_lower", "==", usernameLower).limit(1);
    const qUserExact = usersCol.where("username",       "==", username).limit(1); // for older docs

    const [sUserLower, sUserExact] = await Promise.all([
      tx.get(qUserLower),
      tx.get(qUserExact),
    ]);

    if (!sUserLower.empty || !sUserExact.empty) {
      throw conflict("Username already in use.");
    }

    // 3) Allocate sequential ID (still a READ in the counter doc)
    const docId = await allocateSequentialId(tx);

    // Safety guard: never allow slashes in IDs
    if (/[\/\\]/.test(docId)) throw badRequest("Internal ID generator produced an invalid id.");

    // ==== WRITE (after all reads) ====
    const userRef = usersCol.doc(docId);
    tx.set(
      userRef,
      {
        role: role || null,

        // canonical email fields going forward
        email: rawEmail,
        normalizedEmail,

        // keep role-specific convenience fields too
        gamerEmail: role === "gamer" ? rawEmail : "",
        clubEmail:  role === "club"  ? rawEmail : "",

        username,
        username_lower: usernameLower,

        password:   payload.password || "",
        birthdate:  payload.birthdate || null,
        nationality: payload.nationality || "",
        gender:      payload.gender || "",
        games: Array.isArray(payload.games) ? payload.games : [],

        createdAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return docId;
  });

  return { id: newId };
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

async function updateUserService(id, payload) {
  await db.collection("users").doc(id).set(payload, { merge: true });
  return { id };
}

async function deleteUserService(id) {
  await db.collection("users").doc(id).delete();
  return { id };
}

module.exports = {
  createUserService,
  getAllUsersService,
  getUserService,
  updateUserService,
  deleteUserService,
};
