const { runSimpleSearch, runLooseSearch } = require('../SearchServices');
const { getUserByAuthUidService } = require('../../user/userServices/userService');

async function SearchProfiles(req, res) {
  try {
    const q = (req.query.query || '').trim();      // <— ensures q always defined
    const role = (req.query.role || '').trim();
    const isPartial = req.query.partial === '1' || req.query.partial === 'true';
    const limit = Math.max(1, Math.min(parseInt(req.query.limit || '20', 10), 50));

    if (!q) return res.status(400).json({ success: false, error: 'Missing ?query=' });

    // (Optional) identify current user
    const authUid = req.user?.uid || null;
    let meId = null;
    if (authUid) {
      try {
        const me = await getUserByAuthUidService(authUid);
        meId = me?.id || null;
      } catch (_) {
        meId = authUid;
      }
    }

    // choose which search to run
    const { results } = isPartial
      ? await runLooseSearch({ q, limit, role })
      : await runSimpleSearch({ q, role });

    // hide self only if searching yourself
    const filtered = results.filter(r => r.id !== meId && r.id !== authUid);

    return res.json({ success: true, results: filtered });
  } catch (err) {
    console.error('❌ [SearchProfiles] error:', err);
    return res.status(500).json({ success: false, error: err.message || 'Search failed' });
  }
}

module.exports = { SearchProfiles };