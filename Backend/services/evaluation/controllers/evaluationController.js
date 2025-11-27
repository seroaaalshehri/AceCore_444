const { processRocketLeagueEvaluations, evaluateOverwatch, } = require("../evaluationServices");

async function evaluateRocketLeague(req, res) {
  try {
    const { clubId, slotId, evaluations } = req.body;

    if (!clubId || !slotId || !Array.isArray(evaluations)) {
      return res.status(400).json({ error: "Invalid request body" });
    }

    await processRocketLeagueEvaluations(clubId, slotId, evaluations);

    res.json({ success: true, message: "Evaluations saved" });
  } catch (err) {
    console.error("Evaluation error:", err);
    res.status(500).json({ error: err.message });
  }
}

async function evaluateOverwatch2(req, res) {
  try {
    const result = await evaluateOverwatch(req.body);
    res.json(result);
  } catch (e) {
    console.error("[evaluateOverwatch]", e);
    res
      .status(500)
      .json({ success: false, error: e.message || "server_error" });
  }
}

module.exports = { evaluateOverwatch2, evaluateRocketLeague };