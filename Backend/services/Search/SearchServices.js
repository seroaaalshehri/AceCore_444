// Backend/services/Search/SearchServices.js
const { db } = require('../../Firebase/firebaseBackend');

// Exact, case-insensitive search by username, and also by clubName.
// Works for both gamers & clubs (single 'users' collection).
exports.runSimpleSearch = async ({ q, role }) => {
  const raw = (q || '').trim();
  if (!raw) return { results: [] };

  // normalize input (drop @, lowercase)
  const normalized = raw.replace(/^@/, '').toLowerCase();

  // -------------------------------
  // 1) username_lower (fast path)
  // -------------------------------
  let snap = await db.collection('users')
    .where('username_lower', '==', normalized)
    .limit(1)
    .get();

  if (!snap.empty) {
    const d = snap.docs[0];
    const user = { id: d.id, ...d.data() };
    if (!role || user.role === role) return { results: [user] };
  }

  // -------------------------------------------------------
  // 1b) Fallback: username exact (older docs without _lower)
  // -------------------------------------------------------
  const userExact = await db.collection('users')
    .where('username', '==', raw.replace(/^@/, ''))
    .limit(1)
    .get();

  if (!userExact.empty) {
    const d = userExact.docs[0];
    const user = { id: d.id, ...d.data() };
    if (!role || user.role === role) return { results: [user] };
  }

  // =================================================================
  // ADDED: clubName matching (case-insensitive) WITHOUT new DB fields
  // =================================================================

  // 2) If you *later* add clubName_lower, this fast path will use it.
  //    Safe to keep; if the field doesn't exist, it just won't match.
  const clubLowerSnap = await db.collection('users')
    .where('clubName_lower', '==', normalized)
    .limit(1)
    .get();

  if (!clubLowerSnap.empty) {
    const d = clubLowerSnap.docs[0];
    const club = { id: d.id, ...d.data() };
    if (!role || club.role === role) return { results: [club] };
  }

  // 3) Current DB: only 'clubName' exists (no lower).
  //    Fetch clubs, then compare clubName in Node (case-insensitive).
  const clubsSnap = await db.collection('users')
    .where('role', '==', 'club')
    .get();

  const clubDoc = clubsSnap.docs.find(doc => {
    const name = ((doc.get('clubName')) || '').toString().trim().toLowerCase();
    return name === normalized;
  });

  if (clubDoc) {
    const club = { id: clubDoc.id, ...clubDoc.data() };
    if (!role || club.role === role) return { results: [club] };
  }

  // Nothing found
  return { results: [] };
};

// ============================================================
// Loose (demo-friendly) live search: scans a small set in Node
// - Matches username_lower prefix
// - Also matches clubName contains (case-insensitive)
// - Optional role filter
// ============================================================
exports.runLooseSearch = async ({ q, limit = 20, role }) => {
  const raw = (q || '').trim();
  if (!raw) return { results: [] };

  const normalized = raw.replace(/^@/, '').toLowerCase();

  // Pull a small window of users (adjust 200 if your dataset grows)
  const snap = await db.collection('users')
    .limit(200)
    .get();

  const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));

  // Filter in Node: username_lower startsWith, or clubName contains
  let filtered = all.filter(u => {
    const uname = (u.username_lower || u.username || '').toString().toLowerCase();
    const cname = (u.clubName || '').toString().toLowerCase();
    const byUsername = uname.startsWith(normalized);
    const byClubName = cname.includes(normalized); // contains is nicer for names
    return byUsername || byClubName;
  });

  // Optional role filter
  if (role === 'gamer' || role === 'club') {
    filtered = filtered.filter(u => u.role === role);
  }

  // Return top N
  return { results: filtered.slice(0, limit) };
};



