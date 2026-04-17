const { pool } = require('../config/db');

const StudentModel = {
  async getAll({ search = '', department = '', page = 1, limit = 20 } = {}) {
    const offset = (page - 1) * limit;
    let where = 'WHERE 1=1';
    const params = [];

    if (search) {
      where += ' AND (s.name LIKE ? OR s.roll_no LIKE ? OR s.enrollment_no LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (department) {
      where += ' AND s.department = ?';
      params.push(department);
    }

    const [rows] = await pool.query(
      `SELECT s.* FROM students s ${where} ORDER BY s.id DESC LIMIT ? OFFSET ?`,
      [...params, Number(limit), Number(offset)]
    );
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) as total FROM students s ${where}`, params
    );
    return { students: rows, total, page: Number(page), limit: Number(limit) };
  },

  async getById(id) {
    const [rows] = await pool.query('SELECT * FROM students WHERE id = ?', [id]);
    return rows[0] || null;
  },

  async getByUserId(userId) {
    const [rows] = await pool.query('SELECT * FROM students WHERE user_id = ?', [userId]);
    return rows[0] || null;
  },

  async create(data) {
    const fields = Object.keys(data);
    const values = Object.values(data);
    const placeholders = fields.map(() => '?').join(', ');
    const [result] = await pool.query(
      `INSERT INTO students (${fields.join(', ')}) VALUES (${placeholders})`,
      values
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

  async bulkCreate(students) {
    if (!students.length) return 0;
    const fields = ['name', 'roll_no', 'enrollment_no', 'department', 'program',
      'specialization', 'year', 'semester', 'section', 'email', 'contact', 'exam_type'];
    const values = students.map(s => fields.map(f => s[f] || null));
    const placeholders = students.map(() => `(${fields.map(() => '?').join(',')})`).join(',');
    const flat = values.flat();
    const [result] = await pool.query(
      `INSERT IGNORE INTO students (${fields.join(',')}) VALUES ${placeholders}`, flat
    );
    return result.affectedRows;
  },

  async getDepartments() {
    const [rows] = await pool.query('SELECT DISTINCT department FROM students ORDER BY department');
    return rows.map(r => r.department);
  },
};

module.exports = StudentModel;
