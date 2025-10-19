const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const router = express.Router();
const clubController = require("../controllers/clubController");
const authenticate = require("../../../middlewares/auth");
const { buildRequireOwner } = require("../../../middlewares/requireOwner");
const { getUserByAuthUidService } = require("../../user/userServices/userService");
const requireOwner = buildRequireOwner(getUserByAuthUidService);
const uploadPath = path.join(__dirname, "../../../storage/achievements");
const { db } = require('../../../Firebase/firebaseBackend'); 

const upload = multer({ storage: multer.memoryStorage() }); 





if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload2 = multer({ storage });

router.get("/:userid/profile", authenticate, requireOwner, clubController.getUserProfile);
router.post("/:userid/profile",
  authenticate,
  requireOwner,
  upload.single("file"),
  clubController.UpdateUserProfile
);


router.put('/:userId/:scrimId/links', async (req, res) => {
  try {
    const { userId, scrimId } = req.params;
    const { channelName, title, hostUrl, attendeeUrl, status  } = req.body || {};

    if (!userId || !scrimId) {
      return res.status(400).json({ ok: false, error: 'Missing userId or scrimId' });
    }

    const ref = db.collection('users')
      .doc(userId)
      .collection('scrimArena')
      .doc(scrimId);

    await ref.set({
      channelName: channelName ?? '',
      title: title ?? '',
      hostUrl: hostUrl ?? '',
      attendeeUrl: attendeeUrl ?? '',
      status :status?? "scheduled"
    }, { merge: true });

    res.json({ ok: true });
  } catch (e) {
    console.error('links route error:', e);
    res.status(500).json({ ok: false, error: String(e) });
  }
});

router.put('/:userId/:scrimId/end', async (req, res) => {
  try {
    const { userId, scrimId } = req.params;
    const {status} = req.body || {};

    if (!userId || !scrimId) {
      return res.status(400).json({ ok: false, error: 'Missing userId or scrimId' });
    }

    const ref = db.collection('users')
      .doc(userId)
      .collection('scrimArena')
      .doc(scrimId);

    await ref.set({
      status :status?? "scheduled"
    }, { merge: true });

    res.json({ ok: true });
  } catch (e) {
    console.error('links route error:', e);
    res.status(500).json({ ok: false, error: String(e) });
  }
});


router.get("/:userid/following", authenticate, clubController.getFollowing);
router.get("/:userid/followers", authenticate, clubController.getFollowers);
router.get("/:userid/achievements", authenticate, requireOwner, clubController.listAchievements);
router.get("/:userid/games", authenticate, requireOwner, clubController.listGames);
router.get("/:userid/followNums", authenticate, requireOwner, clubController.getFollowNums);
router.post("/:userid/add/games", authenticate, requireOwner, clubController.addGame);
router.post("/:userid/add", authenticate, requireOwner, upload2.single("file"), clubController.addAchievement);
router.get("/games/all", clubController.getAllGames);
router.put("/:userid/profile",
  authenticate,
  requireOwner,
  upload.single("avatar"),  
  clubController.UpdateUserProfile
);

router.get("/:userid/schedule", authenticate, requireOwner, clubController.listScrims);
router.post("/:userid/schedule", authenticate, requireOwner, clubController.addScrim);
router.get("/:userid/scrim-arenas", authenticate, requireOwner, clubController.listArenas);
router.get("/:userid/scrim-arenas/:scrimid", authenticate, requireOwner, clubController.getArena);

router.get("/:userid/schedule/scrimswithgames", authenticate, requireOwner, clubController.listScrimswithgames);


router.get("/:clubId/schedule/:slotId/requests", authenticate, requireOwner, clubController.listRequestsForSlotController );//////////////
// Update request status
router.post(
  "/:clubId/schedule/:slotId/requests/:requestId",  authenticate, requireOwner, clubController.setRequestStatusController
);
  


module.exports = router;
