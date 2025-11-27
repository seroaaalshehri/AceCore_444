const express = require('express');
const router = express.Router();

const authenticate = require('../../../middlewares/auth');
const { SearchProfiles, SearchProfilesByGame } = require('../controllers/SearchController');
// GET /api/Search?query=ace
router.get('/', authenticate, SearchProfiles);
// Keep the existing camelCase path for backward-compatibility
router.get('/SearchByGame', authenticate, SearchProfilesByGame);
// Preferred lowercase hyphenated path used by frontend: /api/Search/by-game
router.get('/by-game', authenticate, SearchProfilesByGame);


module.exports = router;