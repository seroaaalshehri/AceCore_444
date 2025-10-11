const { buildRtcToken } = require("../agoraService");

async function getUserDetails(req, res) {
  if (!req.user) return res.status(401).json({ success:false, error:"unauthorized" });
  res.json({
    success: true,
    data: {
      id: req.user.uid,
      email: req.user.email || "",
      name: req.user.name || req.user.uid,
      picture: req.user.picture || "",
    },
  });
}

async function postRtcToken(req, res) {
  try {
    const { channel, uid, role } = req.body || {};
    if (!channel || !uid || !role) {
      return res.status(400).json({ success:false, error:"channel, uid, role required" });
    }
    if (!req.user) return res.status(401).json({ success:false, error:"unauthorized" });
    if (uid !== req.user.uid) return res.status(403).json({ success:false, error:"uid mismatch" });

    // Optional: enforce your role policy
    // if (role === "host" && req.user.role !== "club") return res.status(403).end();

    const { rtcToken, expireAt, appId } = buildRtcToken({ channel, uid, role });
    res.json({ success:true, data:{ appId, channel, uid, role, rtcToken, expireAt } });
  } catch (e) {
    console.error("postRtcToken:", e);
    res.status(500).json({ success:false, error:"token_issue_failed" });
  }
}

module.exports = { getUserDetails, postRtcToken };
