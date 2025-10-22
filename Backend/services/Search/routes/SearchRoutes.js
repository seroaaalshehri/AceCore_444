const express = require('express');
const router = express.Router();

const authenticate = require('../../../middlewares/auth');
const { SearchProfiles } = require('../controllers/SearchController');

// GET /api/Search?query=ace
router.get('/', authenticate, SearchProfiles);

module.exports = router;