const { pool } = require('../config/db');

const ExamModel = {
  async getAll() {
    const [rows] = await pool.query('SELECT * FROM exams ORDER BY exam_date DESC, start_time');
    return rows;
  },

  async getById(id) {
    const [rows] = await pool.query('SELECT * FROM exams WHERE id = ?', [id]);
    return rows[0] || null;
  },

  async create(data) {
    const [result] = await pool.query(
      `INSERT INTO exams (title, course_name, course_code, programs, semester, exam_type, exam_date, start_time, end_time)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.title, data.course_name, data.course_code || null, data.programs,
       data.semester, data.exam_type, data.exam_date, data.start_time, data.end_time]
    );
    return result.insertId;
  },

  async update(id, data) {
    const allowed = ['title', 'course_name', 'course_code', 'programs', 'semester', 'exam_type', 'exam_date', 'start_time', 'end_time'];
    const filtered = Object.fromEntries(Object.entries(data).filter(([k]) => allowed.includes(k)));
    if (!Object.keys(filtered).length) return 0;
    const fields = Object.keys(filtered).map(k => `${k} = ?`).join(', ');
    const values = [...Object.values(filtered), id];
    const [result] = await pool.query(`UPDATE exams SET ${fields} WHERE id = ?`, values);
    return result.affectedRows;
  },

  async delete(id) {
    const [result] = await pool.query('DELETE FROM exams WHERE id = ?', [id]);
    return result.affectedRows;
  },
};

module.exports = ExamModel;
