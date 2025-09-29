const {

  verifyCompleteService,
  //createUserService,
  getAllUsersService,
  getUserService,
  getUserByAuthUidService,
  updateUserService,
  deleteUserService,
} = require("../userServices/userService");
/**
 * POST /api/users/verify-complete
 * Creates the profile after auth is complete (Google OAuth or email-verified flow).
 * Expects { payload } in body. If you also send { email }, we’ll fold it in.
 */

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

    // Be lenient: if caller sent email separately, merge it.
    if (email && !payload.email && !payload.gamerEmail && !payload.clubEmail) {
      payload = { ...payload, email };
    }

    // If your auth middleware adds req.user.uid (Firebase ID token),
    // pass it along as a hint (service will still validate uniqueness).
    if (req.user?.uid && !payload.authUid) {
      payload = { ...payload, authUid: req.user.uid };
    }

    const out = await verifyCompleteService(payload);
    return res.status(200).json({ success: true, id: out.id });
  } catch (e) {
    console.error("verifyComplete error:", e);
    return res
      .status(e.status || 500)
      .json({ success: false, message: e.message || "Internal error" });
  }
};

/**
 * POST /api/users
 * Legacy direct create. Keeps sequential userN ids, runs uniqueness checks.
 * Safe to keep during transition; for new signups prefer /verify-complete.
 */
exports.createUser = async (req, res) => {
  try {
    let payload = req.body || {};

    // If auth middleware is present, attach authUid
    if (req.user?.uid && !payload.authUid) {
      payload = { ...payload, authUid: req.user.uid };
    }

    const result = await createUserService(payload);
    return res.status(201).json({ success: true, id: result.id });
  } catch (e) {
    console.error("createUser error:", e);
    return res
      .status(e.status || 500)
      .json({ success: false, message: e.message || "Internal error" });
  }
};

/**
 * GET /api/users
 */
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

/**
 * GET /api/users/:id
 */
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

/**
 * PUT /api/users/:id
 * If you have auth middleware and want to enforce ownership, uncomment the guard below.
 */
exports.updateUser = async (req, res) => {
  try {
    // Ownership guard (optional)
    // if (req.user?.uid) {
    //   const me = await getUserByAuthUidService(req.user.uid);
    //   if (!me || me.id !== req.params.id) {
    //     return res.status(403).json({ success: false, message: "Forbidden" });
    //   }
    // }

    const result = await updateUserService(req.params.id, req.body || {});
    return res.json({ success: true, id: result.id });
  } catch (e) {
    console.error("updateUser error:", e);
    return res
      .status(500)
      .json({ success: false, message: "Internal error" });
  }
};

/**
 * DELETE /api/users/:id
 * If you have auth middleware and want to enforce ownership, uncomment the guard below.
 */
exports.deleteUser = async (req, res) => {
  try {
    // Ownership guard (optional)
    // if (req.user?.uid) {
    //   const me = await getUserByAuthUidService(req.user.uid);
    //   if (!me || me.id !== req.params.id) {
    //     return res.status(403).json({ success: false, message: "Forbidden" });
    //   }
    // }

    const result = await deleteUserService(req.params.id);
    return res.json({ success: true, id: result.id });
  } catch (e) {
    console.error("deleteUser error:", e);
    return res
      .status(500)
      .json({ success: false, message: "Internal error" });
  }
};
