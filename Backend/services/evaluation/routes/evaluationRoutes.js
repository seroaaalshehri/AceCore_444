const express = require("express");
const router = express.Router();
const { evaluateRocketLeague, evaluateOverwatch2 } = require("../controllers/evaluationController");

router.post(
  "/overwatch",
  evaluateOverwatch2
);
router.post("/rocket-league", evaluateRocketLeague);

module.exports = router;
