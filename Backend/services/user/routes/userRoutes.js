const express = require("express"); 
const router = express.Router();
const userController = require("../controllers/userController");
const authenticate = require("../../../middlewares/auth");

router.post("/verify-complete", userController.verifyComplete);

router.post("/", userController.createUser);
router.get("/", userController.getAllUsers);
router.get("/:id", userController.getUser);
router.put("/:id", authenticate, userController.updateUser);
router.delete("/:id", authenticate, userController.deleteUser);

module.exports = router;
