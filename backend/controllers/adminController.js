const { updateAllStudents } = require('../cron/updateData');

const triggerUpdate = async (req, res) => {
  updateAllStudents().catch((err) => console.error('[ADMIN] Update error:', err));
  res.json({ message: 'Data update triggered' });
};

module.exports = { triggerUpdate };
