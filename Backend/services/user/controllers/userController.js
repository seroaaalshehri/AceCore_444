const userService = require("../userServices/userService");
const { success, error } = require("../../../utils/response");

// ✅ Create
exports.createUser = async (req, res) => {
  try {
    const user = await userService.createUser(req.body);
    success(res, user, 201);
  } catch (err) {
    error(res, "Failed to create user", 500);
  }
};

// ✅ Get by ID
exports.getUser = async (req, res) => {
  try {
    const user = await userService.getUser(req.params.id);
    if (!user) return error(res, "User not found", 404);
    success(res, user);
  } catch (err) {
    error(res, "Something went wrong while fetching user", 500);
  }
};

// ✅ Get All
exports.getAllUsers = async (req, res) => {
  try {
    const users = await userService.getAllUsers();
    if (!users || users.length === 0) return error(res, "No users found", 404);
    success(res, users);
  } catch (err) {
    error(res, "Something went wrong while fetching users", 500);
  }
};

// ✅ Update
exports.updateUser = async (req, res) => {
  try {
    const updatedUser = await userService.updateUser(req.params.id, req.body);
    if (!updatedUser) return error(res, "User not found", 404);
    success(res, updatedUser);
  } catch (err) {
    error(res, "Failed to update user", 500);
  }
};

// ✅ Delete
exports.deleteUser = async (req, res) => {
  try {
    const result = await userService.deleteUser(req.params.id);
    if (!result) return error(res, "User not found", 404);
    success(res, result);
  } catch (err) {
    error(res, "Failed to delete user", 500);
  }
};
