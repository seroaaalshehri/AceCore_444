const fs = require("fs");
const { db ,admin } = require("../../Firebase/firebaseBackend");
const { v4: uuidv4 } = require("uuid");
const { Timestamp } = require("firebase-admin/firestore");

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
    firstName: fields.firstName,
    lastName:  fields.lastName,
    bio:       fields.bio,
    nationality: fields.nationality,
    socials:   fields.socials,
    username: fields.username,
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

async function addUserGame( gameid,rank, userid, username) {

  const ref = await db.collection("userGames").add({
    gameid,
    rank,
   userid,
   username
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

async function listGamerRequests({ gamerId, status, limit = 100 }) {
  if (!gamerId) return [];

  let q = db.collectionGroup("gamerRequest").where("userid", "==", String(gamerId));
  if (status) q = q.where("status", "==", status);
  q = q.orderBy("createdAt", "desc").limit(Number(limit) || 100);

  const snap = await q.get();
  if (snap.empty) return [];

  const results = [];

  const jobs = snap.docs.map(async (d) => {
    const data = d.data() || {};

    const slotRef = d.ref.parent.parent; // schedule/{slotId}
    const clubRef = slotRef.parent.parent; // users/{clubId}
    const clubId = clubRef.id;
    const slotId = slotRef.id;

    const slotSnap = await slotRef.get();
    const slot = slotSnap.exists ? slotSnap.data() || {} : {};

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    let slotDate = null;
    if (slot.scrimEndTime?._seconds) {
      slotDate = new Date(slot.scrimEndTime._seconds * 1000);
    } else if (slot.scrimEndTime) {
      slotDate = new Date(slot.scrimEndTime);
    }

    if (slotDate) {
      const slotDay = new Date(slotDate.getFullYear(), slotDate.getMonth(), slotDate.getDate());
      if (slotDay < today) {
        return; 
      }
    }

    const accSnap = await slotRef.collection("gamersAcceptance").get();
    const acceptedCount = accSnap.size;

    let clubName = clubId;
    let clubPhoto = "";
    const clubSnap = await clubRef.get();
    if (clubSnap.exists) {
      const c = clubSnap.data() || {};
      clubName = c.clubName || c.username || clubId;
      clubPhoto = c.profilePhoto || "";
    }

    let gameName = "", gamePhoto = "";
    if (slot?.gameid) {
      const gSnap = await db.collection("games").doc(String(slot.gameid)).get();
      if (gSnap.exists) {
        const g = gSnap.data() || {};
        gameName = g.gameName || "";
        gamePhoto = g.gamePhoto || g.scrimPhoto || "";
      }
    }

    results.push({
      id: d.id,
      status: data.status || "on_hold",
      createdAt: data.createdAt ?? null,

      clubId,
      clubName,
      clubPhoto,
      slotId,

      scrimType: slot.scrimType || "",
      scrimTime: slot.scrimTime ?? null,
      scrimEndTime: slot.scrimEndTime ?? null,

      maxGamers: slot.maxGamers ?? 0,
      maxAcceptance: slot.maxAcceptance ?? 0,
      acceptedCount,

      gameid: slot.gameid ?? "",
      gameName,
      gamePhoto,
    });
  });

  await Promise.all(jobs);

  return results;
}


async function getClubGames(clubId) { 
  if (!clubId) return [];

  const scheduleSnap = await db
    .collection("users")
    .doc(clubId)
    .collection("schedule")
    .get(); 

  const uniqueGameIds = [
    ...new Set(scheduleSnap.docs.map((d) => d.data().gameid).filter(Boolean)),
  ]; 

  const games = await Promise.all(
    uniqueGameIds.map(async (id) => {
      const gameDoc = await db.collection("games").doc(id).get();
      if (!gameDoc.exists) {
        return { id, gameName: id, scrimPhoto: "" };
      }

      const data = gameDoc.data() || {};
      return {
        id,
        gameName: data.gameName || data.name || id,
        scrimPhoto: data.scrimPhoto,
      };
    })
  );

  return games;
}


async function getClubSlots(clubId, { gameid, from, to }) {
  let q = db
    .collection("users")
    .doc(clubId)
    .collection("schedule")
    .orderBy("scrimTime", "asc");
  if (gameid && gameid !== "all") {
    q = q.where("gameid", "==", gameid);
  }
  if (from) q = q.where("scrimTime", ">=", Timestamp.fromDate(new Date(from)));
  if (to) q = q.where("scrimTime", "<=", Timestamp.fromDate(new Date(to)));

  const snap = await q.get();
  const now = new Date();

  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((slot) => {
      const end = slot.scrimEndTime?._seconds
        ? new Date(slot.scrimEndTime._seconds * 1000)
        : new Date(slot.scrimEndTime);
      return end > now;
    });
}



async function createRequest({ clubId, slotId, gamerId }) {
  if (!clubId || !slotId || !gamerId) throw new Error("clubId, slotId, gamerId required");

  const slotRef = db
    .collection("users")
    .doc(clubId)
    .collection("schedule")
    .doc(slotId);

  const slotSnap = await slotRef.get();
  if (!slotSnap.exists) throw new Error("Slot not found");

const reqRef = slotRef.collection("gamerRequest").doc();
  const existed = await reqRef.get();
  if (existed.exists) throw new Error("Request already exists");

  await reqRef.set({
    userid: gamerId,
    status: "on_hold",
    createdAt: new Date()
  });

  return { success: true, message: "Request sent successfully" };
}


async function getGamerSlotsService(gamerId) {
  if (!gamerId) return [];

  const requestsSnap = await db
    .collectionGroup("gamerRequest")
    .where("userid", "==", String(gamerId))
    .where("status", "==", "accepted")
    .get();

  if (requestsSnap.empty) return [];

  const results = [];

  for (const doc of requestsSnap.docs) {
    const data = doc.data() || {};
    const slotRef = doc.ref.parent.parent;
    const clubRef = slotRef.parent.parent;

    const slotSnap = await slotRef.get();
    const slot = slotSnap.exists ? slotSnap.data() || {} : {};

    const clubSnap = await clubRef.get();
    const club = clubSnap.exists ? clubSnap.data() || {} : {};

    let gameName = "", scrimPhoto = "";
    if (slot.gameid) {
      const gSnap = await db.collection("games").doc(String(slot.gameid)).get();
      if (gSnap.exists) {
        const g = gSnap.data() || {};
        gameName = g.gameName || g.name || "";
        scrimPhoto = g.scrimPhoto || g.gamePhoto || "";
      }
    }

    results.push({
      id: doc.id,
      gameid: slot.gameid || "",
      gameName,
      scrimPhoto,
      scrimType: slot.scrimType || "",
      scrimTime: slot.scrimTime || null,
      scrimEndTime: slot.scrimEndTime || null,
      clubId: clubRef.id,
      clubName: club.clubName || club.username || "",
    });
  }

  return results;
}


 async function getGamerAcceptedScrimsService(gamerId) {
  if (!gamerId) return [];

  const q = db
    .collectionGroup("gamerRequest")
    .where("userid", "==", String(gamerId))
    .where("status", "==", "accepted");

  const snap = await q.get();
  if (snap.empty) return [];

  const results = [];

  for (const d of snap.docs) {
    const data = d.data() || {};
    const slotRef = d.ref.parent.parent;
    const clubRef = slotRef.parent.parent;

    const slotSnap = await slotRef.get();
    const slot = slotSnap.exists ? slotSnap.data() || {} : {};

    const clubSnap = await clubRef.get();
    const club = clubSnap.exists ? clubSnap.data() || {} : {};

    let gameName = "",
      gamePhoto = "";
    const gameid = slot.gameid;
    if (gameid) {
      const gSnap = await db.collection("games").doc(String(gameid)).get();
      if (gSnap.exists) {
        const g = gSnap.data() || {};
        gameName = g.gameName || g.name || "";
        gamePhoto = g.scrimPhoto || g.gamePhoto || "";
      }
    }

    results.push({
      id: d.id,
      clubId: clubRef.id,
      clubName: club.clubName || club.username || clubRef.id,
      gameid,
      gameName,
      scrimType: slot.scrimType || "",
      scrimTime: slot.scrimTime || null,
      scrimEndTime: slot.scrimEndTime || null,
      gamePhoto,
    });
  }

  return results;
}


// services/gamer.service.js
async function listGamesForGamerService(/* gamerId not used if all games are public */) {
  const snap = await db.collection("games").get();
  const games = snap.docs.map(d => {
    const g = d.data() || {};
    return {
      id: d.id,
      gameName: g.gameName || g.name || d.id,
      // normalize the photo field; pick whatever you actually store
      scrimPhoto: g.scrimPhoto || g.gamePhoto || g.image || g.imageUrl || g.coverUrl || "",
    };
  });
  return games;
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


module.exports = {
  addUserAchievement,
  getUserAchievements,
  getUserById,
  getFollowNum,
  addUserGame,
  getUserGames,
  getGames,
  updateUserProfileService,
  listGamerRequests,
  getClubSlots,
  createRequest,
  getClubGames,
  getGamerSlotsService,
  getGamerAcceptedScrimsService,
  listGamesForGamerService,
  getUserScrimsWithGame,
};