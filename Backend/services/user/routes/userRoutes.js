const express = require("express"); 
const router = express.Router();
const userController = require("../controllers/userController");
const authenticate = require("../../../middlewares/auth");


const optionalAuth = (req, _res, next) => next();

router.get("/me", authenticate, userController.getMe);
router.post("/verify-complete", optionalAuth, userController.verifyComplete);
router.get("/by-auth/:uid",    optionalAuth, userController.getByAuthUid); 
//router.post("/", optionalAuth, userController.createUser);
router.get("/", authenticate, userController.getAllUsers);
router.get("/:id", authenticate, userController.getUser);
router.put("/:id", authenticate, userController.updateUser);
router.delete("/:id", authenticate, userController.deleteUser);

module.exports = router;
