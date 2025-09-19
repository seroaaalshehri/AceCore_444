const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const authenticate = require("../../../middlewares/auth");

// add  authenticatein fields after testinf routes end
router.post("/", userController.createUser);
router.get("/", userController.getAllUsers);
router.get("/:id", userController.getUser);
router.put("/:id", userController.updateUser);
router.delete("/:id", userController.deleteUser);

module.exports = router;
