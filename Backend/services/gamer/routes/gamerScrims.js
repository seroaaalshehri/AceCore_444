const express = require("express");
const router = express.Router();
const { db , admin} = require("../../../Firebase/firebaseBackend");


async function loadClubScrimAndSchedule(clubId, scrimId) {

  const clubDoc = await db.collection("users").doc(clubId).get();
  const club = clubDoc.exists ? clubDoc.data() : {};

  // scrim doc
  const scrimRef = db.collection("users").doc(clubId)
    .collection("scrimArena").doc(scrimId);
  const sDoc = await scrimRef.get();
  const s = sDoc.exists ? sDoc.data() : {};

  let scheduleId = s?.scheduleId || s?.scheduleID || s?.schedule?.id || null;
  let schedule = null;

  if (!scheduleId) {

    const q = await db.collection("users").doc(clubId)
      .collection("schedule").where("scrimId", "==", scrimId).limit(1).get();
    if (!q.empty) {
      scheduleId = q.docs[0].id;
      schedule = q.docs[0].data();
    }
  }
  if (!schedule && scheduleId) {
    const schDoc = await db.collection("users").doc(clubId)
      .collection("schedule").doc(scheduleId).get();
    if (schDoc.exists) schedule = schDoc.data();
  }

  return { club, scrim: s, schedule, scheduleId };
}

/** LIST — gamer’s booked scrims (View page) */
router.get("/:gamerId/scrim-appointments", async (req, res) => {
  try {
    const { gamerId } = req.params;

    const snap = await db.collection("users").doc(gamerId)
      .collection("scrimArenas").get();

    const rows = [];
    for (const d of snap.docs) {
      const { scrimId, clubId, isjoin } = d.data() || {};
      if (!scrimId || !clubId) continue;

      const { club, scrim, schedule, scheduleId } =
        await loadClubScrimAndSchedule(clubId, scrimId);

      rows.push({
        scrimId,
        clubId,
        scheduleId,
        isjoin: !!isjoin,

        // club meta
        clubName: club?.clubName || club?.displayName || `@${clubId}`,
        clubLogo: club?.profilePhoto || club?.avatarUrl || "",

        title: scrim?.title || "",
        status: scrim?.status || "",
        channelName: scrim?.channelName || "",
        attendeeUrl: scrim?.attendeeUrl || "",

       
        scheduleId: scheduleId || null,
        schedule: schedule ? {
          gameid: schedule.gameid ?? "",
          scrimType: schedule.scrimType ?? "",
          maxGamers: schedule.maxGamers ?? null,
          maxAcceptance: schedule.maxAcceptance ?? null,
          scrimTime: schedule.scrimTime ?? null,
          scrimEndTime: schedule.scrimEndTime ?? null,
          createdAt: schedule.createdAt ?? null,
          updatedAt: schedule.updatedAt ?? null,
        } : null,
        updatedAt: scrim?.updatedAt || null,
      });
    }
 
    const gameIds = [...new Set(rows.map(r => r.schedule?.gameid).filter(Boolean))];
    const gameById = new Map();
    for (let i = 0; i < gameIds.length; i += 10) {
      const slice = gameIds.slice(i, i + 10);
      const gSnap = await db.collection("games")
        .where(admin.firestore.FieldPath.documentId(), "in", slice)
        .get();
      gSnap.forEach(doc => gameById.set(doc.id, { id: doc.id, ...doc.data() }));
    }

    const enriched = rows.map(r => {
      const gid = r.schedule?.gameid;
      const g = gid ? gameById.get(gid) : null;
      const gamePayload = g ? {
        id: g.id,
        gameName: g.gameName || g.name || "",
        gamePhoto: g.scrimPhoto || g.gamePhoto || g.cover || "",
      } : null;

      return {
        ...r,
        schedule: r.schedule ? { ...r.schedule, game: gamePayload } : r.schedule,
      };
    });

    res.json({ ok: true, scrims: enriched });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
});

/** DETAIL — for Join page */
router.get("/:gamerId/scrim-appointments/:scrimId", async (req, res) => {
  try {
    const { gamerId, scrimId } = req.params;

    const gSnap = await db.collection("users").doc(gamerId)
      .collection("scrimArenas").where("scrimId", "==", scrimId)
      .limit(1).get();
    if (gSnap.empty) return res.status(404).json({ ok: false, error: "Not found" });

    const { clubId } = gSnap.docs[0].data();

    const { club, scrim, schedule, scheduleId } =
      await loadClubScrimAndSchedule(clubId, scrimId);

    let gamePayload = null;
    const gid = schedule?.gameid;
    if (gid) {
      const gDoc = await db.collection("games").doc(gid).get();
      if (gDoc.exists) {
        const g = gDoc.data() || {};
        gamePayload = {
          id: gDoc.id,
          gameName: g.gameName || g.name || "",
          gamePhoto: g.scrimPhoto || g.gamePhoto || g.cover || "",
        };
      }
    }

    res.json({
      ok: true,
      scrim: {
        gamerId, clubId, scrimId,

        clubName: club?.clubName || club?.displayName || `@${clubId}`,
        clubLogo: club?.profilePhoto || club?.avatarUrl || "",

        title: scrim?.title || "",
        status: scrim?.status || "",
        channelName: scrim?.channelName || "",
        attendeeUrl: scrim?.attendeeUrl || "",
        hostUrl: scrim?.hostUrl || "",
        updatedAt: scrim?.updatedAt || null,

        scheduleId: scheduleId || null,
        schedule: schedule ? {
          gameid: schedule.gameid ?? "",
          scrimType: schedule.scrimType ?? "",
          maxGamers: schedule.maxGamers ?? null,
          maxAcceptance: schedule.maxAcceptance ?? null,
          scrimTime: schedule.scrimTime ?? null,
          scrimEndTime: schedule.scrimEndTime ?? null,
          createdAt: schedule.createdAt ?? null,
          updatedAt: schedule.updatedAt ?? null,
          game: gamePayload,
        } : null,
      }
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
});


router.get("/:gamerId/:scrimId/ended", async (req, res) => {
  try {
    const { gamerId, scrimId } = req.params;

    const linkSnap = await db.collection("users").doc(gamerId)
      .collection("scrimArenas")
      .where("scrimId", "==", scrimId)
      .limit(1)
      .get();

    if (linkSnap.empty) {
      return res.status(404).json({ ok: false, error: "Link not found", ended: false });
    }

    const { clubId } = linkSnap.docs[0].data() || {};
    if (!clubId) {
      return res.status(400).json({ ok: false, error: "Missing clubId", ended: false });
    }

    const scrimDoc = await db.collection("users").doc(clubId)
      .collection("scrimArena").doc(scrimId)
      .get();

    if (!scrimDoc.exists) {
      return res.status(404).json({ ok: false, error: "Scrim not found", ended: false });
    }

    const status = String((scrimDoc.data() || {}).status || "").toLowerCase();
    const ended = status === "ended";

    return res.json({ ok: true, ended, status });
  } catch (e) {
    console.error("ended-check error:", e);
    return res.status(500).json({ ok: false, error: String(e), ended: false });
  }
});






module.exports = router;
