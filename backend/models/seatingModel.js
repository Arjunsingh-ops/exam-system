const { pool } = require('../config/db');

const SeatingModel = {
  async getAll({ exam_id } = {}) {
    let where = 'WHERE 1=1';
    const params = [];
    if (exam_id) { where += ' AND s.exam_id = ?'; params.push(exam_id); }

    const [rows] = await pool.query(`
      SELECT 
        s.id, s.exam_id, s.student_id, s.room_id, s.teacher_id, s.seat_no,
        st.name AS student_name, st.roll_no, st.course, st.specialization, st.semester,
        r.room_no, r.rows_count, r.cols_count, r.floor, r.block,
        t.name AS teacher_name, t.department AS teacher_dept
      FROM seating s
      JOIN students st ON s.student_id = st.id
      JOIN rooms r ON s.room_id = r.id
      LEFT JOIN teachers t ON s.teacher_id = t.id
      ${where}
      ORDER BY r.room_no, s.seat_no
    `, params);
    return rows;
  },

  async deleteByExam(exam_id) {
    const [result] = await pool.query('DELETE FROM seating WHERE exam_id = ?', [exam_id]);
    return result.affectedRows;
  },

  async deleteById(id) {
    const [result] = await pool.query('DELETE FROM seating WHERE id = ?', [id]);
    return result.affectedRows;
  },

  async bulkInsert(records) {
    if (!records.length) return 0;
    const fields = ['exam_id', 'student_id', 'room_id', 'teacher_id', 'seat_no'];
    const placeholders = records.map(() => `(${fields.map(() => '?').join(',')})`).join(',');
    const flat = records.flatMap(r => fields.map(f => r[f] || null));
    const [result] = await pool.query(
      `INSERT IGNORE INTO seating (${fields.join(',')}) VALUES ${placeholders}`, flat
    );
    return result.affectedRows;
  },
};

module.exports = SeatingModel;
