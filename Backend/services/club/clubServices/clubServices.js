const admin = require("firebase-admin");
const { db } = require("../../../Firebase/firebaseBackend");

//add achievement
async function addUserAchievement(userid, name, association, game, date, reqFile, baseUrl) {
  let fileUrl = null;
  let storagePath = null;

  if (reqFile) {
    storagePath = reqFile.path;
    fileUrl = `${baseUrl}/storage/achievements/${reqFile.filename}`;
  }

  const newAch = {
    name,
    association,
    game,
    date,
    file: fileUrl,
    storagePath,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  const docRef = await db
    .collection("users")
    .doc(userid)
    .collection("achievements")
    .add(newAch);

  return { id: docRef.id, ...newAch };
}


//view achievements
async function getUserAchievements(userid) {
  const snapshot = await db
    .collection("users")
    .doc(userid)
    .collection("achievements")
    .orderBy("createdAt", "desc")
    .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}

//user info
async function getUserById(userid) {
  const snap = await db.collection("users").doc(userid).get();
  if (!snap.exists) return null;
  return snap.data();
}

//followers number
async function getFollowNum(userId) {
  const followersSnap = await db.collection("users").doc(userId).collection("followers").get();
  const followingSnap = await db.collection("users").doc(userId).collection("following").get();

  return {
    followersCount: followersSnap.size,
    followingCount: followingSnap.size,
  };
}

//add games
async function addUserGame(userid, gameid) {
  const ref = await db.collection("userGames").add({
    userid,
    gameid,
  });
  return { id: ref.id };
}

//view games
async function getUserGames(userid) {
  const snap = await db.collection("userGames").where("userid", "==", userid).get();
  const results = [];

  for (const doc of snap.docs) {
    const ug = doc.data();

    const gameDoc = await db.collection("games").doc(ug.gameid).get();
    const game = gameDoc.exists ? gameDoc.data() : {};

    results.push({
      id: doc.id,           
      ...ug,            
      gameName: game.gameName,
      gamePhoto: game.gamePhoto
    });
  }
  return results;
}

async function getGames() {
  const snapshot = await db.collection("games").get();
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));
}

module.exports = {
  addUserAchievement,
  getUserAchievements,
  getUserById,
  getFollowNum,
  addUserGame,
  getUserGames,
  getGames,
};