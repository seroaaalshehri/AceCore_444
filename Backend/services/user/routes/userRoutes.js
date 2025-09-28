const express = require("express"); 
const router = express.Router();
const userController = require("../controllers/userController");
const authenticate = require("../../../middlewares/auth");


const optionalAuth = (req, _res, next) => next();

router.get("/me", authenticate, userController.getMe); 
router.post("/verify-complete", optionalAuth, userController.verifyComplete);

router.post("/", optionalAuth, userController.createUser);
router.get("/", optionalAuth, userController.getAllUsers);
router.get("/:id", optionalAuth, userController.getUser);
router.put("/:id", optionalAuth, userController.updateUser);
router.delete("/:id", optionalAuth, userController.deleteUser);

module.exports = router;
