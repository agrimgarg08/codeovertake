const express = require('express');
const { asyncHandler } = require('../middlewares');
const ctrl = require('../controllers/leaderboardController');
const { getAllPlatforms } = require('../platforms');

const router = express.Router();
const platforms = getAllPlatforms();

// GET /api/leaderboard
router.get('/', asyncHandler(ctrl.getLeaderboard));

// GET /api/leaderboard/filters
router.get('/filters', asyncHandler(ctrl.getFilters));

// GET /api/leaderboard/top-gainers
router.get('/top-gainers', asyncHandler(ctrl.getTopGainers));

// GET /api/leaderboard/history/:date
router.get('/history/:date', asyncHandler(ctrl.getHistoricalLeaderboard));

// Platform-specific leaderboard endpoints: /api/leaderboard/github, etc.
for (const p of platforms) {
  router.get(`/${p.key}`, asyncHandler(ctrl.getPlatformLeaderboard(p.key)));
}

// GET /api/leaderboard/combined
router.get('/combined', asyncHandler(ctrl.getPlatformLeaderboard('all')));

module.exports = router;
