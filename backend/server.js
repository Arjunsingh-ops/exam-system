require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const { testConnection } = require('./config/db');
const initDatabase = require('./config/initDb');
const errorHandler = require('./middleware/errorHandler');

const authRoutes    = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const roomRoutes    = require('./routes/roomRoutes');
const examRoutes    = require('./routes/examRoutes');
const teacherRoutes = require('./routes/teacherRoutes');
const seatingRoutes = require('./routes/seatingRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ───────────────────────────────────────────────────────────────
const allowedOrigin = process.env.CORS_ORIGIN || '*';
app.use(cors({
  origin: allowedOrigin === '*' ? '*' : allowedOrigin.split(','),
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// ─── Health ───────────────────────────────────────────────────────────────────
const handleHealth = (req, res) =>
  res.json({
    success: true,
    message: '🚀 Apex Exam Sitting Planner API is running',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });

app.get('/api/health', handleHealth);
app.get('/health', handleHealth);

// ─── Database Initialization Middleware ──────────────────────────────────────
let isInitialized = false;
let initPromise = null;

app.use(async (req, res, next) => {
  if (!isInitialized && req.path !== '/health' && req.path !== '/api/health') {
    if (!initPromise) {
      initPromise = initDatabase()
        .then(() => {
          isInitialized = true;
        })
        .catch((err) => {
          console.error('Database initialization error:', err.message);
          initPromise = null;
        });
    }
    await initPromise;
  }
  next();
});

// ─── Routes (Supported with and without /api prefix) ───────────────────────────
const adminRoutes = require('./routes/adminRoutes');

// Auth routes
app.use('/api/auth', authRoutes);
app.use('/auth', authRoutes);

// Admin routes
app.use('/api/admin', adminRoutes);
app.use('/admin-api', adminRoutes);

// Core planner routes
app.use('/api/students', studentRoutes);
app.use('/students',     studentRoutes);

app.use('/api/rooms', roomRoutes);
app.use('/rooms',     roomRoutes);

app.use('/api/exams', examRoutes);
app.use('/exams',     examRoutes);

app.use('/api/teachers', teacherRoutes);
app.use('/teachers',     teacherRoutes);

app.use('/api/seating', seatingRoutes);
app.use('/seating',     seatingRoutes);

// ─── 404 ──────────────────────────────────────────────────────────────────────
app.use((req, res) =>
  res.status(404).json({ success: false, message: `Cannot ${req.method} ${req.originalUrl}` })
);

// ─── Error handler ────────────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Startup ──────────────────────────────────────────────────────────────────
const start = async () => {
  try {
    await initDatabase();
    await testConnection();
    app.listen(PORT, () => {
      console.log(`\n🚀 Server running on http://localhost:${PORT}`);
      console.log(`📋 Health: http://localhost:${PORT}/api/health\n`);
    });
  } catch (err) {
    console.error('💥 Startup failed:', err.message);
    console.error('Full error:', err);
    if (process.env.NODE_ENV !== 'production') {
      process.exit(1);
    }
  }
};

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  start();
}

module.exports = app;
