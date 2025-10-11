
const express = require("express");
const { getUserDetails, postRtcToken } = require("../controllers/agoraController");
const authenticate = require("../../../middlewares/auth");
const router = express.Router();

router.get("/v1/user/details",authenticate, getUserDetails);
router.post("/v1/rtc/token",authenticate, postRtcToken);

module.exports = router;
