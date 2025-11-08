const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const router = express.Router();
const gamerController = require("../controllers/gamerController");
const authenticate = require("../../../middlewares/auth");
const { buildRequireOwner } = require("../../../middlewares/requireOwner");
const { getUserByAuthUidService } = require("../../user/userServices/userService");
const requireOwner = buildRequireOwner(getUserByAuthUidService);
const uploadPath = path.join(__dirname, "../../../storage/achievements");

const upload = multer({ storage: multer.memoryStorage() }); // <— important




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


router.get("/:userid/profile", authenticate, requireOwner, gamerController.getUserProfile);
router.post("/:userid/profile",
  authenticate,
  requireOwner,
  upload.single("file"),
  gamerController.UpdateUserProfile
); 

router.delete('/:userid/achievements/:achievementid', authenticate, requireOwner, gamerController.deleteAchievement);
router.delete('/:userid/games/:gameid', authenticate, requireOwner, gamerController.deleteGame);
router.put('/:userid/games/:gameid', authenticate, requireOwner, gamerController.updateGameUsername);
router.put('/:userid/achievements/:achievementid', authenticate, requireOwner,upload2.single('file'), gamerController.updateAchievement);

router.get("/:userid/following", authenticate, gamerController.getFollowing);
router.get("/:userid/followers", authenticate, gamerController.getFollowers);
router.get("/:userid/achievements", authenticate, requireOwner, gamerController.listAchievements);
router.get("/:userid/games", authenticate, requireOwner, gamerController.listGames);
router.get("/:userid/followNums", authenticate, requireOwner, gamerController.getFollowNums);
router.post("/:userid/add/games", authenticate, requireOwner, gamerController.addGame);
router.post("/:userid/add", authenticate, requireOwner, upload2.single("file"), gamerController.addAchievement);
router.get("/games/all", gamerController.getAllGames);
router.put("/gamer/:userid/profile", upload.single("avatar"), gamerController.UpdateUserProfile);
router.get("/:gamerId/scrims", gamerController.listGamerRequestsController);
/*router.post("/:gamerId/scrims", authenticate, requireOwner, gamerController.createRequestController);*/
router.post("/:clubId/schedule/:slotId/request",authenticate, gamerController.sendRequest);

// games for tabs/banner
router.get("/:gamerId/gamesGames", gamerController.listGamesForGamerController);
router.get("/:userid/profile/public", gamerController.getUserProfilePublic);
router.get("/:userid/achievements/public", gamerController.listAchievementsPublic);
router.get("/:userid/games/public", gamerController.listGamesPublic);

router.get("/:gamerId/notifications/:id", gamerController.getNotification);


router.get("/:gamerId/notifications", gamerController.listNotifications);
router.post("/:gamerId/notifications/:id/read", gamerController.markNotificationRead);

router.delete("/:userid/scrim-appointments/:appointmentId", authenticate, requireOwner, gamerController.cancelScrimAppointment);
router.delete("/:userid/scrim-requests/:requestId", authenticate, requireOwner, gamerController.deleteOnHoldRequest);

module.exports = router;