const express = require('express');
const { asyncHandler } = require('../middlewares');
const ctrl = require('../controllers/analyticsController');

const router = express.Router();

// GET /api/analytics/overview          — today (or ?date=YYYY-MM-DD for historical)
router.get('/overview', asyncHandler(ctrl.getOverview));

// GET /api/analytics/dates             — list of available cached dates
router.get('/dates', asyncHandler(ctrl.getAvailableDates));

module.exports = router;
