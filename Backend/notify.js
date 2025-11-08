const { db, admin, messaging } = require("./Firebase/firebaseBackend");
const APP_BASE = process.env.APP_BASE_URL || "http://localhost:3000"; // set APP_BASE_URL in prod to https://acecore.app

// Record a notification in Firestore under users/{gamerId}/notifications
async function recordSidebarNotification(gamerId, data) {
  await db.collection("users").doc(gamerId).collection("notifications").add({
    ...data,
    read: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

async function sendPushToGamer(gamerId, payload) {
  // Try gamerId location first (legacy)
  let tokensSnap = await db.collection("users").doc(gamerId).collection("fcmTokens").get();
  let tokens = tokensSnap.docs.map((d) => d.id);

  if (!tokens.length) {
    // Fallback: resolve authUid, then read /users/{authUid}/fcmTokens
    let authUid = null;

    const userDoc = await db.collection("users").doc(gamerId).get();
    if (userDoc.exists && userDoc.data()?.authUid) {
      authUid = userDoc.data().authUid;
    } else {
      // or from authLinks (authUid -> userId) inverse lookup if you have it
      const link = await db.collection("authLinks").where("userId", "==", gamerId).limit(1).get();
      if (!link.empty) authUid = link.docs[0].id;
    }

    if (authUid) {
      const byAuth = await db.collection("users").doc(authUid).collection("fcmTokens").get();
      tokens = byAuth.docs.map((d) => d.id);
    }
  }

  if (!tokens.length) return;

  await messaging.sendEachForMulticast({
    tokens,
    notification: { title: payload.title, body: payload.body },
    webpush: {
      notification: {
        icon: "https://acecore.app/icons/notification-icon.png",
        badge: "https://acecore.app/icons/badge.png",
        requireInteraction: true,
        actions: [{ action: "open", title: "View" }],
      },
      fcmOptions: { link: payload.link },
    },
  });
}

async function sendPushToClub(clubId, payload) {
  // Try /users/{clubId}/fcmTokens first
  let tokensSnap = await db.collection("users").doc(clubId).collection("fcmTokens").get();
  let tokens = tokensSnap.docs.map(d => d.id);

  if (!tokens.length) {
    // Fallback via authUid like you did for gamer side
    let authUid = null;

    const clubDoc = await db.collection("users").doc(clubId).get();
    if (clubDoc.exists && clubDoc.data()?.authUid) {
      authUid = clubDoc.data().authUid;
    } else {
      const link = await db
        .collection("authLinks")
        .where("userId", "==", clubId)
        .limit(1)
        .get();
      if (!link.empty) authUid = link.docs[0].id;
    }

    if (authUid) {
      const byAuth = await db
        .collection("users")
        .doc(authUid)
        .collection("fcmTokens")
        .get();
      tokens = byAuth.docs.map((d) => d.id);
    }
  }

  if (!tokens.length) return;

  await messaging.sendEachForMulticast({
    tokens,
    notification: {
      title: payload.title,
      body: payload.body,
    },
    webpush: {
      notification: {
        icon: "https://acecore.app/icons/notification-icon.png",
        badge: "https://acecore.app/icons/badge.png",
        requireInteraction: true,
        actions: [{ action: "open", title: "View" }],
      },
      fcmOptions: { link: payload.link },
    },
  });
}


exports.notifyRequestStatusChange = async ({ gamerId, clubId, slotId, newStatus }) => {
  const clubSnap = await db.collection("users").doc(clubId).get();
  const club = clubSnap.exists ? clubSnap.data() : {};
  const clubName = club.clubName || club.username || "Club";

  const title = "Request Update";
  const body =
    newStatus === "accepted"
      ? `${clubName} accepted your request 🎉`
      : newStatus === "declined"
      ? `${clubName} declined your request`
      : `${clubName} updated your request`;

  // Build link dynamically to gamer’s Scrims Scheduling page
const APP_ORIGIN = process.env.APP_ORIGIN || "http://localhost:3000";
const link = `/gamer/scrims/${gamerId}`;
const absoluteLink = `${APP_ORIGIN}${link}`;


  // Push notifications need a full URL
await sendPushToGamer(gamerId, { title, body, link: absoluteLink });

// Sidebar notifications only need a relative path
await recordSidebarNotification(gamerId, { title, body, clubId, slotId, status: newStatus, link });

};


exports.notifySlotCanceled = async ({
  gamerId,
  clubId,
  slotId,
  gameName,
  scrimTimeText, // <-- NEW, comes from controller
}) => {
  // 1. get club display name
  const clubSnap = await db.collection("users").doc(clubId).get();
  const club = clubSnap.exists ? clubSnap.data() : {};
  const clubName = club.clubName || club.username || "Club";

  // 2. build message text
  // example: "Falcons canceled the Overwatch scrim scheduled on Nov 1, 2025 22:30"
  const title = "Scrim Arena Canceled";
  const body = `${clubName} canceled the ${gameName || "scrim"} scrim arena scheduled on ${scrimTimeText || "unknown time"}`;

  // 3. links
  const APP_ORIGIN = process.env.APP_ORIGIN || "http://localhost:3000";


  // 4. send browser push
  await sendPushToGamer(gamerId, {
    title,
    body,
  });

  // 5. write sidebar notification (shows in NotificationsPage)
  await recordSidebarNotification(gamerId, {
    title,
    body,
    clubId,
    slotId,
  });
};

exports.notifyGamerCancelled = async ({
  clubId,
  slotId,
  gamerId,
  gameName,
  scrimTimeText,
}) => {
  const gamerSnap = await db.collection("users").doc(gamerId).get();
  const gamer = gamerSnap.exists ? gamerSnap.data() : {};
  const gamerName =
    gamer.username ||
    `${gamer.firstName || ""} ${gamer.lastName || ""}`.trim() ||
    "Gamer";

  // message shown in notification
  const title = "A Gamer Canceled an Appointment";
  const body = `${gamerName} canceled their ${gameName || "scrim"} scrim arena appointment scheduled on ${scrimTimeText || "unknown time"}`;

  // 🔁 build link to club requests page (clubId + slotId)
  const APP_ORIGIN = process.env.APP_ORIGIN || "http://localhost:3000";

  //const relativeLink = `/club/requests/${clubId}/${slotId}`;
  //const absoluteLink = `${APP_ORIGIN}${relativeLink}`;

  // send web push to the CLUB
  await sendPushToClub(clubId, {
    title,
    body,
   /* link: absoluteLink,*/
  });

  // store sidebar notification for the CLUB
  await recordSidebarNotification(clubId, {
    title,
    body,
    gamerId,
    slotId,
    /*link: relativeLink,*/
  });
};
