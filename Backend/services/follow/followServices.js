const { db } = require("../../Firebase/firebaseBackend");

// Resolve the user's profile document ID from their Firebase Auth UID.
// Strategy:
// 1) If a user doc exists with id == authUid, use that.
// 2) Else find a doc where field authUid == authUid.
// Returns the user document ID or throws if not found.
async function getUserDocIdByAuthUid(authUid) {
  if (!authUid) throw new Error("Missing auth uid");
  const direct = await db.collection("users").doc(authUid).get();
  if (direct.exists) return authUid;
  const q = await db.collection("users").where("authUid", "==", authUid).limit(1).get();
  if (!q.empty) return q.docs[0].id;
  throw new Error("User profile not found for auth uid");
}

// Create follow relationship by writing symmetric docs in subcollections.
// currentAuthUid: Firebase Auth UID of viewer
// targetDocId: user profile document id of the target user
async function followUser(currentAuthUid, targetDocId) {
  if (!currentAuthUid || !targetDocId) throw new Error("Missing user ids");

  // Map viewer auth uid -> their user doc id
  const viewerDocId = await getUserDocIdByAuthUid(currentAuthUid);
  if (viewerDocId === targetDocId) throw new Error("Cannot follow yourself");

  // Verify target exists
  const targetDoc = await db.collection("users").doc(targetDocId).get();
  if (!targetDoc.exists) throw new Error("Target user not found");

  const batch = db.batch();
  const now = new Date();

  const followingRef = db
    .collection("users")
    .doc(viewerDocId)
    .collection("following")
    .doc(targetDocId);
  const followersRef = db
    .collection("users")
    .doc(targetDocId)
    .collection("followers")
    .doc(viewerDocId);

  batch.set(followingRef, { createdAt: now }, { merge: true });
  batch.set(followersRef, { createdAt: now }, { merge: true });

  await batch.commit();
  return { success: true };
}

// Remove follow relationship by deleting symmetric docs.
async function unfollowUser(currentAuthUid, targetDocId) {
  if (!currentAuthUid || !targetDocId) throw new Error("Missing user ids");

  const viewerDocId = await getUserDocIdByAuthUid(currentAuthUid);
  if (viewerDocId === targetDocId) return { success: true }; // no-op

  const batch = db.batch();
  const followingRef = db
    .collection("users")
    .doc(viewerDocId)
    .collection("following")
    .doc(targetDocId);
  const followersRef = db
    .collection("users")
    .doc(targetDocId)
    .collection("followers")
    .doc(viewerDocId);

  batch.delete(followingRef);
  batch.delete(followersRef);

  await batch.commit();
  return { success: true };
}

// Get target user's followers/following counts and whether viewer follows target.
// viewerAuthUid: optional (null if anonymous); targetDocId: user doc id
async function getFollowStats(viewerAuthUid, targetDocId) {
  if (!targetDocId) throw new Error("Missing target id");

  const usersCol = db.collection("users");
  const targetRef = usersCol.doc(targetDocId);
  const targetSnap = await targetRef.get();
  if (!targetSnap.exists) throw new Error("Target user not found");

  const [followersSnap, followingSnap] = await Promise.all([
    targetRef.collection("followers").get(),
    targetRef.collection("following").get(),
  ]);

  let isFollowing = false;
  if (viewerAuthUid) {
    try {
      const viewerDocId = await getUserDocIdByAuthUid(viewerAuthUid);
      const relDoc = await usersCol
        .doc(viewerDocId)
        .collection("following")
        .doc(targetDocId)
        .get();
      isFollowing = relDoc.exists;
    } catch (_) {
      isFollowing = false;
    }
  }

  return {
    followersCount: followersSnap.size,
    followingCount: followingSnap.size,
    isFollowing,
  };
}

module.exports = { followUser, unfollowUser, getFollowStats };