
const {
  createUserService,
  getAllUsersService,
  getUserService,
  updateUserService,
  deleteUserService,
} = require("../userServices/userService");

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
