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
  if (score >= 45) return "D";
  return "E";
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

//CoD Algorithm:

const ED_CAP = 4.0;


function scoreToLetterCoD(score) {
  if (score >= 90) return "S";
  if (score >= 80) return "A";
  if (score >= 70) return "B";
  if (score >= 60) return "C";
  if (score >= 45) return "D";
   return "E"
}

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

function normRating(r) {
  if (typeof r !== "number") r = 0;
  return clamp(r, 0, 5);
}


function computeCodScores(evaluations) {
  if (!Array.isArray(evaluations) || evaluations.length === 0) return [];

  // For normalization across this scrim
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

    // E/D efficiency (eliminations per death)
    const deathsSafe = deaths > 0 ? deaths : 1;
    const edRatioRaw = eliminations / deathsSafe;
    const edRatioNorm = (Math.min(edRatioRaw, ED_CAP) / ED_CAP) * 100; 

    // Elimination volume (relative to top eliminations in this scrim)
    const elimVolumeNorm =
      maxElims > 0 ? (eliminations / maxElims) * 100 : 50; 

    // Objective contribution
    const objNorm =
      maxObjective > 0 ? (objectiveValue / maxObjective) * 100 : 50; 

    const winNorm = result === "win" ? 100 : 40;

    // StatsPart (0–60):
  
    const StatsPart =
      0.30 * objNorm +
      0.18 * edRatioNorm +
      0.08 * elimVolumeNorm +
      0.04 * winNorm;

    // Club subjective ratings (0–40)
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


async function evaluateCodScrimService(clubId, scheduleId, rawEvaluations) {
  const scheduleRef = db
    .collection("users")
    .doc(clubId)
    .collection("schedule")
    .doc(scheduleId);

  const scheduleSnap = await scheduleRef.get();
  if (!scheduleSnap.exists) {
    throw new Error("Schedule document not found for this scrim");
  }

  const scheduleData = scheduleSnap.data() || {};
  const gameid = scheduleData.gameid || "cod";

  
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

  const computed = computeCodScores(filtered);
  const finalWithOverall = [];

  await db.runTransaction(async (t) => {
    const userGameDocsByUserId = new Map();

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

      const newScrimCount = prevCount + 1;
      const newOverallScore =
        (prevScore * prevCount + ev.finalScore) / newScrimCount;
      const letterGrade = scoreToLetterCoD(newOverallScore);

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



module.exports = { processRocketLeagueEvaluations, evaluateOverwatch, evaluateCodScrimService,
  getAcceptedGamersService, };