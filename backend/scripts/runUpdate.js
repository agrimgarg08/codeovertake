const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const connectDB = require('../config/db');
const { updateAllStudents } = require('../cron/updateData');

connectDB().then(() => updateAllStudents()).then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
