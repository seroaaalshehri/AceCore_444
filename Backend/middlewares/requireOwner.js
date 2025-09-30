function buildRequireOwner(getUserByAuthUidService) {
  return async function requireOwner(req, res, next) {
    try {
      if (!req.user?.uid) {
        return res.status(401).json({ success:false, message:"Unauthorized" });
      }
      const me = await getUserByAuthUidService(req.user.uid);
      if (!me) return res.status(404).json({ success:false, message:"Profile not found" });

      const targetId = req.params.userid ?? req.params.id;
      // If this route targets a specific user, enforce ownership:
      if (targetId && me.id !== targetId) {
        return res.status(403).json({ success:false, message:"Forbidden" });
      }

      req.me = me; // available to controllers
      next();
    } catch (e) {
      console.error("requireOwner error:", e);
      res.status(500).json({ success:false, message:"Internal error" });
    }
  };
}
module.exports = { buildRequireOwner };