// Backend/middlewares/auth.js
const { auth } = require("../Firebase/firebaseBackend");

const authenticate = async (req, res, next) => {
  try {
    // Get token from header: "Authorization: Bearer <token>"
    const header = req.headers.authorization;
    if (!header) {
      return res.status(401).json({ success: false, error: "No token provided" });
    }

    const token = header.split(" ")[1]; // remove "Bearer"
    if (!token) {
      return res.status(401).json({ success: false, error: "Invalid token format" });
    }

    // Verify with Firebase Admin
    const decoded = await auth.verifyIdToken(token);

    // Attach user info to request
    req.user = decoded;
    next(); // continue to controller
  } catch (err) {
    return res.status(401).json({ success: false, error: "Unauthorized: " + err.message });
  }
};

module.exports = authenticate;
