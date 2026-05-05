const { pool } = require('../config/db');

const StudentModel = {
  async getAll({ search = '', program = '', semester = '', page = 1, limit = 50 } = {}) {
    const offset = (page - 1) * limit;
    let where = 'WHERE 1=1';
    const params = [];

    if (search) {
      where += ' AND (name LIKE ? OR roll_no LIKE ? OR enrollment_no LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (program) { where += ' AND program = ?'; params.push(program); }
    if (semester) { where += ' AND semester = ?'; params.push(Number(semester)); }

    const [rows] = await pool.query(
      `SELECT * FROM students ${where} ORDER BY program, semester, roll_no LIMIT ? OFFSET ?`,
      [...params, Number(limit), Number(offset)]
    );
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) as total FROM students ${where}`, params
    );
    return { students: rows, total, page: Number(page), limit: Number(limit) };
  },

  async getById(id) {
    const [rows] = await pool.query('SELECT * FROM students WHERE id = ?', [id]);
    return rows[0] || null;
  },

  async create(data) {
    const fields = ['name', 'roll_no', 'enrollment_no', 'program', 'batch', 'specialization', 'year', 'semester', 'email', 'contact'];
    const values = fields.map(f => data[f] || null);
    const placeholders = fields.map(() => '?').join(', ');
    const [result] = await pool.query(
      `INSERT INTO students (${fields.join(', ')}) VALUES (${placeholders})`, values
    );
    return result.insertId;
  },

  async update(id, data) {
    const fields = Object.keys(data).map(k => `${k} = ?`).join(', ');
    const values = [...Object.values(data), id];
    const [result] = await pool.query(`UPDATE students SET ${fields} WHERE id = ?`, values);
    return result.affectedRows;
  },

  async delete(id) {
    const [result] = await pool.query('DELETE FROM students WHERE id = ?', [id]);
    return result.affectedRows;
  },

  async deleteAll() {
    const [result] = await pool.query('DELETE FROM students');
    return result.affectedRows;
  },

  async bulkCreate(students) {
    if (!students.length) return 0;
    const fields = ['name', 'roll_no', 'enrollment_no', 'program', 'batch', 'specialization', 'year', 'semester', 'email', 'contact'];
    const values = students.map(s => fields.map(f => s[f] || null));
    const placeholders = students.map(() => `(${fields.map(() => '?').join(',')})`).join(',');
    const flat = values.flat();
    const [result] = await pool.query(
      `INSERT IGNORE INTO students (${fields.join(',')}) VALUES ${placeholders}`, flat
    );
    return result.affectedRows;
  },

  async getPrograms() {
    const [rows] = await pool.query('SELECT DISTINCT program FROM students ORDER BY program');
    return rows.map(r => r.program);
  },

  async getStats() {
    const [[{ total }]] = await pool.query('SELECT COUNT(*) as total FROM students');
    const [programs] = await pool.query('SELECT DISTINCT program FROM students');
    const [sems] = await pool.query('SELECT DISTINCT semester FROM students ORDER BY semester');
    return { total, programs: programs.length, semesters: sems.map(r => r.semester) };
  },
};

module.exports = StudentModel;
