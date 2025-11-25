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

module.exports = { processRocketLeagueEvaluations };
