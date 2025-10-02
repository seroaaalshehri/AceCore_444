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

} = require("../gamerService");

//addInfo
async function UpdateUserProfile(req, res) {
  try {
    const { userid } = req.params;

    const payload = typeof req.body?.profile === "string"
      ? JSON.parse(req.body.profile)
      : (req.body || {});

    const safe = {
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









































   /* const fileInput = req.file ? {
      buffer: req.file.buffer,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
    } : null;

    const updated = await updateUserProfileService(userid, safe, { fileInput });
    return res.json({ success: true, profile: updated });
  } catch (err) {
    console.error("❌ UpdateUserProfile error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
}*/

// Add achievement
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


// List achievements
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

};