// 🔥 Search by game + rank (FIXED VERSION)
exports.searchByGame = async ({ gameId, role, score, country  }) => {  // Minimal log for invocation
  console.log('[searchByGame] gameId=%s role=%s', String(gameId), String(role));

  // ✅ Normalize game name
  function normalize(str) {
    return str.toLowerCase().replace(/\s+/g, "");
  }

  const GAME_MAP = {
    "callofduty": "code",
    "cod": "code",
    "code": "code",
    "rocketleague": "rl",
    "rl": "rl",
    "overwatch": "ow",
    "ow": "ow"
  };

  const normalized = normalize(gameId);
  const finalGameId = GAME_MAP[normalized] || gameId;
  
  // normalized internally

  // Inverse map: short code -> canonical normalized game name
  const INVERSE_GAME_MAP = {
    "code": "callofduty",
    "rl": "rocketleague",
    "ow": "overwatch",
  };
  const canonicalName = INVERSE_GAME_MAP[String(finalGameId).toLowerCase()] || null;

  // Query userGames collection. Use a small set of candidate game ids to
  // be tolerant to variations (e.g. 'cod' vs 'code') so both gamer and
  // club entries are matched regardless of which form was stored.
  const candidates = Array.from(new Set([String(finalGameId), String(gameId), normalized, canonicalName].filter(Boolean)));
  let snap;
  if (candidates.length === 1) {
    snap = await db
      .collection("userGames")
      .where("gameid", "==", finalGameId)
      .get();
  } else {
    // Firestore 'in' supports up to 10 values; our small candidates list is safe
    snap = await db
      .collection("userGames")
      .where("gameid", "in", candidates)
      .get();
  }

  let userDocs = snap.docs;

  if (snap.empty) {
    console.log('⚠️ No userGames found for gameId with direct query:', finalGameId);
    // Fallback: try scanning a reasonable window of userGames and match by
    // normalized gameid in Node. This handles cases where gameid was stored
    // with different formatting (spaces/case) not covered by the candidates set.
    try {
      // First, try to map the requested game identifier to actual `games` documents.
      // Many parts of the app store `userGames.gameid` as the games doc id (not a short code),
      // so we should resolve both styles.
      const gamesSnap = await db.collection('games').get();
        const matchedGames = gamesSnap.docs.filter(gdoc => {
          const gd = gdoc.data() || {};
          const nameNorm = String(gd.gameName || '').toLowerCase().replace(/\s+/g, '');
          const codeField = String(gd.code || gd.short || gd.slug || '').toLowerCase();
          const docId = String(gdoc.id || '').toLowerCase();
          return (
            nameNorm === normalized ||
            nameNorm === canonicalName ||
            codeField === normalized ||
            codeField === String(finalGameId).toLowerCase() ||
            docId === normalized ||
            docId === String(finalGameId).toLowerCase() ||
            docId === String(gameId).toLowerCase()
          );
        });

      if (matchedGames.length > 0) {
        const gameDocIds = matchedGames.map(d => d.id);
        // Query userGames for those game doc ids
        let mappedSnap;
        if (gameDocIds.length === 1) {
          mappedSnap = await db.collection('userGames').where('gameid', '==', gameDocIds[0]).get();
        } else {
          mappedSnap = await db.collection('userGames').where('gameid', 'in', gameDocIds.slice(0, 10)).get();
        }

        if (!mappedSnap.empty) userDocs = mappedSnap.docs;
      }

      // If still nothing, fall back to a broader scan of userGames (existing behavior)
      if (!userDocs || userDocs.length === 0) {
        const scanSnap = await db.collection('userGames').limit(1000).get();
        const matched = scanSnap.docs.filter(d => {
          const g = String(d.get('gameid') || '').toLowerCase().replace(/\s+/g, '');
          return g === normalized || g === String(finalGameId).toLowerCase();
        });
        if (matched.length > 0) userDocs = matched;
        else return { results: [] };
      }
    } catch (e) {
      console.warn('Fallback scan failed:', e);
      return { results: [] };
    }
  }

  // ✅ Filter by score for GAMERS only
if (role === "gamer" && score) {
  const targetScore = score.toUpperCase();
  
  userDocs = userDocs.filter(doc => {
    const userScore = (doc.data().score || '').toUpperCase();
    return userScore === targetScore;
  });
}
  // Extract userIDs and validate them (skip undefined/non-string ids)
  const userIds = userDocs.map(doc => doc.data().userid);
  const validUserIds = userIds.filter(uid => typeof uid === 'string' && uid.trim());
  const invalidCount = userIds.length - validUserIds.length;
  // validated user IDs

  if (validUserIds.length === 0) {
    console.log('⚠️ No valid user IDs found after validation, returning empty results');
    return { results: [] };
  }

  // Fetch users
  const users = await Promise.all(
    validUserIds.map(uid => db.collection("users").doc(uid).get())
  );

  let results = users
    .filter(doc => doc.exists)
    .map(doc => ({ id: doc.id, ...doc.data() }));

  // results length: results.length

  // Filter by role (club / gamer)
  if (role === "gamer" || role === "club") {
    results = results.filter(u => u.role === role);
  }
  // No expensive club fallback in production
// Filter by nationality (gamer) or country (club)
if (country && country.trim()) {
  const targetCountry = country.trim();
  results = results.filter(u => {
    if (u.role === 'gamer') {
      return (u.nationality || '').trim() === targetCountry;
    } else if (u.role === 'club') {
      return (u.country || '').trim() === targetCountry;
    }
    return false;
  });
}

return { results };
  return { results };
};