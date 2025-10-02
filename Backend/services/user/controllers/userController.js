const {

  verifyCompleteService,
  getAllUsersService,
  getUserService,
  getUserByAuthUidService,
  updateUserService,
  deleteUserService,
} = require("../userServices/userService");
const { db } = require("../../../Firebase/firebaseBackend");
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

{/*
For sprint2

  exports.loginWithUsername = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: "Username and password required" });
    }

    const userSnap = await USERS.where("username", "==", username).limit(1).get();
    if (userSnap.empty) {
      return res.status(404).json({ message: "Username not found" });
    }

    const user = userSnap.docs[0].data();
    const userId = userSnap.docs[0].id;

    if (user.password !== password) {
      return res.status(401).json({ message: "Incorrect password" });
    }


    return res.json({
      user: {
        id: userId,
        username: user.username,
        role: user.role,
        avatarUrl: user.avatarUrl || "",
        email: user.email,
        provider: user.provider,
        authUid: user.authUid,
        clubName: user.clubName,
        gamerEmail: user.gamerEmail,
        clubEmail: user.clubEmail,
        country: user.country,
      },
    });

  } catch (e) {
    console.error("loginWithUsername error:", e);
    return res.status(500).json({ message: "Internal server error" });
  }
};
*/}

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

