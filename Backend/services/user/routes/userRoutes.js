const express = require("express"); 
const router = express.Router();
const userController = require("../controllers/userController");
const authenticate = require("../../../middlewares/auth");
const passport = require("passport");
const optionalAuth = (req, _res, next) => next();
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

// Start OAuth
router.get("/auth/twitch/popup", passport.authenticate("twitch"));

router.get(
  "/auth/twitch/callback",
  passport.authenticate("twitch", { session: false }),
  (req, res) => {
    const u = req.user; 


    const email = u.email || "";
    const authUid = u.twitchId || u.id; 
    const username =
      u.displayName || u.display_name || u.login || "club-user";


    res.send(`
      <script>
        window.opener.postMessage(
          {
            email: "${email}",
            authUid: "${authUid}",
            username: "${username}",
            role: "club",
            provider: "twitch"
          },
          "http://localhost:3000"
        );
        window.close();
      </script>
    `);
  }
);



router.get("/me", authenticate, userController.getMe);
//router.post("/login",authenticate,userController.loginWithUsername);
router.post("/verify-complete", optionalAuth,upload.single("clubAvatar"), userController.verifyComplete);
router.get("/by-auth/:uid",    optionalAuth, userController.getByAuthUid); 
router.get("/check-username", optionalAuth, userController.checkUsername); 
router.get("/", authenticate, userController.getAllUsers);
router.get("/:id", authenticate, userController.getUser);
router.put("/:id", authenticate, userController.updateUser);
router.delete("/:id", authenticate, userController.deleteUser);

module.exports = router;
