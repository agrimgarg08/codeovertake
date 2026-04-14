require('dotenv').config();
const cron = require('node-cron');
const connectDB = require('./config/db');
const app = require('./app');
const { updateAllStudents } = require('./cron/updateData');

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });

  // Schedule cron job (default: 12:00 AM IST = 18:30 UTC)
  const schedule = process.env.CRON_SCHEDULE || '30 18 * * *';
  cron.schedule(schedule, () => {
    console.log('[CRON] Scheduled data update triggered');
    updateAllStudents().catch((err) => console.error('[CRON] Update error:', err));
  });
  console.log(`Cron job scheduled: ${schedule}`);
});
