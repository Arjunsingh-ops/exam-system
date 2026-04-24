const { pool } = require('../config/db');

const TeacherModel = {
  async getAll() {
    const [rows] = await pool.query('SELECT * FROM teachers ORDER BY name');
    return rows;
  },

  async getById(id) {
    const [rows] = await pool.query('SELECT * FROM teachers WHERE id = ?', [id]);
    return rows[0] || null;
  },

  async create(data) {
    const [result] = await pool.query(
      `INSERT INTO teachers (name, department, email, contact) VALUES (?, ?, ?, ?)`,
      [data.name, data.department || null, data.email || null, data.contact || null]
    );
    return result.insertId;
  },

  async update(id, data) {
    const allowed = ['name', 'department', 'email', 'contact'];
    const filtered = Object.fromEntries(Object.entries(data).filter(([k]) => allowed.includes(k)));
    if (!Object.keys(filtered).length) return 0;
    const fields = Object.keys(filtered).map(k => `${k} = ?`).join(', ');
    const values = [...Object.values(filtered), id];
    const [result] = await pool.query(`UPDATE teachers SET ${fields} WHERE id = ?`, values);
    return result.affectedRows;
  },

  async delete(id) {
    const [result] = await pool.query('DELETE FROM teachers WHERE id = ?', [id]);
    return result.affectedRows;
  },
};

module.exports = TeacherModel;
