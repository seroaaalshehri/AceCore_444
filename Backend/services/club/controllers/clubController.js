// controllers/clubController.js
const { admin, db } = require('../../../Firebase/firebaseBackend');
const { FieldPath } = admin.firestore;
const { getStorage } = require('firebase-admin/storage');
const { v4: uuidv4 } = require('uuid');
const { notifyRequestStatusChange, notifySlotCanceled } = require("../../../notify");
const {
  addUserAchievement,
  getUserAchievements,
  getUserById,
  getFollowNum,
  addUserGame,
  getUserGames,
  getGames,
  updateUserProfileService,
  updateUserAchievement,
   getClubSlots,
  getClubGames,
   addUserScrim,
  getUserScrims,
  initScrimArenaForSchedule,
  getUserArenas ,
  getUserScrimsWithGame,
  listRequestsForSlotService,
  setRequestStatusService,
deleteScheduleSlot,
} = require("../clubServices");
const {
  listNotifications: listNotificationsService,
  markNotificationRead: markNotificationReadService,
  getNotificationForGamerService,
} = require("../../gamer/gamerService");
// -------------------- Add / Update Club Profile --------------------
async function UpdateUserProfile(req, res) {
  try {
    const { userid } = req.params;

    const payload = typeof req.body?.profile === 'string'
      ? JSON.parse(req.body.profile)
      : (req.body || {});

    // club-safe payload (club model)
    const safe = {
      clubName: payload.clubName ?? '',
      username: payload.username ?? '',
      bio: payload.bio ?? '',
      country: payload.country ?? '',
      socials: {
        twitch: payload?.socials?.twitch ?? '',
        youtube: payload?.socials?.youtube ?? '',
        x: payload?.socials?.x ?? '',
        discord: payload?.socials?.discord ?? '',
      },
    };

    // File upload (match gamer controller behavior)
    if (req.file && req.file.buffer) {
      const bucket = getStorage().bucket();
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
    console.error('❌ UpdateUserProfile error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

async function addAchievement(req, res) {
  try {
    const { userid } = req.params;
    const { name, association, game, date } = req.body;

    const baseUrl = `${req.protocol}://${req.get('host')}`.replace('3000', '4000');

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
    console.error('❌ Error adding achievement:', err);
    res.status(500).json({ success: false, error: err.message });
  }
}

async function listAchievements(req, res) {
  try {
    const { userid } = req.params;
    const achievements = await getUserAchievements(userid);
    res.json({ success: true, achievements });
  } catch (err) {
    console.error('❌ Error listing achievements:', err);
    res.status(500).json({ success: false, error: err.message });
  }
}

async function getUserProfile(req, res) {
  try {
    const { userid } = req.params;
    const data = await getUserById(userid);

    if (!data) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (data.profilePhoto && !/^https?:\/\//i.test(data.profilePhoto)) {
      const baseUrl = `${req.protocol}://${req.get('host')}`.replace('3000', '4000');
      const rel = String(data.profilePhoto).replace(/^\/+/, '');
      data.profilePhoto = `${baseUrl}/${rel}`;
    }

    res.json({ success: true, profile: data });
  } catch (err) {
    console.error('❌ Error fetching user profile:', err);
    res.status(500).json({ success: false, error: err.message });
  }
}

async function getFollowNums(req, res) {
  try {
    const userId = req.params.userid;
    const stats = await getFollowNum(userId);
    res.json({ success: true, ...stats });
  } catch (error) {
    console.error('Error fetching follow numbers:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

async function addGame(req, res) {
  try {
    const { userid } = req.params;
    const { gameid } = req.body;

    if (!userid || !gameid) {
      return res.status(400).json({
        success: false,
        error: 'userid and gameid are required'
      });
    }

    const result = await addUserGame(gameid, userid);
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
      return res.status(400).json({ success: false, message: 'Missing userid' });
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

    const users = await Promise.all(
      ids.map(async (id) => {
        const docSnap = await db.collection('users').doc(id).get();
        return docSnap.exists ? { id, ...docSnap.data() } : { id };
      })
    );

    const next = snap.docs.length === pageSize ? snap.docs[snap.docs.length - 1].id : null;
    return res.json({ success: true, users, next });
  } catch (e) {
    console.error('getFollowing error:', e);
    return res.status(500).json({ success: false, message: 'Internal error' });
  }
}

async function getFollowers(req, res) {
  try {
    const userId = req.params.userid;
    const pageSize = Math.min(parseInt(req.query.limit || '20', 10), 50);
    const cursor = req.query.cursor || null;

    if (!userId) {
      return res.status(400).json({ success: false, message: 'Missing userid' });
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
    console.error('getFollowers error:', e);
    return res.status(500).json({ success: false, message: 'Internal error' });
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






async function deleteAchievement(req, res) {
  try {
    console.log('[deleteAchievement] The achievement deletion request has been received', req.params);
    const { userid, achievementid } = req.params;
    await require("../clubServices").deleteUserAchievement(userid, achievementid);
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
    await require("../clubServices").deleteUserGame(userid, gameid);
    res.json({ success: true });
  } catch (err) {
    console.error("❌ Error deleting game:", err);
    res.status(500).json({ success: false, error: err.message });
  }
}


//Updated with logic of init ScrimArenas docs
async function addScrim(req, res) {
  try {
    const { userid } = req.params;
    const { gameid, scrimTime, scrimEndTime, maxGamers, scrimType, maxAcceptance } = req.body;

    if (!gameid || !scrimTime || !scrimEndTime || !maxGamers || !scrimType || !maxAcceptance)
      return res.status(400).json({ success: false, error: "Missing fields" });

    // 1) create the schedule slot
    const slot = await addUserScrim(userid, {
      gameid,
      scrimTime,
      scrimEndTime,
      maxGamers: Number(maxGamers),
      scrimType,
      maxAcceptance: Number(maxAcceptance),
    });

    // 2) immediately create the paired scrimArena doc & back-link schedule.scrimId
    const arena = await initScrimArenaForSchedule(userid, slot.id);

    // 3) return both
    res.json({ success: true, slot: { ...slot, scrimId: arena.scrimId }, arena });
  } catch (e) {
    console.error("addScrim error:", e);
    res.status(500).json({ success: false, error: e.message });
  }
}

async function listScrims(req, res) {
  try {
    const { userid } = req.params;
    const { gameid, from, to } = req.query;
    const { slots } = await getUserScrims(userid, { gameid, from, to });
    res.json({ success: true, slots });
  } catch (e) {
    console.error("listScrims error:", e);
    res.status(500).json({ success: false, error: e.message });
  }
}


async function listScrimswithgames(req, res) {
  try {
    const { userid } = req.params;
    const { gameid, from, to } = req.query;
    const { slots } = await getUserScrimsWithGame(userid, { gameid, from, to });
    res.json({ success: true, slots });
  } catch (e) {
    console.error("listScrims error:", e);
    res.status(500).json({ success: false, error: e.message });
  }
}


async function listArenas(req, res) {
  try {
    const { userid } = req.params;
    const status = String(req.query?.status || "").trim().toLowerCase(); 
    const arenas = await getUserArenas(userid, { status: status || undefined });
    return res.json({ success: true, arenas });
  } catch (e) {
    console.error("listArenas error:", e);
    return res.status(500).json({ success: false, error: e.message });
  }
}

async function getArena(req, res) {
  try {
    const { userid, scrimid } = req.params;
    const ref = db.collection("users").doc(userid).collection("scrimArena").doc(scrimid);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ success: false, error: "Not found" });
    return res.json({ success: true, arena: { id: snap.id, ...snap.data() } });
  } catch (e) {
    console.error("getArena error:", e);
    return res.status(500).json({ success: false, error: e.message });
  }
}



async function listRequestsForSlotController(req, res) {
  try {
    const { clubId, slotId } = req.params;
    const raw = String(req.query.status || "");
    const allowed = new Set(["on_hold", "accepted", "declined"]);
    const status = allowed.has(raw) ? raw : undefined;


    const items = await listRequestsForSlotService({ clubId, slotId, status, limit: 100 });

    res.json({ ok: true, items });
  } catch (e) {
    console.error("listRequestsForSlotController error:", e);
    res.status(500).json({ ok: false, error: e.message });
  }
}
async function setRequestStatusController(req, res, next) {
  let result;                                   // new
  const { clubId, slotId, requestId } = req.params;
  try {
    console.log("BODY:", req.body, "PARAMS:", req.params);

    const { status } = req.body;

    const result = await setRequestStatusService({
      clubId,
      slotId,
      requestId,
      newStatus: status,
    });
    if (result.ok && result.changed && result.gamerId) {
      await notifyRequestStatusChange({               // new
        gamerId: String(result.gamerId),
        clubId,
        slotId,
        newStatus: result.newStatus,
      });
    }
    return res.json({ ok: true, ...result });
  } catch (err) {
    // Map known errors to proper HTTP codes
    if (err.code === "BAD_REQUEST") {
      return res.status(400).json({ ok: false, error: err.message });
    }
    if (err.code === "NOT_FOUND") {
      return res.status(404).json({ ok: false, error: err.message });
    }
    if (err.code === "SLOT_FULL") {
      return res.status(409).json({ ok: false, error: err.message });
    }
    next(err);
  }
}


async function listClubGames(req, res) {
  try {
    const { userid } = req.params;
    const games = await getClubGames(userid);
    res.json({ success: true, games });
  } catch (e) {
    console.error("listClubGames error:", e);
    res.status(500).json({ success: false, error: e.message });
  }
}


async function listClubSlots(req, res) {
  try {
    const { clubId } = req.params;
    const { gameid, from, to } = req.query;
    const slots = await getClubSlots(clubId, { gameid, from, to });
    res.json({ success: true, slots });
  } catch (e) {
    console.error("listClubSlots error:", e);
    res.status(500).json({ success: false, error: e.message });
  }
}


async function getUserProfilePublic(req, res) {
  try {
    const { userid } = req.params;
    const data = await getUserById(userid);
    if (!data) return res.status(404).json({ success: false, message: 'User not found' });
    const profile = {
      id: userid,
      clubName: data.clubName || '',
      username: data.username || '',
      bio: data.bio || '',
      country: data.country || '',
      socials: data.socials || {},
      profilePhoto: data.profilePhoto || '',
      role: data.role || 'club',
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

async function cancelSchedule(req, res) {
  try {
    const { userid, slotId } = req.params;
    const { ok, affectedGamers, gameName, scrimTimeText, } = await deleteScheduleSlot(userid, slotId);///new
    if (!ok) return res.status(404).json({ ok: false, error: "Not found" });

    // notify each gamer
    for (const gamerId of affectedGamers) {
      await notifySlotCanceled({
        gamerId,
        clubId: userid,
        slotId,
        gameName,
        scrimTimeText,
      });
    }

    return res.json({
      ok: true,
      notifiedGamers: affectedGamers.length,
    });

  } catch (e) {
    console.error("cancelSchedule error:", e);
    if (e?.code === "TOO_CLOSE") {
      return res.status(409).json({
        ok: false,
        code: "TOO_CLOSE",
        error: "Cancellation not allowed within 24 hours of the start time.",
      });
    }
    return res.status(500).json({ ok: false, error: e.message });
  }
}

async function listClubNotifications(req, res) {
  try {
    const { userid  } = req.params;

    // reuse same logic as gamer, just pass clubId as the "gamerId"
    const notifications = await listNotificationsService({ gamerId: userid  });

    res.status(200).json({ success: true, notifications });
  } catch (err) {
    console.error("listClubNotifications error:", err);
    res.status(500).json({
      success: false,
      error: err.message || "Failed to list club notifications",
    });
  }
}

async function markClubNotificationRead(req, res) {
  try {
    const { userid , id } = req.params;

    await markNotificationReadService({ gamerId: userid , id });

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("markClubNotificationRead error:", err);
    res.status(500).json({
      success: false,
      error: err.message || "Failed to mark notification as read",
    });
  }
}

async function getClubNotification(req, res, next) {
  try {
    const { userid , id } = req.params;

    const notification = await getNotificationForGamerService({
      gamerId: userid ,
      id,
    });

    return res.status(200).json({ success: true, notification });
  } catch (err) {
    if (err.code === "NOT_FOUND") {
      return res.status(404).json({
        success: false,
        error: err.message || "Notification not found",
      });
    }
    return next(err);
  }
}

module.exports = {
  UpdateUserProfile,
  addAchievement,
  listAchievements,
  getUserProfile,
  getFollowNums,
  addGame,
  listGames,
  getAllGames,
  getFollowing,
  getFollowers,
updateAchievement,
  deleteAchievement,
  deleteGame,
  addScrim,
  listScrims,
   listArenas,
  getArena,
   listClubGames,
  listClubSlots,
  listScrimswithgames,
  listRequestsForSlotController,
  setRequestStatusController,
   getUserProfilePublic,
  listAchievementsPublic,
  listGamesPublic,
  cancelSchedule,
  listClubNotifications,
  markClubNotificationRead,
  getClubNotification,
};
