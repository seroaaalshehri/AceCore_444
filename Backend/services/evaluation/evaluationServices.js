/**
 * evaluationServices.js
 *
 * This file contains the backend evaluation logic for AceCore scrims.
 * It handles the three supported games:
 * - Rocket League
 * - Overwatch
 * - Call of Duty
 *
 * Main responsibilities:
 * 1. Calculate each gamer’s score based on the selected game.
 * 2. Update the gamer’s stored rank, score letter, and scrim count in userGames.
 * 3. Mark the related schedule slot as evaluated after evaluation is completed.
 *
 * Refactoring summary:
 * The scoring formulas for the three games were kept unchanged.
 * Only repeated helper logic was extracted into shared methods to reduce
 * duplication and improve readability and maintainability.
 */

const { db, admin } = require("../../Firebase/firebaseBackend");

/* =========================
   Shared helpers
========================= */

// normalize a value against a target and cap it at 1
function normalize(x, t) {
  x = Number(x) || 0;
  return Math.min(x / t, 1);
}

// convert numeric score/rank into a letter grade
function scoreToLetter(value) {
  if (value >= 90) return "S";
  if (value >= 80) return "A";
  if (value >= 70) return "B";
  if (value >= 60) return "C";
  if (value >= 45) return "D";
  return "E";
}

// calculate the updated overall rank after a new scrim score
function computeUpdatedRank(prevRank, prevCount, newScore) {
  const newCount = prevCount + 1;
  const newRank =
    prevCount === 0
      ? newScore
      : (prevRank * prevCount + newScore) / newCount;

  return { newCount, newRank };
}

// return the Firestore reference for a club schedule slot
function getScheduleRef(clubId, slotId) {
  return db
    .collection("users")
    .doc(String(clubId))
    .collection("schedule")
    .doc(String(slotId));
}

// mark a schedule slot as evaluated
async function markEvaluationCompleted(clubId, slotId, extraData = {}) {
  const slotRef = getScheduleRef(clubId, slotId);

  await slotRef.set(
    {
      evaluationCompleted: true,
      ...extraData,
    },
    { merge: true }
  );
}

// find the userGames document for a given user and game
async function findUserGame(userid, gameid) {
  const userGamesRef = db.collection("userGames");

  const querySnap = await userGamesRef
    .where("userid", "==", userid)
    .where("gameid", "==", gameid)
    .limit(1)
    .get();

  if (!querySnap.empty) {
    return {
      docRef: querySnap.docs[0].ref,
      existing: querySnap.docs[0].data(),
    };
  }

  return {
    docRef: userGamesRef.doc(),
    existing: null,
  };
}

/* =========================
   Rocket League
========================= */

