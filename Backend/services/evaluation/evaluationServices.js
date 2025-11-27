const { db, admin } = require("../../Firebase/firebaseBackend");

function normalize(x, t) {
  x = Number(x) || 0;
  return Math.min(x / t, 1);
}

function letterFromRank(rank) {
  if (rank >= 90) return "S";
  if (rank >= 80) return "A";
  if (rank >= 70) return "B";
  if (rank >= 60) return "C";
  if (rank >= 45) return "D";
  return "E";
}

async function updateUserGame(userid, finalScore) {
  const colRef = db.collection("userGames");

  const q = await colRef
    .where("userid", "==", userid)
    .where("gameid", "==", "rl")
    .limit(1)
    .get();

  let docRef;
  let oldRank = 0;
  let oldCount = 0;

  if (!q.empty) {
    const doc = q.docs[0];
    docRef = doc.ref;

    const data = doc.data();
    oldRank = data.rank || 0;
    oldCount = data.scrimCount || 0;

  } else {
    docRef = colRef.doc();
  }

  const newCount = oldCount + 1;
  const newRank =
    oldCount === 0
      ? finalScore
      : (oldRank * oldCount + finalScore) / newCount;

  const letter = letterFromRank(newRank);

  await docRef.set(
    {
      userid,
      gameid: "rl",
      rank: newRank,
      score: letter,
      scrimCount: newCount,
      lastRankUpdate: admin.firestore.Timestamp.now(),
    },
    { merge: true }
  );
}


async function processRocketLeagueEvaluations(clubId, slotId, evaluations) {
  for (const evalData of evaluations) {
    const {
      userid,
      goals,
      assists,
      saves,
      shots,
      fast_kickoff,
      air_dribble,
      flip_reset,
      jump_reset,
      pop_reset,
      double_reset,
      woof_dash,
      ground_freestyle,
      ground_punch,
      musty_flick,
      tornado_spin,
    } = evalData;

    const g = normalize(goals, 3);
    const a = normalize(assists, 2);
    const s = normalize(saves, 3);
    const sh = normalize(shots, 7);

    const avgPerf = (g + a + s + sh) / 4;
    const score60 = avgPerf * 60;

    const skills = [
      Number(fast_kickoff || 0),
      Number(air_dribble || 0),
      Number(flip_reset || 0),
      Number(jump_reset || 0),
      Number(pop_reset || 0),
      Number(double_reset || 0),
      Number(woof_dash || 0),
      Number(ground_freestyle || 0),
      Number(ground_punch || 0),
      Number(musty_flick || 0),
      Number(tornado_spin || 0),
    ];

    const sumManual = skills.reduce((a, b) => a + b, 0);
    const avgManual = sumManual / skills.length;
    const score40 = (avgManual / 5) * 40;

    const finalScore = score60 + score40;

    await updateUserGame(userid, finalScore);
  }
    const slotRef = db
    .collection("users")
    .doc(String(clubId))
    .collection("schedule")
    .doc(String(slotId));

  await slotRef.set(
    {
      evaluationCompleted: true,
    },
    { merge: true }
  );
}

const ROLE_TARGETS = {
  DPS: {
    eliminations: 25,
    damageDone: 9000,
    healingDone: 500,
    damageMitigated: 1000,
    deathsMin: 0,
    deathsMax: 8,
  },
  Tank: {
    eliminations: 18,
    damageDone: 8000,
    healingDone: 500,
    damageMitigated: 10000,
    deathsMin: 0,
    deathsMax: 10,
  },
  Support: {
    eliminations: 15,
    damageDone: 6000,
    healingDone: 10000,
    damageMitigated: 1000,
    deathsMin: 0,
    deathsMax: 7,
  },
};

function clamp01(x) {
  if (x < 0) return 0;
  if (x > 1) return 1;
  return x;
}

function normPositiveStat(value, target) {
  if (!target || !isFinite(target)) return 0;
  return clamp01(value / target);
}


