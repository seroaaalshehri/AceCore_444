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