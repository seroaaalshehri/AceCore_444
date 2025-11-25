const express = require("express");
const router = express.Router();
const { evaluateRocketLeague } = require("../controllers/evaluationController");

router.post("/rocket-league", evaluateRocketLeague);

module.exports = router;
