const fs = require("fs");
const { db ,admin } = require("../../Firebase/firebaseBackend");
const { v4: uuidv4 } = require("uuid");
const { FieldValue } = require("firebase-admin").firestore;
const { Timestamp,FieldPath } = admin.firestore;




async function uploadToFirebaseStorage(userId, fileInput) {


  const safeName = `${Date.now()}-${fileInput.originalname.replace(/\s+/g, "_")}`;
  const objectPath = `profileImages/${userId}/${safeName}`;
  const gcsFile = bucket.file(objectPath);
  const token = uuidv4();

  await gcsFile.save(fileInput.buffer, {
    metadata: {
      contentType: fileInput.mimetype,
      metadata: { firebaseStorageDownloadTokens: token },
    },
    resumable: false,
  });

  const url = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(objectPath)}?alt=media&token=${token}`;
  return { url, objectPath };
}

async function updateUserProfileService(userid, fields, { fileInput } = {}) {
  const ref = db.collection("users").doc(userid);

  const updates = {
  clubName: fields.clubName,
  username: fields.username,
  bio: fields.bio,
  country: fields.country,
  socials: fields.socials,
  username_lower: fields.username ? fields.username.toLowerCase() : "",
  updatedAt: admin.firestore.FieldValue.serverTimestamp(),
};
if (fields.profilePhoto) {
    updates.profilePhoto = fields.profilePhoto;
  }


  await ref.set(updates, { merge: true });
  return (await ref.get()).data();
}

async function addUserAchievement(userid, name, association, game, date, reqFile, baseUrl) {
  let fileUrl = null;
  let storagePath = null;

  if (reqFile) {
    storagePath = reqFile.path;
    fileUrl = `${baseUrl}/storage/achievements/${reqFile.filename}`;
  }

  const newAch = {
    name,
    association,
    game,
    date,
    file: fileUrl,
    storagePath,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  const docRef = await db
    .collection("users")
    .doc(userid)
    .collection("achievements")
    .add(newAch);

  return { id: docRef.id, ...newAch };
}


async function getUserAchievements(userid) {
  const snapshot = await db
    .collection("users")
    .doc(userid)
    .collection("achievements")
    .orderBy("createdAt", "desc")
    .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}

async function getUserById(userid) {
  const snap = await db.collection("users").doc(userid).get();
  if (!snap.exists) return null;
  return snap.data();
}

async function getFollowNum(userId) {
  const followersSnap = await db.collection("users").doc(userId).collection("followers").get();
  const followingSnap = await db.collection("users").doc(userId).collection("following").get();

  return {
    followersCount: followersSnap.size,
    followingCount: followingSnap.size,
  };
}

async function addUserGame( gameid,userid) {

  const ref = await db.collection("userGames").add({
    gameid,
    userid,
  
  });
  return { id: ref.id };
}



async function getUserGames(userid) {
  const userId=userid;
  

  const snap = await db.collection("userGames").where("userid", "==", userId).get();
  const results = [];


  for (const doc of snap.docs) {
    const ug = doc.data();

  
    const gameDoc = await db.collection("games").doc(ug.gameid).get();
    const game = gameDoc.exists ? gameDoc.data() : {};

    results.push({
      id: doc.id,           
      ...ug,            
      gameName: game.gameName,
      gamePhoto: game.gamePhoto
    });
  }
  return results;
}

async function getGames() {
  const snapshot = await db.collection("games").get();
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));
}





async function addUserScrim(userid, { gameid, scrimTime, scrimEndTime, maxGamers, scrimType, maxAcceptance }) {
  const ts = Timestamp.fromDate(new Date(scrimTime));
  const endts = Timestamp.fromDate(new Date(scrimEndTime));
  const doc = { gameid, scrimTime: ts, scrimEndTime: endts, maxGamers, scrimType, maxAcceptance, createdAt: Timestamp.now() };
  const ref = await db.collection("users").doc(userid).collection("schedule").add(doc);
  return { id: ref.id, ...doc };
}

async function getUserScrims(userid, { gameid, from, to }) {
  let q = db.collection("users").doc(userid).collection("schedule").orderBy("scrimTime", "asc");
  if (gameid) q = q.where("gameid", "==", gameid);
  if (from) q = q.where("scrimTime", ">=", Timestamp.fromDate(new Date(from)));
  if (to) q = q.where("scrimTime", "<=", Timestamp.fromDate(new Date(to)));
  const snap = await q.get();
  const slots = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  return { slots };
}


const chunk = (arr, n=10) => Array.from({length: Math.ceil(arr.length/n)}, (_,i)=>arr.slice(i*n, (i+1)*n));

async function getUserScrimsWithGame(userid, { gameid, from, to }) {
  let q = db.collection("users").doc(userid).collection("schedule").orderBy("scrimTime", "asc");
  if (gameid) q = q.where("gameid", "==", gameid);
  if (from)  q = q.where("scrimTime", ">=", Timestamp.fromDate(new Date(from)));
  if (to)    q = q.where("scrimTime", "<=", Timestamp.fromDate(new Date(to)));

  const snap  = await q.get();
  const slots = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  if (slots.length === 0) return { slots: [] };


  const gids = [...new Set(slots.map(s => s.gameid).filter(Boolean))];
  const gameById = new Map();
  for (const ids of chunk(gids, 10)) {
    const gs = await db.collection("games")
      .where(FieldPath.documentId(), "in", ids)
      .get();
    gs.forEach(doc => gameById.set(doc.id, { id: doc.id, ...doc.data() }));
  }

 
  const scrimIds = [...new Set(slots.map(s => s.scrimId).filter(Boolean))];
  const arenaById = new Map(); 
  for (const ids of chunk(scrimIds, 10)) {
    const as = await db.collection("users").doc(userid)
      .collection("scrimArena")
      .where(FieldPath.documentId(), "in", ids)
      .get();
    as.forEach(doc => {
      const data = doc.data() || {};
      arenaById.set(doc.id, { status: data.status || "" });
    });
  }


  const enriched = slots.map(s => {
    const g = gameById.get(s.gameid) || null;
    const arena = s.scrimId ? (arenaById.get(s.scrimId) || null) : null;
    const arenaStatus = (arena && arena.status) ? String(arena.status) : "";

    return {
      ...s,
      game: g ? {
        id: g.id,
        gameName: g.gameName || g.name || "",
        gamePhoto: g.scrimPhoto || g.gamePhoto || g.cover || "",
      } : null,
      status: arenaStatus || s.status || "scheduled",
    };
  });

  return { slots: enriched };
}


async function initScrimArenaForSchedule(userid, scheduleId) {
  // Create a scrimArena doc with an auto id
  const scrimRef = db.collection("users").doc(userid).collection("scrimArena").doc();
  const scrimId = scrimRef.id;

  const base = {
    scheduleId,
    status: "scheduled",
    channelName:"",
    simulcast: { active: false },
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  await scrimRef.set(base);

  // back-link from schedule to scrim
  const scheduleRef = db.collection("users").doc(userid).collection("schedule").doc(scheduleId);
  await scheduleRef.set({ scrimId, updatedAt: FieldValue.serverTimestamp() }, { merge: true });

  return { scrimId, ...base };
}

async function getUserArenas(userid, { status } = {}) {
  let q = db.collection("users").doc(userid).collection("scrimArena").orderBy("createdAt", "desc");
  if (status && ["scheduled", "ended"].includes(status)) {
    q = q.where("status", "==", status);
  }
  const snap = await q.get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}


const scheduleCol = (clubId) =>
  db.collection("users").doc(clubId).collection("schedule");


async function listRequestsForSlotService({ clubId, slotId, status }) {
  const slotRef = scheduleCol(clubId).doc(slotId);
  let q = slotRef.collection("gamerRequest");
  if (status) q = q.where("status", "==", status);
  q = q.orderBy("createdAt", "desc");

  const snap = await q.get();
  if (snap.empty) return [];

  const results = await Promise.all(
    snap.docs.map(async (d) => {
      const data = d.data() || {};

      let userData = {};
      if (data.userid) {
        const userSnap = await db.collection("users").doc(String(data.userid)).get();
        if (userSnap.exists) {
          const u = userSnap.data() || {};
          userData = {
            username: u.username || "",
            firstName: u.firstName,
            lastName: u.lastName,
            profilePhoto: u.profilePhoto || "",
          };
        }
      }

      return {
        id: d.id,
        userid: data.userid || "",
        firstName: userData.firstName,
        lastName: userData.lastName,
        username: userData.username,
        profilePhoto: userData.profilePhoto,
        status: data.status || "on_hold",
        createdAt: data.createdAt ?? null,
      };
    })
  );

  return results;
}

async function setRequestStatusService({ clubId, slotId, requestId, newStatus }) {
  if (!clubId || !slotId || !requestId) {
    const err = new Error("clubId, slotId, requestId required");
    err.code = "BAD_REQUEST";
    throw err;
  }
  const allowed = new Set(["on_hold", "accepted", "declined"]);
  if (!allowed.has(newStatus)) {
    const err = new Error("Invalid status");
    err.code = "BAD_REQUEST";
    throw err;
  }

  const slotRef = scheduleCol(clubId).doc(slotId);
  const reqRef = slotRef.collection("gamerRequest").doc(requestId);
  const accCol = slotRef.collection("gamersAcceptance");

  return await db.runTransaction(async (tx) => {
    const [slotSnap, reqSnap] = await Promise.all([
      tx.get(slotRef),
      tx.get(reqRef),
    ]);

    if (!slotSnap.exists) {
      const err = new Error("Slot not found");
      err.code = "NOT_FOUND";
      throw err;
    }
    if (!reqSnap.exists) {
      const err = new Error("Request not found");
      err.code = "NOT_FOUND";
      throw err;
    }

    const slot = slotSnap.data() || {};
    const req = reqSnap.data() || {};
    const prevStatus = req.status;
    const userid = String(req.userid || "");
    if (!userid) {
      const err = new Error("Request missing userid");
      err.code = "BAD_REQUEST";
      throw err;
    }

    // Count docs in gamersAcceptance **inside** the transaction
    const accQuery = accCol.select(admin.firestore.FieldPath.documentId());
    const accSnap = await tx.get(accQuery);
    const currentAcceptedCount = accSnap.size;

    // Read configured max (support both keys just in case)
    const maxAcceptance = Number(slot.maxAcceptance ?? slot.MaxAcceptance ?? 0);

    // No-op
    if (prevStatus === newStatus) {
      return { ok: true, requestId, newStatus, acceptedCount: currentAcceptedCount };
    }

    // Moving into accepted: enforce capacity, then add {userid} doc
    if (newStatus === "accepted" && prevStatus !== "accepted") {
      if (maxAcceptance > 0 && currentAcceptedCount >= maxAcceptance) {
        const err = new Error("Slot is full");
        err.code = "SLOT_FULL";
        throw err;
      }
      tx.set(
        accCol.doc(userid),
        { userid, createdAt: admin.firestore.FieldValue.serverTimestamp() },
        { merge: true }
      );
    }

    // Leaving accepted: remove {userid} doc
    if (prevStatus === "accepted" && newStatus !== "accepted") {
      tx.delete(accCol.doc(userid));
    }

    // Update request status
    tx.set(
      reqRef,
      { status: newStatus, decidedAt: admin.firestore.FieldValue.serverTimestamp() },
      { merge: true }
    );

    // Predict the count after the change (optional, for UI)
    const nextAcceptedCount =
      newStatus === "accepted" && prevStatus !== "accepted"
        ? currentAcceptedCount + 1
        : prevStatus === "accepted" && newStatus !== "accepted"
          ? Math.max(currentAcceptedCount - 1, 0)
          : currentAcceptedCount;

    return { ok: true, requestId, newStatus, acceptedCount: nextAcceptedCount };
  });
}






module.exports = {
  addUserAchievement,
  getUserAchievements,
  getUserById,
  getFollowNum,
  addUserGame,
  getUserGames,
  getGames,
  updateUserProfileService,
   addUserScrim,
  getUserScrims,
  initScrimArenaForSchedule, 
  getUserArenas,
  getUserScrimsWithGame,
    listRequestsForSlotService,
  setRequestStatusService,
};