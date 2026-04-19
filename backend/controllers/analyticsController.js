const analyticsService = require('../services/analyticsService');

const getOverview = async (req, res) => {
  const { date } = req.query;
  if (date) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD.' });
    }
    const data = await analyticsService.getOverviewByDate(date);
    if (!data) {
      return res.status(404).json({ error: 'No analytics found for this date.' });
    }
    return res.json(data);
  }
  const data = await analyticsService.getOverview();
  res.json(data);
};

const getAvailableDates = async (_req, res) => {
  const dates = await analyticsService.getAvailableDates();
  res.json({ dates });
};

module.exports = {
  getOverview,
  getAvailableDates,
};