function normDeaths(deaths, dmin, dmax) {
  const range = dmax - dmin;
  if (range <= 0) return 0;
  return clamp01((dmax - deaths) / range);
}


function computeManual40(skills) {
  const values = Object.values(skills || {}).map(Number);
  if (!values.length) return 0;

  const sum = values.reduce((a, v) => a + (isFinite(v) ? v : 0), 0);
  const avg = sum / 9; 
  return (avg / 5) * 40; 
}


function computeStats60(role, stats) {
  const cfg = ROLE_TARGETS[role];
  if (!cfg) return 0;

  const E = Number(stats.eliminations || 0);
  const DMG = Number(stats.damageDone || 0);
  const H = Number(stats.healingDone || 0);
  const MIT = Number(stats.damageMitigated || 0);
  const D = Number(stats.deaths || 0);

  const sE = normPositiveStat(E, cfg.eliminations);
  const sDMG = normPositiveStat(DMG, cfg.damageDone);
  const sH = normPositiveStat(H, cfg.healingDone);
  const sMIT = normPositiveStat(MIT, cfg.damageMitigated);
  const sD = normDeaths(D, cfg.deathsMin, cfg.deathsMax);

  const avgStats = (sE + sDMG + sH + sMIT + sD) / 5;
  return avgStats * 60; 
}

function scoreToLetter(score) {
  if (score >= 90) return "S";
  if (score >= 80) return "A";
  if (score >= 70) return "B";
  if (score >= 60) return "C";
  return "D";
}

async function evaluateOverwatch(payload) {
  const { userId, username, role, stats, skills, clubId, slotId } = payload;

  if (!userId) throw new Error("Missing userId");
  if (!role) throw new Error("Missing role");
  if (!clubId || !slotId) throw new Error("Missing clubId or slotId");

  const slotRef = db
    .collection("users")
    .doc(String(clubId))
    .collection("schedule")
    .doc(String(slotId));

  const slotSnap = await slotRef.get();
  if (!slotSnap.exists) throw new Error("Schedule slot not found");

  const slotData = slotSnap.data() || {};
  const gameIdFromSlot = slotData.gameid || slotData.gameId;

  if (!gameIdFromSlot)
    throw new Error("Schedule slot missing gameid — cannot evaluate");

  const effectiveGameId = gameIdFromSlot; 


  const score40 = computeManual40(skills);
  const score60 = computeStats60(role, stats);
  const scrimScore = score40 + score60; 


  const userGamesRef = db.collection("userGames");

  const querySnap = await userGamesRef
    .where("userid", "==", userId)
    .where("gameid", "==", effectiveGameId)
    .limit(1)
    .get();

  let docRef;
  let existing = null;

  if (!querySnap.empty) {
    docRef = querySnap.docs[0].ref;
    existing = querySnap.docs[0].data();
  } else {
    docRef = userGamesRef.doc();
  }

  const prevCount =
    existing && typeof existing.scrimCount === "number"
      ? existing.scrimCount
      : 0;

  const prevRank =
    existing && typeof existing.rank === "number" ? existing.rank : 0;

  const newCount = prevCount + 1;

  const newOverall =
    newCount > 0
      ? (prevRank * prevCount + scrimScore) / newCount
      : scrimScore;

  const letterScore = scoreToLetter(newOverall);

  const updateData = {
    gameid: existing?.gameid || effectiveGameId,
    userid: existing?.userid || userId,
    username: existing?.username || username,
    scrimCount: newCount,
    rank: newOverall,
    score: letterScore,
    lastRankUpdate: new Date(),
  };

  await docRef.set(updateData, { merge: true });

  await slotRef.set(
    {
      evaluationCompleted: true,
    },
    { merge: true }
  );

  return {
    success: true,
    data: {
      scrimScore,
      overallRank: newOverall,
      letterScore,
      scrimCount: newCount,
    },
  };
}

module.exports = { processRocketLeagueEvaluations, evaluateOverwatch, };
