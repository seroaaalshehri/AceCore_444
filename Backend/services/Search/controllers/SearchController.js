const { runSimpleSearch, runLooseSearch, searchByGame } = require('../SearchServices'); 
const { getUserByAuthUidService } = require('../../user/userServices/userService');

async function SearchProfiles(req, res) {
  try {
    const q = (req.query.query || '').trim();
    const role = (req.query.role || '').trim();
    const isPartial = req.query.partial === '1' || req.query.partial === 'true';
    const limit = Math.max(1, Math.min(parseInt(req.query.limit || '20', 10), 50));

    if (!q) return res.status(400).json({ success: false, error: 'Missing ?query=' });

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

    const { results } = isPartial
      ? await runLooseSearch({ q, limit, role })
      : await runSimpleSearch({ q, role });

    const filtered = results.filter(r => r.id !== meId && r.id !== authUid);

    return res.json({ success: true, results: filtered });
  } catch (err) {
    console.error('❌ [SearchProfiles] error:', err);
    return res.status(500).json({ success: false, error: err.message || 'Search failed' });
  }
}


async function SearchProfilesByGame(req, res) {
  try {
    let gameId = (req.query.gameId || "").trim();
    const role = (req.query.role || "").trim();
    const minRank = req.query.minRank;
    const maxRank = req.query.maxRank;

    // incoming params logged during debugging; removed for production

    if (!gameId) {
      return res.status(400).json({ success: false, error: "Missing gameId" });
    }

    // normalize game name ("Call of Duty" → "callofduty")
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
    if (GAME_MAP[normalized]) {
      gameId = GAME_MAP[normalized];
    }

    // normalized mapping logging removed

    // Call the service we just added
    const { results } = await searchByGame({
      gameId,
      role,
      minRank,
      maxRank,
    });

    return res.json({ success: true, results });
  } catch (e) {
    console.error("❌ [SearchProfilesByGame] error:", e);
    return res.status(500).json({ success: false, error: e.message });
  }
}
module.exports = { SearchProfiles, SearchProfilesByGame };