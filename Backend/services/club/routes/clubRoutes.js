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

const upload = multer({ storage: multer.memoryStorage() }); // <— important



/*
const uploadProfile = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) =>
    file.mimetype.startsWith("image/") ? cb(null, true) : cb(new Error("Images only")),
});


//for achievement files
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}*/

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


router.get("/:userid/following", authenticate, clubController.getFollowing);
router.get("/:userid/followers", authenticate, clubController.getFollowers);
router.get("/:userid/achievements", authenticate, requireOwner, clubController.listAchievements);
router.get("/:userid/games", authenticate, requireOwner, clubController.listGames);
router.get("/:userid/followNums", authenticate, requireOwner, clubController.getFollowNums);
router.post("/:userid/add/games", authenticate, requireOwner, clubController.addGame);
router.post("/:userid/add", authenticate, requireOwner, upload2.single("file"), clubController.addAchievement);
router.get("/games/all", clubController.getAllGames);
router.put("/club/:userid/profile", upload.single("avatar"), clubController.UpdateUserProfile);

module.exports = router;
