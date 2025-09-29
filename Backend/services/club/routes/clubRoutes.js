const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const router = express.Router();
const clubController = require("../controllers/clubController");
const uploadPath = path.join(__dirname, "../../../storage/achievements");

//for achievement files
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

router.post("/:userid/add", upload.single("file"), clubController.addAchievement);//
router.get("/:userid/achievements", clubController.listAchievements);//
router.get("/:userid/profile", clubController.getUserProfile);//
router.get("/:id/followNums", clubController.getFollowNums);//
router.post("/add", clubController.addGame);//
router.get("/:userid", clubController.listGames);//
router.get("/", clubController.getAllGames);//

module.exports = router;
