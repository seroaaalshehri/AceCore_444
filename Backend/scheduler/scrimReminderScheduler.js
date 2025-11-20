const { db } = require("../Firebase/firebaseBackend");
const { sendPushReminderWithFCM, recordSidebarNotification } = require("../notify");

const scheduledJobs = new Map(); 

async function scheduleForSlot(clubId, slotId, slotData) {
  if (!slotData.scrimTime) return;

  const scrimMs = slotData.scrimTime?._seconds
    ? slotData.scrimTime._seconds * 1000
    : new Date(slotData.scrimTime).getTime();

  const reminderAt = scrimMs - 2 * 60 * 60 * 1000; 
  const delay = reminderAt - Date.now();

  if (delay <= 0) return; 

  const jobKey = `${clubId}_${slotId}`;

  if (scheduledJobs.has(jobKey)) {
    clearTimeout(scheduledJobs.get(jobKey));
  }

  const timer = setTimeout(async () => {

    const acceptedSnap = await db
      .collection("users").doc(clubId)
      .collection("schedule").doc(slotId)
      .collection("gamersAcceptance").get();
for (const gamerDoc of acceptedSnap.docs) {
  const gamerId = gamerDoc.id;

  // Get gamer info
  const gamerSnap = await db.collection("users").doc(gamerId).get();
  const gamerData = gamerSnap.exists ? gamerSnap.data() : {};
  const gamerName =
    gamerData.username ||
    `${gamerData.firstName || ""} ${gamerData.lastName || ""}`.trim() ||
    "Gamer";

  // Get club info
  const clubSnap = await db.collection("users").doc(clubId).get();
  const clubData = clubSnap.exists ? clubSnap.data() : {};
  const clubName = clubData.clubName || clubData.username || "Club";

  const gameId = slotData.gameid; 
  let gameName = "your game";

  if (gameId) {
    const gameSnap = await db.collection("games").doc(gameId).get();
    if (gameSnap.exists) {
      gameName = gameSnap.data().gameName || gameName;
    }
  }

  // Format scrim time
  const scrimDate = new Date(scrimMs).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const ORIGIN = process.env.APP_ORIGIN || "http://localhost:3000";

  const title = "Scrim Arena Reminder";
  const body = `2 hours left before your ${gameName} scrim arena with ${clubName} scheduled on ${scrimDate}`;

  await sendPushReminderWithFCM(gamerId, {
    title,
    body,
    link: `${ORIGIN}/gamer/scrimappointments/view/${gamerId}`,
  });

  await recordSidebarNotification(gamerId, {
    title,
    body,
    clubId,
    slotId,
    gameName,
    scrimDate,
    link: `/gamer/scrimappointments/view/${gamerId}`,
  });
}


    scheduledJobs.delete(jobKey); 
  }, delay);

  scheduledJobs.set(jobKey, timer);
}

async function scheduleAll() {
  console.log("🔄 Scheduler: scanning all future scrims...");

  const clubsSnap = await db.collection("users")
    .where("role", "==", "club")
    .get();

  for (const clubDoc of clubsSnap.docs) {
    const clubId = clubDoc.id;

    const scheduleSnap = await db
      .collection("users").doc(clubId)
      .collection("schedule")
      .get();

    scheduleSnap.forEach(slotDoc => {
      scheduleForSlot(clubId, slotDoc.id, slotDoc.data());
    });
  }
}

function listenForChanges() {
  db.collection("users")
    .where("role", "==", "club")
    .onSnapshot(clubsSnap => {
      clubsSnap.docs.forEach(clubDoc => {
        const clubId = clubDoc.id;

        db.collection("users")
          .doc(clubId)
          .collection("schedule")
          .onSnapshot(scheduleSnap => {
            scheduleSnap.docChanges().forEach(change => {
              const slotId = change.doc.id;
              const slotData = change.doc.data();

              if (change.type === "added" || change.type === "modified") {
                scheduleForSlot(clubId, slotId, slotData);
              }
            });
          });
      });
    });
}

module.exports = function initScrimScheduler() {
  scheduleAll();
  listenForChanges();
};
