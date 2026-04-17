const { pool } = require('../config/db');

const ExamModel = {
  async getAll() {
    const [rows] = await pool.query('SELECT * FROM exams ORDER BY exam_date DESC, shift');
    return rows;
  },

  async getById(id) {
    const [rows] = await pool.query('SELECT * FROM exams WHERE id = ?', [id]);
    return rows[0] || null;
  },

  async create(data) {
    const [result] = await pool.query(
      `INSERT INTO exams (title, subject, exam_date, shift, start_time, end_time, department, semester)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.title, data.subject || null, data.exam_date, data.shift,
       data.start_time || null, data.end_time || null,
       data.department || null, data.semester || null]
    );
    return result.insertId;
  },

  async update(id, data) {
    const fields = Object.keys(data).map(k => `${k} = ?`).join(', ');
    const values = [...Object.values(data), id];
    const [result] = await pool.query(`UPDATE exams SET ${fields} WHERE id = ?`, values);
    return result.affectedRows;
  },

  async delete(id) {
    const [result] = await pool.query('DELETE FROM exams WHERE id = ?', [id]);
    return result.affectedRows;
  },
};

module.exports = ExamModel;
