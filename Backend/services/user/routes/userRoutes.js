const express = require("express"); 
const router = express.Router();
const userController = require("../controllers/userController");



const optionalAuth = (req, _res, next) => next();

router.post("/verify-complete", optionalAuth, userController.verifyComplete);
router.get("/by-auth/:uid",    optionalAuth, userController.getByAuthUid); 
router.post("/", optionalAuth, userController.createUser);
router.get("/", optionalAuth, userController.getAllUsers);
router.get("/:id", optionalAuth, userController.getUser);
router.put("/:id", optionalAuth, userController.updateUser);
router.delete("/:id", optionalAuth, userController.deleteUser);

module.exports = router;
