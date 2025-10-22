// followController.js
const {
  followUser,
  unfollowUser,
  getFollowStats,
} = require("../followServices");

// Follow target userId (from URL) by current authenticated user.
async function followController(req, res) {
  try {
    const currentUserId = req.user?.uid;
    const targetId = req.params.targetId || req.body?.targetId;
    console.log('[follow] viewer auth uid:', currentUserId, 'target doc id:', targetId);
    if (!currentUserId) return res.status(401).json({ success: false, message: "Unauthorized" });
    if (!targetId) return res.status(400).json({ success: false, message: "Missing targetId" });

    const result = await followUser(currentUserId, targetId);
    const stats = await getFollowStats(currentUserId, targetId);
    console.log('[follow] success stats:', stats);
    res.json({ success: true, ...stats });
  } catch (err) {
    console.error("followController error", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
}

// Unfollow target userId by current authenticated user.
async function unfollowController(req, res) {
  try {
    const currentUserId = req.user?.uid;
    const targetId = req.params.targetId || req.body?.targetId;
    console.log('[unfollow] viewer auth uid:', currentUserId, 'target doc id:', targetId);
    if (!currentUserId) return res.status(401).json({ success: false, message: "Unauthorized" });
    if (!targetId) return res.status(400).json({ success: false, message: "Missing targetId" });

    const result = await unfollowUser(currentUserId, targetId);
    const stats = await getFollowStats(currentUserId, targetId);
    console.log('[unfollow] success stats:', stats);
    res.json({ success: true, ...stats });
  } catch (err) {
    console.error("unfollowController error", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
}

// Get follow status and counts for a target relative to current user.
async function statusController(req, res) {
  try {
    const currentUserId = req.user?.uid || null;
    const targetId = req.params.targetId;
    console.log('[status] viewer auth uid:', currentUserId, 'target doc id:', targetId);
    if (!targetId) return res.status(400).json({ success: false, message: "Missing targetId" });
    const stats = await getFollowStats(currentUserId, targetId);
    res.json({ success: true, ...stats });
  } catch (err) {
    console.error("statusController error", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
}

module.exports = { followController, unfollowController, statusController };