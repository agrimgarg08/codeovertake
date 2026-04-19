const analyticsService = require('../services/analyticsService');

const getOverview = async (req, res) => {
  const data = await analyticsService.getOverview();
  res.json(data);
};

module.exports = {
  getOverview,
};
