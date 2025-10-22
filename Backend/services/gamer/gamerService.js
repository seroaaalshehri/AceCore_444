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
      gamePhoto: game.gamePhoto,
      
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
async function updateUserAchievement(userid, achievementid, fields = {}, file, baseUrl) {
  const docRef = db.collection('users').doc(userid)
                   .collection('achievements').doc(achievementid);
  const snap = await docRef.get();
  if (!snap.exists) return false;

  const ach = snap.data() || {};

  const updates = {};
  if (fields.name !== undefined)        updates.name = fields.name;
  if (fields.association !== undefined) updates.association = fields.association;
  if (fields.game !== undefined)        updates.game = fields.game;
  if (fields.date !== undefined)        updates.date = fields.date;
  updates.updatedAt = admin.firestore.FieldValue.serverTimestamp();

  if (file && (file.path || file.filename)) {
    const filename = file.filename;   
    const localPath = file.path;     

    updates.file = `${baseUrl}/storage/achievements/${encodeURIComponent(filename)}`;
    updates.storagePath = localPath;

   
    if (ach?.storagePath && ach.storagePath !== localPath) {
      try {
        if (fs.existsSync(ach.storagePath)) fs.unlinkSync(ach.storagePath);
      } catch (e) {
        console.warn('Old local file delete warning:', e.message || e);
      }
    }
  }

  await docRef.update(updates);
  const updated = await docRef.get();
  return updated.exists ? { id: updated.id, ...updated.data() } : true;
}


async function updateUserGameUsername(userid, gameid, username) {
  const docRef = db.collection("userGames").doc(gameid);
  const doc = await docRef.get();
  if (!doc.exists || doc.data().userid !== userid) {
    return false;
  }
  await docRef.update({ username });
  return true;
}

async function deleteUserAchievement(userid, achievementid) {
  const docRef = db.collection("users").doc(userid).collection("achievements").doc(achievementid);
  await docRef.delete();
}

async function deleteUserGame(userid, gameid) {
  const docRef = db.collection("userGames").doc(gameid);
  const doc = await docRef.get();
  console.log('[delete Game] userid:', userid, '| gameid:', gameid, '| doc.exists:', doc.exists, '| docUserId:', doc.exists ? doc.data().userid : undefined);
  if (doc.exists && doc.data().userid === userid) {
    await docRef.delete();
    console.log('[delete Game]Deleted successfully');
  } else {
    console.log('[delete Game]Not deleted: Check the values');
  }
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


async function createRequest({ clubId, slotId, gamerId }) {
  if (!clubId || !slotId || !gamerId) {
    const err = new Error("clubId, slotId, gamerId required");
    err.code = "BAD_REQUEST";
    throw err;
  }

 const userSnap = await db.collection("users").doc(gamerId).get();
  const user = userSnap.data();
  if (user?.role === "club") {
    const err = new Error("Clubs cannot send requests for time slots.");
    err.code = "FORBIDDEN";
    throw err;
  }  

  const slotRef = db
    .collection("users")
    .doc(clubId)
    .collection("schedule")
    .doc(slotId);

  const slotSnap = await slotRef.get();
  if (!slotSnap.exists) {
    const err = new Error("Slot not found");
    err.code = "NOT_FOUND";
    throw err;
  }

  const slotData = slotSnap.data();

  const slotStart = slotData.scrimTime?._seconds
    ? new Date(slotData.scrimTime._seconds * 1000)
    : new Date(slotData.scrimTime);
  const slotEnd = new Date(slotStart.getTime() + 2 * 60 * 60 * 1000);

  const existed = await slotRef
    .collection("gamerRequest")
    .where("userid", "==", gamerId)
    .limit(1)
    .get();

  if (!existed.empty) {
    const err = new Error("You have already sent a request for this slot.");
    err.code = "ALREADY_REQUESTED";
    throw err;
  }

  const startOfDay = new Date(slotStart);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(slotStart);
  endOfDay.setHours(23, 59, 59, 999);

  const sameDayRequestsSnap = await db
    .collectionGroup("gamerRequest")
    .where("userid", "==", gamerId)
    .get();

  let sameDayCount = 0;
  const sameDaySlots = [];

  for (const doc of sameDayRequestsSnap.docs) {
    const parentSlotRef = doc.ref.parent.parent;
    const parentSlotSnap = await parentSlotRef.get();
    if (!parentSlotSnap.exists) continue;

    const parentSlot = parentSlotSnap.data();
    const start = parentSlot.scrimTime?._seconds
      ? new Date(parentSlot.scrimTime._seconds * 1000)
      : new Date(parentSlot.scrimTime);

    if (start >= startOfDay && start <= endOfDay) {
      sameDayCount++;
      sameDaySlots.push(parentSlot);
    }
  }

  if (sameDayCount >= 3) {
    const err = new Error("You have reached the daily limit of 3 requests per day.");
    err.code = "DAILY_LIMIT";
    throw err;
  }

  for (const s of sameDaySlots) {
    const sStart = s.scrimTime?._seconds
      ? new Date(s.scrimTime._seconds * 1000)
      : new Date(s.scrimTime);
    const sEnd = new Date(sStart.getTime() + 2 * 60 * 60 * 1000);

    const overlap = slotStart < sEnd && slotEnd > sStart;
    if (overlap) {
      const err = new Error("This time conflicts with another slot you have requested.");
      err.code = "TIME_CONFLICT";
      throw err;
    }
  }

  const now = new Date();
  if (now >= slotStart) {
    const err = new Error("This slot has already started or ended.");
    err.code = "TIME_EXPIRED";
    throw err;
  }

  const reqRef = slotRef.collection("gamerRequest").doc();
  await reqRef.set({
    userid: gamerId,
    status: "on_hold",
    createdAt: new Date(),
  });

  return { success: true, message: "Request sent successfully" };
}



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


// Return latest notifications
async function listNotifications  ({ gamerId }) {
  if (!gamerId) throw new Error("gamerId required");

  const snap = await db
    .collection("users")
    .doc(String(gamerId))
    .collection("notifications")
    .orderBy("createdAt", "desc")
    .get();

  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

// Optional: mark a notification as read
async function markNotificationRead  ({ gamerId, id }) {
  if (!gamerId || !id) throw new Error("gamerId and id required");
  await db
    .collection("users")
    .doc(String(gamerId))
    .collection("notifications")
    .doc(String(id))
    .set({ read: true, readAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
};



// NEW: read a single notification for a gamer
async function getNotificationForGamerService({ gamerId, id }) {
  if (!gamerId || !id) throw new Error("gamerId and id required");

  const snap = await db
    .collection("users")
    .doc(String(gamerId))
    .collection("notifications")
    .doc(String(id))
    .get();

  if (!snap.exists) {
    const err = new Error("Notification not found");
    err.code = "NOT_FOUND";
    throw err;
  }

  return { id: snap.id, ...snap.data() };
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
   updateUserGameUsername,
  updateUserAchievement,
    deleteUserAchievement,
  deleteUserGame,
  listGamerRequests,
  createRequest,
  listGamesForGamerService,
  getUserScrimsWithGame,
   listNotifications,
  markNotificationRead,
  getNotificationForGamerService,
};