const {

  verifyCompleteService,
  getAllUsersService,
  getUserService,
  getUserByAuthUidService,
  updateUserService,
  deleteUserService,
} = require("../userServices/userService");
const { admin ,db } = require("../../../Firebase/firebaseBackend");
const { getStorage } = require("firebase-admin/storage");
const { v4: uuidv4 } = require("uuid");
const USERS = db.collection("users");

// NEW: check if a username is available
exports.checkUsername = async (req, res) => {
  try {
    const raw = (req.query.username || "").trim();
    if (!raw) {
      return res.status(400).json({ success: false, message: "Missing username" });
    }

  
    const usernameLower = raw.toLowerCase();

    // You’ll implement this in the service (see step 2)
    const { usernameExistsByLower } = require("../userServices/userService");
    const exists = await usernameExistsByLower(usernameLower);

    return res.json({ success: true, available: !exists });
  } catch (e) {
    console.error("checkUsername error:", e);
    return res.status(500).json({ success: false, message: "Internal error" });
  }
};

//AUTH SPRINT2
exports.loginWithUsername = async (req, res) => {
  try {
    let { username, password } = req.body || {};
    username = String(username || "").trim();
    password = String(password || "");

    if (!username || !password) {
      return res.status(400).json({ success: false, message: "Username and password required" });
    }

    // 1) Find profile
    const snap = await USERS.where("username_lower", "==", username.toLowerCase()).limit(1).get();
    if (snap.empty) return res.status(404).json({ success: false, message: "Username not found" });

    const doc = snap.docs[0];
    const user = doc.data();

    // 2) Plaintext password check (dev only)
    const ok = typeof user.password === "string" && user.password === password;
    if (!ok) return res.status(401).json({ success: false, message: "Incorrect password" });

    // 3) Require the auth link to already exist (signup should have created it)
    const uid = user.authUid;
    if (!uid) {
      return res.status(409).json({
        success: false,
        message: "Account not fully provisioned (missing auth link). Please contact support or re-complete signup.",
      });
    }

    // 4) Mint a custom token for this existing Auth user
    const customToken = await admin.auth().createCustomToken(uid, { role: user.role });

    return res.json({
      success: true,
      customToken,
      user: {
        id: doc.id,
        role: user.role,
        username: user.username,
        email: user.email,
        avatarUrl: user.avatarUrl || "",
        provider: user.provider || "password",
      },
    });
  } catch (e) {
    console.error("loginWithUsername error:", e);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

exports.getMe = async (req, res) => {
  try {
    const uid = req.user?.uid;          
    if (!uid) return res.status(401).json({ success:false, message:"Unauthorized" });

    const me = await getUserByAuthUidService(uid);
    if (!me) return res.status(404).json({ success:false, message:"Profile not found" });

    return res.json({ success:true, user: me });
  } catch (e) {
    console.error("getMe error:", e);
    return res.status(500).json({ success:false, message:"Internal error" });
  }
}; 

exports.getByAuthUid = async (req, res) => {
  try {
    const uid = req.params.uid;
    if (!uid) return res.status(400).json({ success:false, message:"Missing uid" });

    const user = await getUserByAuthUidService(uid);
    if (!user) return res.status(404).json({ success:false, message:"Not found" });

    
    const { id, role, username, email, gamerEmail, clubEmail } = user;
    return res.json({ success:true, user: { id, role, username, email, gamerEmail, clubEmail } });
  } catch (e) {
    console.error("getByAuthUid error:", e);
    return res.status(500).json({ success:false, message:"Internal error" });
  }
};



exports.verifyComplete = async (req, res) => {
  try {
   
    const file = req.file;

   
    let { payload, email } = req.body || {};

    if (!payload && req.body.role) {
      payload = req.body;
    }

    if (email && !payload.email && !payload.gamerEmail && !payload.clubEmail) {
      payload = { ...payload, email };
    }

    if (req.user?.uid && !payload.authUid) {
      payload = { ...payload, authUid: req.user.uid };
    }

    if (file) {
      const bucket = getStorage().bucket(); 
      const fileName = `profileImages/${uuidv4()}_${file.originalname}`;
      const blob = bucket.file(fileName);

      const blobStream = blob.createWriteStream({
        metadata: {
          contentType: file.mimetype,
        },
      });

      await new Promise((resolve, reject) => {
        blobStream.on("error", reject);
        blobStream.on("finish", resolve);
        blobStream.end(file.buffer);
      });

      await blob.makePublic();
      const avatarUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

      payload = { ...payload, avatarUrl };
    }

    const out = await verifyCompleteService(payload);
    return res.status(200).json({ success: true, id: out.id });
  } catch (e) {
    console.error("verifyComplete error:", e);
    const status = e.status || 500;
    return res.status(status).json({
      success: false,
      message: e.message || "Unknown error",
    });
  }
};



exports.getAllUsers = async (_req, res) => {
  try {
    const users = await getAllUsersService();
    return res.json({ success: true, users });
  } catch (e) {
    console.error("getAllUsers error:", e);
    return res
      .status(500)
      .json({ success: false, message: "Internal error" });
  }
};

exports.getUser = async (req, res) => {
  try {
    const user = await getUserService(req.params.id);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "Not found" });
    return res.json({ success: true, user });
  } catch (e) {
    console.error("getUser error:", e);
    return res
      .status(500)
      .json({ success: false, message: "Internal error" });
  }
};

exports.updateUser = async (req, res) => {
  try {
 

    const result = await updateUserService(req.params.id, req.body || {});
    return res.json({ success: true, id: result.id });
  } catch (e) {
    console.error("updateUser error:", e);
    return res
      .status(500)
      .json({ success: false, message: "Internal error" });
  }
};

exports.deleteUser = async (req, res) => {
  try {


    const result = await deleteUserService(req.params.id);
    return res.json({ success: true, id: result.id });
  } catch (e) {
    console.error("deleteUser error:", e);
    return res
      .status(500)
      .json({ success: false, message: "Internal error" });
  }
};

exports.twitchAuthCallback = async (req, res) => {
  const user = req.user;

  res.redirect(
    `http://localhost:3000/twitch-success?user=${encodeURIComponent(JSON.stringify(user))}`
  );
};

