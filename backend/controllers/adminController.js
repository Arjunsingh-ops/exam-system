const { pool } = require('../config/db');

/**
 * GET /api/admin/stats
 * Provides counts of students, rooms, exams, and seating records.
 */
const getStats = async (req, res, next) => {
  try {
    const [[{ students }]] = await pool.query('SELECT COUNT(*) as students FROM students');
    const [[{ rooms }]] = await pool.query('SELECT COUNT(*) as rooms FROM rooms');
    const [[{ exams }]] = await pool.query('SELECT COUNT(*) as exams FROM exams');
    const [[{ seating }]] = await pool.query('SELECT COUNT(*) as seating FROM seating');

    res.json({
      success: true,
      stats: {
        totalStudents: students,
        totalRooms: rooms,
        upcomingExams: exams,
        totalSeatingGenerated: seating,
      }
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getStats };
