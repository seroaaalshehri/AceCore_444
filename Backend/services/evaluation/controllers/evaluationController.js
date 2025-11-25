const { processRocketLeagueEvaluations } = require("../evaluationServices");

exports.evaluateRocketLeague = async (req, res) => {
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
};
