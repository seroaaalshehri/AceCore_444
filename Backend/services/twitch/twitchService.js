const fetch = require("node-fetch");
const {db} = require("./../../Firebase/firebaseBackend");

// App token cache
let APP_TOKEN=null, APP_EXP=0;
async function getAppToken() {
  const now = Date.now();
  if (APP_TOKEN && now < APP_EXP - 60_000) return APP_TOKEN;
  const url = new URL("https://id.twitch.tv/oauth2/token");
  url.searchParams.set("grant_type", "client_credentials");
  url.searchParams.set("client_id", process.env.TWITCH_CLIENT_ID);
  url.searchParams.set("client_secret", process.env.TWITCH_CLIENT_SECRET);
  const r = await fetch(url, { method: "POST" });
  const j = await r.json();
  if (!r.ok) throw new Error(`token_fail ${r.status} ${JSON.stringify(j)}`);
  APP_TOKEN = j.access_token; APP_EXP = Date.now() + (j.expires_in||0)*1000;
  return APP_TOKEN;
}

async function helixGetStreamsByUserIds(ids=[]) {
  if (!ids.length) return [];
  const token = await getAppToken();
  const qs = ids.map(id => `user_id=${encodeURIComponent(id)}`).join("&");
  const r = await fetch(`https://api.twitch.tv/helix/streams?${qs}`, {
    headers: { "Client-Id": process.env.TWITCH_CLIENT_ID, "Authorization": `Bearer ${token}` }
  });
  const j = await r.json();
  if (!r.ok) throw new Error(`helix_fail ${r.status} ${JSON.stringify(j)}`);
  return Array.isArray(j.data) ? j.data : [];
}

async function getLiveCardsForViewer(viewerId) {
  // follower list
  const fSnap = await db.collection("users").doc(viewerId).collection("following").get();
  const followedIds = fSnap.docs.map(d => d.id);
  if (!followedIds.length) return [];

  // load followed users
  const userDocs = await Promise.all(followedIds.map(id => db.collection("users").doc(id).get()));
  const clubs = userDocs
    .filter(s => s.exists)
    .map(s => ({ userId: s.id, ...s.data() }))
    .filter(u => (u.role || "").toLowerCase() === "club");

  // enrich: get socials.twitch + integrations/twitch.broadcasterId
  const enriched = await Promise.all(clubs.map(async c => {
    const channelUrl = c?.socials?.twitch || "";
    const integ = await db.collection("users").doc(c.userId).collection("integrations").doc("twitch").get();
    const broadcasterId = integ.exists ? (integ.data()?.broadcasterId || "") : "";
    return { clubId: c.userId, clubName: c.username || c.name || "", channelUrl, broadcasterId ,channelPhoto: c.profilePhoto};
  }));

  const trackable = enriched.filter(e => e.channelUrl && e.broadcasterId);
  if (!trackable.length) return [];

  // helix in chunks of 100
  const ids = trackable.map(t => t.broadcasterId);
  const chunks = []; for (let i=0;i<ids.length;i+=100) chunks.push(ids.slice(i,i+100));
  const liveRows = [];
  for (const ch of chunks) liveRows.push(...(await helixGetStreamsByUserIds(ch)));

  const byId = new Map(trackable.map(t => [t.broadcasterId, t]));
  return liveRows.map(s => {
    const club = byId.get(s.user_id);
     const thumb = (s.thumbnail_url || "").replace("{width}x{height}", "640x360");
  // cache-bust so you see it refresh (optional)
  const previewUrl = thumb ? `${thumb}?t=${Date.now()}` : "";

    return {
      clubId: club.clubId,
      clubName: club.clubName,
      channelPhoto: club.channelPhoto,
      title: s.title || "",  
      startedAt: s.started_at,
      watchUrl: club.channelUrl,
       previewUrl,    
    };
  });
}

module.exports = { getLiveCardsForViewer };
