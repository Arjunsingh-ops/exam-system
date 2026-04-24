const { pool } = require('../config/db');

const RoomModel = {
  async getAll() {
    const [rows] = await pool.query('SELECT * FROM rooms ORDER BY block, floor, room_no');
    return rows;
  },

  async getById(id) {
    const [rows] = await pool.query('SELECT * FROM rooms WHERE id = ?', [id]);
    return rows[0] || null;
  },

  async create(data) {
    const [result] = await pool.query(
      `INSERT INTO rooms (room_no, capacity, rows_count, cols_count, floor, block) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [data.room_no, data.capacity, data.rows_count || 5, data.cols_count || 6,
       data.floor || null, data.block || null]
    );
    return result.insertId;
  },

  async update(id, data) {
    const allowed = ['room_no', 'capacity', 'rows_count', 'cols_count', 'floor', 'block'];
    const filtered = Object.fromEntries(Object.entries(data).filter(([k]) => allowed.includes(k)));
    if (!Object.keys(filtered).length) return 0;
    const fields = Object.keys(filtered).map(k => `${k} = ?`).join(', ');
    const values = [...Object.values(filtered), id];
    const [result] = await pool.query(`UPDATE rooms SET ${fields} WHERE id = ?`, values);
    return result.affectedRows;
  },

  async delete(id) {
    const [result] = await pool.query('DELETE FROM rooms WHERE id = ?', [id]);
    return result.affectedRows;
  },
};

module.exports = RoomModel;
