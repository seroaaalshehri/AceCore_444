const {

  verifyCompleteService,
  getAllUsersService,
  getUserService,
  getUserByAuthUidService,
  updateUserService,
  deleteUserService,
} = require("../userServices/userService");


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

//Maybe will be removed-Roaa-:
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
    let { payload, email } = req.body || {};
    if (!payload) {
      return res
        .status(400)
        .json({ success: false, message: "Missing payload" });
    }

    if (email && !payload.email && !payload.gamerEmail && !payload.clubEmail) {
      payload = { ...payload, email };
    }

    if (req.user?.uid && !payload.authUid) {
      payload = { ...payload, authUid: req.user.uid };
    }

    const out = await verifyCompleteService(payload);
    return res.status(200).json({ success: true, id: out.id });
  } catch (e) {
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



