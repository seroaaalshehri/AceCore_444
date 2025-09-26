// Backend/userServices/userService.js
const admin = require("firebase-admin");
const { db } = require("../../Firebase/firebaseBackend");
const { FieldValue } = admin.firestore;

const COUNTER_REF = db.doc("meta/userCounter");

// ---------- helpers ----------
const svcError = (status, message) => {
  const e = new Error(message);
  e.status = status;
  return e;
};

const isGmailDomain = (emailLower) => {
  const parts = String(emailLower || "").trim().toLowerCase().split("@");
  return parts.length === 2 && parts[1] === "gmail.com";
};

const canonicalizeEmail = (email) => {
  if (!email) return "";
  const lower = email.trim().toLowerCase();
  if (!isGmailDomain(lower)) return lower; // keep non-gmail as-is
  const [local, domain] = lower.split("@");
  const localNoPlus = local.split("+")[0];
  const localNoDots = localNoPlus.replace(/\./g, "");
  return `${localNoDots}@${domain}`;
};

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

// ---------- create ----------
async function createUserService(payload = {}) {
  // normalize incoming shape from frontend (gamerEmail/clubEmail/email)
  const rawEmail = payload.gamerEmail || payload.clubEmail || payload.email || "";
  const username = String(payload.username || "").trim();

  if (!rawEmail) throw svcError(400, "Email required");
  if (!username) throw svcError(400, "Username required");

  const emailLower = rawEmail.toLowerCase();
  const emailCanon = canonicalizeEmail(emailLower);
  const usernameLower = username.toLowerCase();

  // Require gmail.com if you want to allow only real Gmail addresses:
  if (!isGmailDomain(emailLower)) {
    throw svcError(400, "Email must be a gmail.com address");
  }

  const usersCol = db.collection("users");
  const unameRef = db.collection("usernames").doc(usernameLower);

  let reserved = false;
  try {
    const newId = await db.runTransaction(async (tx) => {
      // 1) Email uniqueness (by canonical)
      const dupEmailSnap = await tx.get(
        usersCol.where("emailCanon", "==", emailCanon).limit(1)
      );
      if (!dupEmailSnap.empty) {
        throw svcError(409, "Email already in use");
      }

      // 2) Username uniqueness (reservation doc prevents race)
      const unameDoc = await tx.get(unameRef);
      if (unameDoc.exists) {
        throw svcError(409, "Username already in use");
      }
      tx.set(unameRef, {
        username,
        usernameLower,
        reservedAt: FieldValue.serverTimestamp(),
      });
      reserved = true;

      // 3) Allocate sequential ID
      const docId = await allocateSequentialId(tx);

      // 4) Create user profile
      const ref = usersCol.doc(docId);
      tx.set(
        ref,
        {
          id: docId,
          username,
          usernameLower,
          // store all email variants for convenience/debug
          email: emailLower,
          emailCanon,
          gamerEmail: payload.gamerEmail || "",
          clubEmail: payload.clubEmail || "",
          // other fields from your UI
          password: payload.password || "", // (if you’re also using Firebase Auth, you can omit storing plaintext)
          birthdate: payload.birthdate || null, // ISO string
          nationality: payload.nationality || "",
          gender: payload.gender || "",
          games: Array.isArray(payload.games) ? payload.games : [],
          role: payload.role || "gamer", // or "club"
          provider: payload.oauthProvider ? payload.oauthProvider : "password",
          createdAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      return docId;
    });

    return { id: newId };
  } catch (err) {
    // release username reservation if we failed before finishing
    if (reserved) {
      try { await unameRef.delete(); } catch (_) {}
    }
    if (err?.status) throw err;
    throw svcError(500, err?.message || "Internal error");
  }
}

// ---------- read/list/update/delete ----------
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
  // if username changes, you might also want to maintain the usernames reservation map (not included here)
  await db.collection("users").doc(id).set(payload, { merge: true });
  return { id };
}

async function deleteUserService(id) {
  // free username reservation if present
  try {
    const doc = await db.collection("users").doc(id).get();
    if (doc.exists) {
      const usernameLower = doc.get("usernameLower");
      if (usernameLower) {
        await db.collection("usernames").doc(usernameLower).delete();
      }
    }
  } catch (_) {}
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
