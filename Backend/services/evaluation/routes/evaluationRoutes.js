const express = require("express");
const router = express.Router();
const authenticate = require("../../../middlewares/auth");
const { buildRequireOwner } = require("../../../middlewares/requireOwner");
const { getUserByAuthUidService } = require("../../user/userServices/userService");
const requireOwner = buildRequireOwner(getUserByAuthUidService);

const { evaluateRocketLeague, evaluateOverwatch2, evaluateScrim,
  getAcceptedGamers, } = require("../controllers/evaluationController");

router.post(
  "/overwatch",
  evaluateOverwatch2
);
router.post("/rocket-league", evaluateRocketLeague);

//CoD

router.post(
  "/:clubId/slot/:slotId",
  authenticate,
  requireOwner,
 evaluateScrim
);


router.get(
  "/:clubId/slot/:slotId",
  authenticate,
  requireOwner,                 
  getAcceptedGamers
);


module.exports = router;
