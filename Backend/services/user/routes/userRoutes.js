const express = require("express"); 
const router = express.Router();
const userController = require("../controllers/userController");
const authenticate = require("../../../middlewares/auth");
const passport = require("passport");
const optionalAuth = (req, _res, next) => next();
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });
const {admin,db} = require("../../../Firebase/firebaseBackend");





// Start OAuth
router.get("/auth/twitch/popup", passport.authenticate("twitch"));


router.get(
  "/auth/twitch/callback",
  passport.authenticate("twitch", { session: false }),
  async (req, res) => {                    
    try {
      const u = req.user; 
      const email = u.email || "";
      const broadcaster_id = u.twitchId || u.id || ""; 

    
      await db.collection("twitchPending").doc(String(broadcaster_id)).set({
        broadcasterId: String(broadcaster_id),
        email,
        accessToken: u.accessToken || "",
        refreshToken: u.refreshToken || "",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });

 
      res.send(`
        <script>
          window.opener.postMessage(
            {
              email: "${email}",
              broadcaster_id: ${JSON.stringify(broadcaster_id)},
              role: "club",
              provider: "twitch"
            },
            "http://localhost:3000"
          );
          window.close();
        </script>
      `);
    } catch (e) {
      console.error("twitch callback error:", e);
      res.status(500).send("Twitch link failed");
    }
  }
);


//signIN twtich
router.post("/claim-by-email", async (req, res) => {
  try {
    const rawEmail = String(req.body?.email || "").trim().toLowerCase();
    if (!rawEmail) {
      return res.status(400).json({ success: false, message: "Missing email" });
    }

    const usersCol = db.collection("users");
    const q = usersCol.where("normalizedEmail", "==", rawEmail).limit(1);
    const snap = await q.get();

    if (snap.empty) {
      return res.status(404).json({ success: false, message: "Profile not found" });
    }

    const doc = snap.docs[0];
    const user = doc.data();
    const uid = user.authUid; // this is the canonical Firebase UID you saved at signup

    if (!uid) {
      return res.status(409).json({
        success: false,
        message: "Profile exists but is missing authUid. Contact support.",
      });
    }

    // Mint a custom token for the existing UID
    const customToken = await admin.auth().createCustomToken(uid, { role: user.role });
    return res.json({
      success: true,
      customToken,
      user: { id: doc.id, role: user.role, username: user.username },
    });
  } catch (e) {
    console.error("claim-by-email error:", e);
    return res.status(500).json({ success: false, message: "Internal error" });
  }
});


router.post("/twitch/email", async (req, res) => {
  try {
    const accessToken = String(req.body?.accessToken || "");
    if (!accessToken) return res.status(400).json({ success:false, message:"Missing token" });

    // Call Helix /users with the user access token
    const r = await fetch("https://api.twitch.tv/helix/users", {
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Client-Id": process.env.TWITCH_CLIENT_ID
      }
    });
    if (!r.ok) {
      const txt = await r.text().catch(()=> "");
      return res.status(502).json({ success:false, message:"Helix error", detail: txt });
    }
    const data = await r.json();
    const email = data?.data?.[0]?.email || "";
    return res.json({ success:true, email });
  } catch (err) {
    console.error("twitch/email error:", err);
    return res.status(500).json({ success:false, message:"Internal error" });
  }
});




router.get("/me", authenticate, userController.getMe);
router.post("/login", userController.loginWithUsername);
router.post("/verify-complete", optionalAuth,upload.single("clubAvatar"), userController.verifyComplete);
router.get("/by-auth/:uid",    optionalAuth, userController.getByAuthUid); 
router.get("/check-username", optionalAuth, userController.checkUsername); 
router.get("/", authenticate, userController.getAllUsers);
router.get("/:id", authenticate, userController.getUser);
router.put("/:id", authenticate, userController.updateUser);
router.delete("/:id", authenticate, userController.deleteUser);

module.exports = router;
