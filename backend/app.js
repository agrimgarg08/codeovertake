const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { errorHandler } = require('./middlewares');

const studentRoutes = require('./routes/students');
const leaderboardRoutes = require('./routes/leaderboard');
const adminRoutes = require('./routes/admin');

const app = express();

// Security
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT'],
}));

// Rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter limits for write endpoints (register + edit)
const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
});

// Body parsing
app.use(express.json());

// Routes
app.use('/api/students', generalLimiter, studentRoutes);
app.use('/api/leaderboard', generalLimiter, leaderboardRoutes);
app.use('/api/admin', generalLimiter, adminRoutes);

// Apply stricter limits to write endpoints
app.post('/api/students/register', writeLimiter);
app.put('/api/students/:rollno/usernames', writeLimiter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Global error handler (must be last)
app.use(errorHandler);

module.exports = app;
