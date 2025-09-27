
const {
  createUserService,
  getAllUsersService,
  getUserService,
  updateUserService,
  deleteUserService,
  finalizeVerifiedUserService,
} = require("../userServices/userService");



exports.verifyComplete = async (req, res) => {
  try {
    const { email, payload } = req.body || {};
    if (!email || !payload) {
      return res.status(400).json({ success: false, message: " Try to signUp again the info not saved" });
    }
    const out = await finalizeVerifiedUserService(email, payload);
    return res.status(200).json({ success: true, id: out.id });
  } catch (e) {
    console.error("verifyComplete error:", e);
    return res
      .status(e.status || 500)
      .json({ success: false, message: e.message || "Internal error" });
  }
};

    // 3) Create your app user (sequential id) and map to Firebase UID
    //    - No extra uniqueness checks here; your service already does them.
    const data = {
      ...(payload || {}),
      email: userRecord.email,
      role: (payload && payload.role) || "gamer",
      authUid: userRecord.uid, // mapping to Firebase Auth UID
    };

    const created = await createUserService(data);
    return res.status(201).json({ success: true, id: created.id });
  } catch (e) {
 
    if (e?.status === 409) {
      return res.status(200).json({ success: true, message: "Already exists" });
    }
    console.error("verifyComplete error:", e);
    return res
      .status(e.status || 500)
      .json({ success: false, message: e.message || "Internal error" });
  }
};

const isGmail = (email) => {
  if (typeof email !== "string") return false;
  const parts = email.trim().toLowerCase().split("@");
  return parts.length === 2 && parts[1] === "gmail.com";
};
exports.createUser = async (req, res) => {
  try {
    const result = await createUserService(req.body || {});
    return res.status(201).json({ success: true, id: result.id });
  } catch (e) {
    console.error("createUser error:", e);
    return res
      .status(e.status || 500)
      .json({ success: false, message: e.message || "Internal error" });
  }
};

exports.getAllUsers = async (_req, res) => {
  try {
    const users = await getAllUsersService();
    return res.json({ success: true, users });
  } catch (e) {
    console.error("getAllUsers error:", e);
    return res.status(500).json({ success: false, message: "Internal error" });
  }
};

exports.getUser = async (req, res) => {
  try {
    const user = await getUserService(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "Not found" });
    return res.json({ success: true, user });
  } catch (e) {
    console.error("getUser error:", e);
    return res.status(500).json({ success: false, message: "Internal error" });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const result = await updateUserService(req.params.id, req.body || {});
    return res.json({ success: true, id: result.id });
  } catch (e) {
    console.error("updateUser error:", e);
    return res.status(500).json({ success: false, message: "Internal error" });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const result = await deleteUserService(req.params.id);
    return res.json({ success: true, id: result.id });
  } catch (e) {
    console.error("deleteUser error:", e);
    return res.status(500).json({ success: false, message: "Internal error" });
  }
};
