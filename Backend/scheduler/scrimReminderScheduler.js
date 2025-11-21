const { db } = require("../Firebase/firebaseBackend");
const { sendPushReminderWithFCM, recordSidebarNotification, } = require("../notify");

const scheduledJobs = new Map(); 
const clubScheduledJobs = new Map(); 

//club logic 
async function scheduleClubReminderForSlot(clubId, slotId, slotData) {
  if (!slotData.scrimTime) return;

  const scrimMs = slotData.scrimTime?._seconds
    ? slotData.scrimTime._seconds * 1000
    : new Date(slotData.scrimTime).getTime();

  // 24 hours before scrim (for testing you can change 24 to 0.1, etc.)
  const reminderAt = scrimMs - 24 * 60 * 60 * 1000;
  const delay = reminderAt - Date.now();
  if (delay <= 0) return;

  const jobKey = `club24h_${clubId}_${slotId}`;

  if (clubScheduledJobs.has(jobKey)) {
    clearTimeout(clubScheduledJobs.get(jobKey));
  }

  const timer = setTimeout(async () => {
    // ---- build notification content here ----

    // get club data
    const clubSnap = await db.collection("users").doc(clubId).get();
    const clubData = clubSnap.exists ? clubSnap.data() : {};
    //const clubName = clubData.clubName || clubData.username;

    // resolve game name
    const gameId = slotData.gameid;
    let gameName = "your game";
    if (gameId) {
      const gameSnap = await db.collection("games").doc(gameId).get();
      if (gameSnap.exists) {
        gameName = gameSnap.data().gameName || gameName;
      }
    }

    // format scrim time
    const scrimDateText = new Date(scrimMs).toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });

    const APP_ORIGIN = process.env.APP_ORIGIN || "http://localhost:3000";

    const title = "Scrim Arena Reminder";
    const body = `24 hours left before your ${gameName} scrim arena scheduled on ${scrimDateText}.`;

    await sendPushReminderWithFCM(clubId, {
      title,
      body,
      link: `${APP_ORIGIN}/club/notifications/${clubId}`,
    });

    await recordSidebarNotification(clubId, {
      title,
      body,
      slotId,
      gameName,
      scrimDate: scrimDateText,
      link: `/club/scrimappointments/${clubId}`,
      type: "scrimReminder24h",
    });


    clubScheduledJobs.delete(jobKey);
  }, delay);

  clubScheduledJobs.set(jobKey, timer);
}





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
        // club 24h reminder
      scheduleClubReminderForSlot(clubId, slotDoc.id, slotDoc.data());
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
                //2h gamer
                scheduleForSlot(clubId, slotId, slotData);
                //24h club
                 scheduleClubReminderForSlot(clubId, slotId, slotData);
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
