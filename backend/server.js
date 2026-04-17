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
const seatingRoutes = require('./routes/seatingRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) =>
  res.json({ success: true, message: 'Exam Seating API is running 🚀', timestamp: new Date() })
);

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth',     authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/rooms',    roomRoutes);
app.use('/api/exams',    examRoutes);
app.use('/api/seating',  seatingRoutes);

// ─── 404 handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Cannot ${req.method} ${req.originalUrl}` });
});

// ─── Global error handler ────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Startup ─────────────────────────────────────────────────────────────────
const start = async () => {
  try {
    await initDatabase();   // Run schema.sql on startup
    await testConnection(); // Verify pool connection
    app.listen(PORT, () => {
      console.log(`\n🚀 Server running on http://localhost:${PORT}`);
      console.log(`📋 API docs available at http://localhost:${PORT}/api/health\n`);
    });
  } catch (err) {
    console.error('💥 Server failed to start:', err.message);
    process.exit(1);
  }
};

start();
