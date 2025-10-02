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



/*const uploadProfile = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) =>
    file.mimetype.startsWith("image/") ? cb(null, true) : cb(new Error("Images only")),
});
*/

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


router.get("/:userid/following", authenticate, gamerController.getFollowing);
router.get("/:userid/followers", authenticate, gamerController.getFollowers);
router.get("/:userid/achievements", authenticate, requireOwner, gamerController.listAchievements);
router.get("/:userid/games", authenticate, requireOwner, gamerController.listGames);
router.get("/:userid/followNums", authenticate, requireOwner, gamerController.getFollowNums);
router.post("/:userid/add/games", authenticate, requireOwner, gamerController.addGame);
router.post("/:userid/add", authenticate, requireOwner, upload2.single("file"), gamerController.addAchievement);
router.get("/games/all", gamerController.getAllGames);
router.put("/gamer/:userid/profile", upload.single("avatar"), gamerController.UpdateUserProfile);


module.exports = router;