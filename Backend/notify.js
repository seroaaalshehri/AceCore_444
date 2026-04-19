const { db, admin, messaging } = require("./Firebase/firebaseBackend");
const APP_BASE = process.env.APP_BASE_URL || "http://localhost:3000"; 

async function recordSidebarNotification(gamerId, data) {
  await db.collection("users").doc(gamerId).collection("notifications").add({
    ...data,
    read: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}


async function resolveFcmTokens(userId) {
  let tokensSnap = await db.collection("users").doc(userId).collection("fcmTokens").get();
  let tokens = tokensSnap.docs.map((d) => d.id);

  if (!tokens.length) {
    let authUid = null;

    const userDoc = await db.collection("users").doc(userId).get();
    if (userDoc.exists && userDoc.data()?.authUid) {
      authUid = userDoc.data().authUid;
    } else {
      const link = await db.collection("authLinks")
        .where("userId", "==", userId)
        .limit(1)
        .get();

      if (!link.empty) authUid = link.docs[0].id;
    }

    if (authUid) {
      const byAuth = await db.collection("users")
        .doc(authUid)
        .collection("fcmTokens")
        .get();

      tokens = byAuth.docs.map((d) => d.id);
    }
  }

  return tokens;
}

// 🔥 NEW: unified notification sender
async function sendPushNotification(userId, payload, options = {}) {
  const tokens = await resolveFcmTokens(userId);
  if (!tokens.length) return;

  await messaging.sendEachForMulticast({
    tokens,
    notification: {
      title: payload.title,
      body: payload.body,
    },
    ...(options.data && { data: options.data }),
    ...(options.webpush && { webpush: options.webpush }),
  });
}



async function sendPushToGamer(gamerId, payload) {
  return sendPushNotification(gamerId, payload, {
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

async function sendPushReminderWithFCM(gamerId, payload) {
  return sendPushNotification(gamerId, payload, {
    data: {
      link: payload.link || "/",
    },
    webpush: {
      notification: {
        title: payload.title,
        body: payload.body,
        icon: "/AC-glow.png",
        badge: "/favicon-32x32.png",
        requireInteraction: true,
        actions: [{ action: "open", title: "Open" }],
      },
      fcmOptions: {
        link: payload.link,
      },
    },
  });
}

async function sendPushToClub(clubId, payload) {
  return sendPushNotification(clubId, payload, {
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

  const APP_ORIGIN = process.env.APP_ORIGIN || "http://localhost:3000";
  const link = `/gamer/scrims/${gamerId}`;
  const absoluteLink = `${APP_ORIGIN}${link}`;

  await sendPushToGamer(gamerId, { title, body, link: absoluteLink });
  await recordSidebarNotification(gamerId, { title, body, clubId, slotId, status: newStatus, link });
};

exports.notifySlotCanceled = async ({
  gamerId,
  clubId,
  slotId,
  gameName,
  scrimTimeText, 
}) => {
  const clubSnap = await db.collection("users").doc(clubId).get();
  const club = clubSnap.exists ? clubSnap.data() : {};
  const clubName = club.clubName || club.username || "Club";

  const title = "Scrim Arena Canceled";
  const body = `${clubName} canceled the ${gameName || "scrim"} scrim arena scheduled on ${scrimTimeText || "unknown time"}`;

  await sendPushToGamer(gamerId, { title, body });
  await recordSidebarNotification(gamerId, { title, body, clubId, slotId });
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

  const title = "A Gamer Canceled an Appointment";
  const body = `${gamerName} canceled their ${gameName || "scrim"} scrim arena appointment scheduled on ${scrimTimeText || "unknown time"}`;

  await sendPushToClub(clubId, { title, body });
  await recordSidebarNotification(clubId, { title, body, gamerId, slotId });
};

exports.sendPushToGamer = sendPushToGamer;
exports.sendPushReminderWithFCM = sendPushReminderWithFCM;
exports.recordSidebarNotification = recordSidebarNotification;
exports.sendPushToClub = sendPushToClub;
