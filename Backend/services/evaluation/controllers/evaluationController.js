const { processRocketLeagueEvaluations, evaluateOverwatch,evaluateCodScrimService ,   getAcceptedGamersService } = require("../evaluationServices");

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


//CoD
async function evaluateScrim(req, res) {
  try {
    const { clubId, slotId } = req.params;
    const { evaluations } = req.body;

    const result = await evaluateCodScrimService(
      clubId,
      slotId,
      evaluations
    );

    return res.status(200).json({
      message: "Scrim evaluated successfully",
      clubId,
      slotId,
      ...result,
    });
  } catch (err) {
    console.error("[evaluateScrim] error:", err);
    return res.status(500).json({
      message: "Internal server error while evaluating scrim",
      error: err && err.message ? err.message : String(err),
    });
  }
}


async function getAcceptedGamers(req, res) {
  try {
    const { clubId, slotId } = req.params;

    const gamers = await getAcceptedGamersService(clubId, slotId);

    return res.status(200).json({
      clubId,
      slotId,
      count: gamers.length,
      gamers,
    });
  } catch (err) {
    console.error("[getAcceptedGamers] error:", err);
    return res.status(500).json({
      message: "Internal server error while fetching accepted gamers",
      error: err && err.message ? err.message : String(err),
    });
  }
}



module.exports = { evaluateOverwatch2, evaluateRocketLeague, evaluateScrim,
  getAcceptedGamers, };