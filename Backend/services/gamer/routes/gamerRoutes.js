const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const router = express.Router();
const gamerController = require("../controllers/gamerController");

const uploadPath = path.join(__dirname, "../../../storage/achievements");

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

const upload = multer({ storage });

// Routes
router.post("/:userid/add", upload.single("file"), gamerController.addAchievement);//
router.get("/:userid/achievements", gamerController.listAchievements);//
router.get("/:userid/profile", gamerController.getUserProfile);//
router.get("/:id/followNums", gamerController.getFollowNums);//
router.post("/add", gamerController.addGame);//
router.get("/:userid", gamerController.listGames);//
router.get("/", gamerController.getAllGames);//

module.exports = router;