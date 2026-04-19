const express = require('express');
const { asyncHandler } = require('../middlewares');
const ctrl = require('../controllers/analyticsController');

const router = express.Router();

// GET /api/analytics/overview
router.get('/overview', asyncHandler(ctrl.getOverview));

module.exports = router;
