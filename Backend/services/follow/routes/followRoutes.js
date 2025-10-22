// followRouter.js
const express = require("express");
const router = express.Router();
const authenticate = require("../../../middlewares/auth");
const {
	followController,
	unfollowController,
	statusController,
} = require("../controllers/followController");

// Health check (no auth) to verify mount
router.get("/health", (req, res) => res.json({ ok: true }));

// POST /api/follow/:targetId → follow
router.post("/:targetId", authenticate, followController);
// DELETE /api/follow/:targetId → unfollow
router.delete("/:targetId", authenticate, unfollowController);
// GET /api/follow/:targetId/status → counts + isFollowing
router.get("/:targetId/status", authenticate, statusController);

module.exports = router;