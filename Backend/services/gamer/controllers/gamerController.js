const { admin, db } = require('../../../Firebase/firebaseBackend');
const { FieldPath } = admin.firestore;
const { getStorage } = require("firebase-admin/storage");
const { v4: uuidv4 } = require("uuid");

const {
  addUserAchievement,
  getUserAchievements,
  getUserById,
  getFollowNum,
  addUserGame,
  getUserGames,
  getGames,
  updateUserProfileService,
   listGamerRequests,
  createRequest,
   listGamesForGamerService,
   listNotifications: listNotificationsService,
   markNotificationRead: markNotificationReadService,
  getNotificationForGamerService,
 
} = require("../gamerService");

//addInfo
async function UpdateUserProfile(req, res) {
  try {
    const { userid } = req.params;

    const payload = typeof req.body?.profile === "string"
      ? JSON.parse(req.body.profile)
      : (req.body || {});

    const safe = {
      username: payload.username ?? "",
      firstName: payload.firstName ?? "",
      lastName: payload.lastName ?? "",
      bio: payload.bio ?? "",
      nationality: payload.nationality ?? "",
      socials: {
        twitch: payload?.socials?.twitch ?? "",
        youtube: payload?.socials?.youtube ?? "",
        x: payload?.socials?.x ?? "",
        discord: payload?.socials?.discord ?? "",
      },
    };


if (req.file && req.file.buffer) {
      const bucket = getStorage().bucket(); // uses your initialized admin app
      const filePath = `profileImages/${uuidv4()}.${req.file.originalname}`;
      const token = uuidv4();

      await bucket.file(filePath).save(req.file.buffer, {
        resumable: false,
        metadata: {
          contentType: req.file.mimetype || "application/octet-stream",
          metadata: { firebaseStorageDownloadTokens: token },
        },
      });

const downloadUrl =
        `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(filePath)}?alt=media&token=${token}`;

safe.profilePhoto = downloadUrl; 
    }





const updated = await updateUserProfileService(userid, safe);

    return res.json({ success: true, profile: updated });
  } catch (err) {
    console.error("❌ UpdateUserProfile error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
}








async function addAchievement(req, res) {
  try {
    const { userid } = req.params;
    const { name, association, game, date } = req.body;

    const baseUrl = `${req.protocol}://${req.get("host")}`.replace("3000", "4000");

    const newAch = await addUserAchievement(
      userid,
      name,
      association,
      game,
      date,
      req.file,
      baseUrl
    );

    res.json({ success: true, ...newAch });
  } catch (err) {
    console.error("❌ Error adding achievement:", err);
    res.status(500).json({ success: false, error: err.message });
  }
}



async function listAchievements(req, res) {
  try {
    const { userid } = req.params;
    const achievements = await getUserAchievements(userid);
    res.json({ success: true, achievements });
  } catch (err) {
    console.error("❌ Error listing achievements:", err);
    res.status(500).json({ success: false, error: err.message });
  }
}

// Get user profile
async function getUserProfile(req, res) {
  try {
    const { userid } = req.params;
    const data = await getUserById(userid);

    if (!data) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (data.profilePhoto && !/^https?:\/\//i.test(data.profilePhoto)) {
      const baseUrl = `${req.protocol}://${req.get("host")}`.replace("3000", "4000");
      const rel = String(data.profilePhoto).replace(/^\/+/, ""); // e.g. "storage/profileImages/.."
      data.profilePhoto = `${baseUrl}/${rel}`;
    }


    res.json({ success: true, profile: data });
  } catch (err) {
    console.error("❌ Error fetching user profile:", err);
    res.status(500).json({ success: false, error: err.message });
  }
}

async function getFollowNums(req, res) {
  try {
    const userId = req.params.userid;
    const stats = await getFollowNum(userId);
    res.json({ success: true, ...stats });
  } catch (error) {
    console.error("Error fetching follow numbers:", error);
    res.status(500).json({ success: false, error: error.message });
  }
}

async function addGame(req, res) {
  try {
    const { userid } = req.params;
    const { gameid, username, rank } = req.body;

    if (!userid || !gameid) {
      return res.status(400).json({
        success: false,
        error: "userid and gameid are required"
      });
    }

    const result = await addUserGame(
      gameid,
      rank ?? 0,
      userid,
      username ?? "—",

    );

    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

async function listGames(req, res) {
  try {
    const { userid } = req.params;

    const games = await getUserGames(userid);
    res.json({ success: true, games });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}


async function getAllGames(req, res) {
  try {
    const games = await getGames();
    res.json({ success: true, games });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}


async function getFollowing(req, res) {
  try {
    const userId = req.params.userid;
    const pageSize = Math.min(parseInt(req.query.limit || '20', 10), 50);
    const cursor = req.query.cursor || null;

    if (!userId) {
      return res.status(400).json({ success: false, message: "Missing userid" });
    }

    let q = db
      .collection('users')
      .doc(userId)
      .collection('following')
      .orderBy(FieldPath.documentId())
      .limit(pageSize);

    if (cursor) q = q.startAfter(cursor);

    const snap = await q.get();
    const ids = snap.docs.map(d => d.id);

    // Hydrate basic profiles
    const users = await Promise.all(
      ids.map(async (id) => {
        const docSnap = await db.collection('users').doc(id).get();
        return docSnap.exists ? { id, ...docSnap.data() } : { id };
      })
    );

    const next = snap.docs.length === pageSize ? snap.docs[snap.docs.length - 1].id : null;
    return res.json({ success: true, users, next });
  } catch (e) {
    console.error("getFollowing error:", e);
    return res.status(500).json({ success: false, message: "Internal error" });
  }
}


async function getFollowers(req, res) {
  try {
    const userId = req.params.userid;
    const pageSize = Math.min(parseInt(req.query.limit || '20', 10), 50);
    const cursor = req.query.cursor || null;

    if (!userId) {
      return res.status(400).json({ success: false, message: "Missing userid" });
    }

    let q = db
      .collection('users')
      .doc(userId)
      .collection('followers')
      .orderBy(FieldPath.documentId())
      .limit(pageSize);

    if (cursor) q = q.startAfter(cursor);

    const snap = await q.get();
    const ids = snap.docs.map(d => d.id);

    const users = await Promise.all(
      ids.map(async (id) => {
        const docSnap = await db.collection('users').doc(id).get();
        return docSnap.exists ? { id, ...docSnap.data() } : { id };
      })
    );

    const next = snap.docs.length === pageSize ? snap.docs[snap.docs.length - 1].id : null;
    return res.json({ success: true, users, next });
  } catch (e) {
    console.error("getFollowers error:", e);
    return res.status(500).json({ success: false, message: "Internal error" });
  }
}



async function updateAchievement(req, res) {
  try {
    const { userid, achievementid } = req.params;
    const { name, association, game, date } = req.body || {};

    const fields = {};
    if (name !== undefined)        fields.name = name;
    if (association !== undefined) fields.association = association;
    if (game !== undefined)        fields.game = game;
    if (date !== undefined)        fields.date = date;

    const baseUrl = `${req.protocol}://${req.get('host')}`.replace('3000', '4000');

    const result = await updateUserAchievement(userid, achievementid, fields, req.file, baseUrl);
    if (!result) return res.status(404).json({ success: false, error: 'Achievement not found' });

    res.json({ success: true, achievement: result });
  } catch (err) {
    console.error('updateAchievement error:', err.stack || err); // <-- stack
    res.status(500).json({ success: false, error: err.message });
  }
}

async function updateGameUsername(req, res) {
  try {
    const { userid, gameid } = req.params;
    const { username } = req.body;
    if (!username || !username.trim()) {
      return res.status(400).json({ success: false, error: "Username is required" });
    }
    const result = await require("../gamerService").updateUserGameUsername(userid, gameid, username.trim());
    if (!result) {
      return res.status(404).json({ success: false, error: "Game not found or not owned by user" });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

async function deleteAchievement(req, res) {
  try {
    console.log('[deleteAchievement] The achievement deletion request has been received', req.params);
    const { userid, achievementid } = req.params;
    await require("../gamerService").deleteUserAchievement(userid, achievementid);
    res.json({ success: true });
  } catch (err) {
    console.error("❌ Error deleting achievement:", err);
    res.status(500).json({ success: false, error: err.message });
  }
}

async function deleteGame(req, res) {
  try {
    console.log('[deleteGame] Game deletion request received', req.params);
    const { userid, gameid } = req.params;
    await require("../gamerService").deleteUserGame(userid, gameid);
    res.json({ success: true });
  } catch (err) {
    console.error("❌ Error deleting game:", err);
    res.status(500).json({ success: false, error: err.message });
  }
}



async function listGamerRequestsController(req, res, next) {
  try {
    const { gamerId } = req.params;
    const raw = String(req.query.status || "all");
    const allowed = new Set(["on_hold", "accepted", "declined", "all"]);
    const status = allowed.has(raw) && raw !== "all" ? raw : undefined;

    const items = await listGamerRequests({ gamerId, status, limit: 100 });
    return res.json({ success: true, items });
  } catch (e) {
    next(e);
  }
}

async function sendRequest(req, res) {
  try {
    const { clubId, slotId } = req.params;
    const authUid = req.user?.uid;

    if (!authUid) throw new Error("Missing authenticated user");

    const userSnap = await db
      .collection("users")
      .where("authUid", "==", authUid)
      .limit(1)
      .get();

    if (userSnap.empty) throw new Error("User not found for this Firebase UID");

    const gamerId = userSnap.docs[0].id;
    const result = await createRequest({ clubId, slotId, gamerId });
    return res.json(result);

  } catch (err) {

    const messages = {
      ALREADY_REQUESTED: "You have already sent a request for this slot.",
      DAILY_LIMIT: "You have reached the daily limit of 3 requests per day.",
      TIME_CONFLICT: "This time conflicts with another slot you have requested.",
      TIME_EXPIRED: "This slot has already started or ended.",
      NOT_FOUND: "Slot not found.",
      BAD_REQUEST: "Missing required parameters: clubId, slotId, or gamerId.",
    };

    const message = messages[err.code] || "Unexpected error occurred while creating the request.";
    return res.status(400).json({ success: false, message });
  }
}


async function listGamesForGamerController(req, res, next) {
  try {
    const { gamerId } = req.params;
    const games = await listGamesForGamerService(gamerId);
    return res.json({ success: true, games, items: games }); 
  } catch (e) { next(e); }
}



async function getUserProfilePublic(req, res) {
  try {
    const { userid } = req.params;
    const data = await getUserById(userid);
    if (!data) return res.status(404).json({ success: false, message: 'User not found' });
    const profile = {
      id: userid,
      firstName: data.firstName || '',
      lastName: data.lastName || '',
      username: data.username || '',
      bio: data.bio || '',
      nationality: data.nationality || '',
      birthdate: data.birthdate || null,
      socials: data.socials || {},
      profilePhoto: data.profilePhoto || '',
      role: data.role || 'gamer',
    };
    return res.json({ success: true, profile });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

async function listAchievementsPublic(req, res) {
  try {
    const { userid } = req.params;
    const achievements = await getUserAchievements(userid);
    return res.json({ success: true, achievements });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

async function listGamesPublic(req, res) {
  try {
    const { userid } = req.params;
    const games = await getUserGames(userid);
    return res.json({ success: true, games });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

async function listNotifications(req, res) {
  try {
    const { gamerId } = req.params;
    const notifications = await listNotificationsService({ gamerId });
    res.status(200).json({ success: true, notifications });
  } catch (err) { /* … */ }
}

async function markNotificationRead(req, res) {
  try {
    const { gamerId, id } = req.params;
    await markNotificationReadService({ gamerId, id });
    res.status(200).json({ success: true });
  } catch (err) { /* … */ }
}


// NEW: GET /api/gamer/:gamerId/notifications/:id
async function getNotification(req, res, next) {
  try {
    const { gamerId, id } = req.params;
    const notification = await getNotificationForGamerService({ gamerId, id });
    return res.status(200).json({ success: true, notification });
  } catch (err) {
    if (err.code === "NOT_FOUND") {
      return res.status(404).json({ success: false, error: err.message });
    }
    return next(err);
  }
}


module.exports = {
  addAchievement,
  listAchievements,
  getUserProfile,
  getFollowNums,
  addGame,
  listGames,
  getAllGames,
  UpdateUserProfile,
  getFollowing,
  getFollowers,
  deleteAchievement,
  deleteGame,
  updateGameUsername,
  updateAchievement,
  listGamerRequestsController, 
   sendRequest,
   listGamesForGamerController,
  getUserProfilePublic,
  listAchievementsPublic,
  listGamesPublic,
   listNotifications,
   markNotificationRead,
   getNotification,
};