// calculate Rocket League final score for one gamer
function computeRocketLeagueScore(evalData) {
  const {
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

  // match statistics section
  const g = normalize(goals, 3);
  const a = normalize(assists, 2);
  const s = normalize(saves, 3);
  const sh = normalize(shots, 7);

  const avgPerf = (g + a + s + sh) / 4;
  const score60 = avgPerf * 60;

  // manual skill ratings section
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

  return score60 + score40;
}

// update the Rocket League userGames record after evaluation
async function updateUserGame(userid, finalScore) {
  const { docRef, existing } = await findUserGame(userid, "rl");

  const oldRank = existing?.rank || 0;
  const oldCount = existing?.scrimCount || 0;

  const { newCount, newRank } = computeUpdatedRank(
    oldRank,
    oldCount,
    finalScore
  );

  const letter = scoreToLetter(newRank);

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

// main Rocket League evaluation flow
async function processRocketLeagueEvaluations(clubId, slotId, evaluations) {
  for (const evalData of evaluations) {
    const finalScore = computeRocketLeagueScore(evalData);
    await updateUserGame(evalData.userid, finalScore);
  }

  await markEvaluationCompleted(clubId, slotId);
}

/* =========================
   Overwatch
========================= */

// role-based target values used in normalization
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

// normalize positive stats such as damage or healing
function normPositiveStat(value, target) {
  if (!target || !isFinite(target)) return 0;
  return clamp01(value / target);
}

// normalize deaths so lower deaths produce a better value
function normDeaths(deaths, dmin, dmax) {
  const range = dmax - dmin;
  if (range <= 0) return 0;
  return clamp01((dmax - deaths) / range);
}

// compute the manual ratings section out of 40
function computeManual40(skills) {
  const values = Object.values(skills || {}).map(Number);
  if (!values.length) return 0;

  const sum = values.reduce((a, v) => a + (isFinite(v) ? v : 0), 0);
  const avg = sum / 9;
  return (avg / 5) * 40;
}

// compute the statistics section out of 60 depending on role
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

// combine Overwatch manual and statistics parts
function computeOverwatchScrimScore(role, stats, skills) {
  return computeManual40(skills) + computeStats60(role, stats);
}

// main Overwatch evaluation flow
async function evaluateOverwatch(payload) {
  const { userId, username, role, stats, skills, clubId, slotId } = payload;

  // validate required fields
  if (!userId) throw new Error("Missing userId");
  if (!role) throw new Error("Missing role");
  if (!clubId || !slotId) throw new Error("Missing clubId or slotId");

  // load schedule slot
  const slotRef = getScheduleRef(clubId, slotId);
  const slotSnap = await slotRef.get();
  if (!slotSnap.exists) throw new Error("Schedule slot not found");

  const slotData = slotSnap.data() || {};
  const effectiveGameId = slotData.gameid || slotData.gameId;

  if (!effectiveGameId) {
    throw new Error("Schedule slot missing gameid — cannot evaluate");
  }

  // compute the current scrim score
  const scrimScore = computeOverwatchScrimScore(role, stats, skills);

  // find existing userGames record or prepare a new one
  const { docRef, existing } = await findUserGame(userId, effectiveGameId);

  const prevCount =
    existing && typeof existing.scrimCount === "number"
      ? existing.scrimCount
      : 0;

  const prevRank =
    existing && typeof existing.rank === "number" ? existing.rank : 0;

  const { newCount, newRank } = computeUpdatedRank(
    prevRank,
    prevCount,
    scrimScore
  );

  const letterScore = scoreToLetter(newRank);

  const updateData = {
    gameid: existing?.gameid || effectiveGameId,
    userid: existing?.userid || userId,
    username: existing?.username || username,
    scrimCount: newCount,
    rank: newRank,
    score: letterScore,
    lastRankUpdate: new Date(),
  };

  // save updated rank information
  await docRef.set(updateData, { merge: true });

  // mark the schedule as evaluated
  await markEvaluationCompleted(clubId, slotId);

  return {
    success: true,
    data: {
      scrimScore,
      overallRank: newRank,
      letterScore,
      scrimCount: newCount,
    },
  };
}

/* =========================
   Call of Duty
========================= */

const ED_CAP = 4.0;

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

// clamp manual rating into range 0 to 5
function normRating(r) {
  if (typeof r !== "number") r = 0;
  return clamp(r, 0, 5);
}

// compute detailed CoD scores for all submitted gamers
function computeCodScores(evaluations) {
  if (!Array.isArray(evaluations) || evaluations.length === 0) return [];

  const maxElims = Math.max(
    ...evaluations.map((e) => Number(e.kills || 0)),
    0
  );
  const maxObjective = Math.max(
    ...evaluations.map((e) => Number(e.objectiveValue || 0)),
    0
  );

  return evaluations.map((e) => {
    const userId = e.userId;
    const eliminations = Number(e.kills || 0);
    const deaths = Number(e.deaths || 0);
    const objectiveValue = Number(e.objectiveValue || 0);
    const result = e.result === "win" ? "win" : "loss";

    const deathsSafe = deaths > 0 ? deaths : 1;
    const edRatioRaw = eliminations / deathsSafe;
    const edRatioNorm = (Math.min(edRatioRaw, ED_CAP) / ED_CAP) * 100;

    const elimVolumeNorm =
      maxElims > 0 ? (eliminations / maxElims) * 100 : 50;

    const objNorm =
      maxObjective > 0 ? (objectiveValue / maxObjective) * 100 : 50;

    const winNorm = result === "win" ? 100 : 40;

    // statistics part out of 60
    const StatsPart =
      0.30 * objNorm +
      0.18 * edRatioNorm +
      0.08 * elimVolumeNorm +
      0.04 * winNorm;

    // manual club ratings part out of 40
    const ratings = [
      normRating(e.mapAwareness),
      normRating(e.aimControl),
      normRating(e.movementControl),
      normRating(e.soundAwareness),
    ];
    const sumRatings = ratings.reduce((sum, v) => sum + v, 0);
    const avgRating0to5 = ratings.length ? sumRatings / ratings.length : 0;
    const ClubPart = (avgRating0to5 / 5) * 40;

    const finalScore = StatsPart + ClubPart;

    return {
      userId,
      eliminations,
      deaths,
      objectiveValue,
      result,
      edRatioRaw,
      edRatioNorm,
      elimVolumeNorm,
      objNorm,
      winNorm,
      StatsPart,
      ClubPart,
      finalScore,
    };
  });
}

// get accepted gamers for a given CoD scrim
async function getAcceptedGamersService(clubId, scheduleId) {
  const scheduleRef = db
    .collection("users")
    .doc(clubId)
    .collection("schedule")
    .doc(scheduleId);

  const snap = await scheduleRef.collection("gamersAcceptance").get();
  if (snap.empty) return [];

  const usersCol = db.collection("users");

  const acceptedGamers = await Promise.all(
    snap.docs.map(async (doc) => {
      const userId = doc.id;
      const acceptanceData = doc.data() || {};

      const userDoc = await usersCol.doc(userId).get();
      const userData = userDoc.exists ? userDoc.data() || {} : {};

      const username =
        userData.username ||
        userData.gamerUsername ||
        null;

      return {
        userId,
        ...acceptanceData,
        username,
        firstName: userData.firstName || "",
        lastName: userData.lastName || "",
        profilePhoto: userData.profilePhoto || null,
      };
    })
  );

  return acceptedGamers;
}

// main Call of Duty evaluation flow
async function evaluateCodScrimService(clubId, scheduleId, rawEvaluations) {
  const scheduleRef = getScheduleRef(clubId, scheduleId);
  const scheduleSnap = await scheduleRef.get();

  if (!scheduleSnap.exists) {
    throw new Error("Schedule document not found for this scrim");
  }

  const scheduleData = scheduleSnap.data() || {};
  const gameid = scheduleData.gameid || "cod";

  // only accepted gamers should be evaluated
  const acceptedGamers = await getAcceptedGamersService(clubId, scheduleId);
  const acceptedIds = new Set(acceptedGamers.map((g) => g.userId));

  if (acceptedIds.size === 0) {
    return { evaluations: [], message: "No accepted gamers for this scrim" };
  }

  const filtered = (rawEvaluations || []).filter((e) =>
    acceptedIds.has(e.userId)
  );

  if (filtered.length === 0) {
    return {
      evaluations: [],
      message: "No matching evaluations for accepted gamers",
    };
  }

  // calculate scores for the filtered gamers
  const computed = computeCodScores(filtered);
  const finalWithOverall = [];

  // use transaction to keep updates consistent
  await db.runTransaction(async (t) => {
    const userGameDocsByUserId = new Map();

    // first load the related userGames documents
    for (const ev of computed) {
      const ugQuery = db
        .collection("userGames")
        .where("userid", "==", ev.userId)
        .where("gameid", "==", gameid)
        .limit(1);

      const ugSnap = await t.get(ugQuery);

      if (ugSnap.empty) {
        throw new Error(
          `userGames doc not found for user ${ev.userId} and game ${gameid}`
        );
      }

      const doc = ugSnap.docs[0];
      userGameDocsByUserId.set(ev.userId, {
        ref: doc.ref,
        data: doc.data() || {},
      });
    }

    // then update each gamer’s overall rank
    for (const ev of computed) {
      const entry = userGameDocsByUserId.get(ev.userId);
      if (!entry) {
        throw new Error(
          `Missing userGames snapshot for user ${ev.userId} (this should not happen)`
        );
      }

      const { ref: userGameRef, data } = entry;

      const prevScore =
        typeof data.rank === "number" ? data.rank : 0;
      const prevCount =
        typeof data.scrimCount === "number" ? data.scrimCount : 0;

      const { newCount: newScrimCount, newRank: newOverallScore } =
        computeUpdatedRank(prevScore, prevCount, ev.finalScore);

      const letterGrade = scoreToLetter(newOverallScore);

      t.set(
        userGameRef,
        {
          userid: ev.userId,
          gameid,
          rank: newOverallScore,
          score: letterGrade,
          scrimCount: newScrimCount,
          lastRankUpdate: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      finalWithOverall.push({
        ...ev,
        newOverallScore,
        newScrimCount,
        letterGrade,
      });
    }

    // mark schedule as evaluated and save evaluation time
    t.set(
      scheduleRef,
      {
        evaluationCompleted: true,
        evaluatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  });

  return {
    evaluations: finalWithOverall,
  };
}

module.exports = {
  processRocketLeagueEvaluations,
  evaluateOverwatch,
  evaluateCodScrimService,
  getAcceptedGamersService,
};