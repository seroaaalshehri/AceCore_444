const fs = require("fs");
const { db ,admin } = require("../../Firebase/firebaseBackend");
const { v4: uuidv4 } = require("uuid");

async function uploadToFirebaseStorage(userId, fileInput) {
  const bucketName = process.env.FIREBASE_STORAGE_BUCKET || "acecore-7aa99.appspot.com";
  const bucket = admin.storage().bucket(bucketName);

  const safeName = `${Date.now()}-${fileInput.originalname.replace(/\s+/g, "_")}`;
  const objectPath = `profileImages/${userId}/${safeName}`;
  const gcsFile = bucket.file(objectPath);
  const token = uuidv4();

  await gcsFile.save(fileInput.buffer, {
    metadata: {
      contentType: fileInput.mimetype,
      metadata: { firebaseStorageDownloadTokens: token },
    },
    resumable: false,
  });

  const url = `https://firebasestorage.googleapis.com/v0/b/${
    bucket.name
  }/o/${encodeURIComponent(objectPath)}?alt=media&token=${token}`;

  return { url, objectPath };
}


async function updateUserProfileService(userid, fields, { fileInput } = {}) {
  const ref = db.collection("users").doc(userid);

  const updates = {
    firstName: fields.firstName,
    lastName:  fields.lastName,
    bio:       fields.bio,
    nationality: fields.nationality,
    socials:   fields.socials,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  if (fileInput) {
    const { url, objectPath } = await uploadToFirebaseStorage(userid, fileInput);
    updates.profilePhoto = url;            
    updates.profilePhotoPath = objectPath;
  }

  await ref.set(updates, { merge: true });
  return (await ref.get()).data();
}

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

async function getUserById(userid) {
  const snap = await db.collection("users").doc(userid).get();
  if (!snap.exists) return null;
  return snap.data();
}

async function getFollowNum(userId) {
  const followersSnap = await db.collection("users").doc(userId).collection("followers").get();
  const followingSnap = await db.collection("users").doc(userId).collection("following").get();

  return {
    followersCount: followersSnap.size,
    followingCount: followingSnap.size,
  };
}

async function addUserGame( gameid,rank, userid, username) {

  const ref = await db.collection("userGames").add({
    gameid,
    rank,
   userid,
   username
  });
  return { id: ref.id };
}



async function getUserGames(userid) {
  const userId=userid;
  

  const snap = await db.collection("userGames").where("userid", "==", userId).get();
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
  updateUserProfileService
};