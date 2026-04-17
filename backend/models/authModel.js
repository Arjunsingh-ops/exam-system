const { pool } = require('../config/db');

const AuthModel = {
  async findByEmail(email) {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0] || null;
  },

  async create({ name, email, password, role }) {
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, password, role || 'student']
    );
    return result.insertId;
  },

  async findById(id) {
    const [rows] = await pool.query('SELECT id, name, email, role, created_at FROM users WHERE id = ?', [id]);
    return rows[0] || null;
  },
};

module.exports = AuthModel;
