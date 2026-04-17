const { pool } = require('../config/db');

const RoomModel = {
  async getAll() {
    const [rows] = await pool.query('SELECT * FROM rooms ORDER BY room_no');
    return rows;
  },

  async getById(id) {
    const [rows] = await pool.query('SELECT * FROM rooms WHERE id = ?', [id]);
    return rows[0] || null;
  },

  async create(data) {
    const [result] = await pool.query(
      'INSERT INTO rooms (room_no, capacity, benches, floor, block) VALUES (?, ?, ?, ?, ?)',
      [data.room_no, data.capacity, data.benches, data.floor || null, data.block || null]
    );
    return result.insertId;
  },

  async update(id, data) {
    const fields = Object.keys(data).map(k => `${k} = ?`).join(', ');
    const values = [...Object.values(data), id];
    const [result] = await pool.query(`UPDATE rooms SET ${fields} WHERE id = ?`, values);
    return result.affectedRows;
  },

  async delete(id) {
    const [result] = await pool.query('DELETE FROM rooms WHERE id = ?', [id]);
    return result.affectedRows;
  },
};

module.exports = RoomModel;
