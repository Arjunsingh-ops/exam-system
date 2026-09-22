const { pool } = require('../config/db');

const SeatingModel = {
  async getAll({ exam_id } = {}) {
    let where = 'WHERE 1=1';
    const params = [];
    if (exam_id) { where += ' AND s.exam_id = ?'; params.push(exam_id); }

    const [rows] = await pool.query(`
      SELECT 
        s.id, s.exam_id, s.student_id, s.room_id, s.teacher_id, s.seat_no,
        st.name AS student_name, st.roll_no, st.enrollment_no, st.program, st.specialization, st.year, st.semester,
        r.room_no, r.capacity AS room_capacity, r.rows_count, r.cols_count, r.floor, r.block,
        t.name AS teacher_name, t.department AS teacher_dept
      FROM seating s
      JOIN students st ON s.student_id = st.id
      JOIN rooms r ON s.room_id = r.id
      LEFT JOIN teachers t ON s.teacher_id = t.id
      ${where}
      ORDER BY r.room_no, CAST(SUBSTRING_INDEX(SUBSTRING_INDEX(s.seat_no, '-C', 1), 'R', -1) AS UNSIGNED), CAST(SUBSTRING_INDEX(s.seat_no, '-C', -1) AS UNSIGNED)
    `, params);
    return rows;
  },

  async deleteByExam(exam_id, conn = pool) {
    const [result] = await conn.query('DELETE FROM seating WHERE exam_id = ?', [exam_id]);
    return result.affectedRows;
  },

  async deleteById(id, conn = pool) {
    const [result] = await conn.query('DELETE FROM seating WHERE id = ?', [id]);
    return result.affectedRows;
  },

  async bulkInsert(records, conn = pool) {
    if (!records.length) return 0;
    const fields = ['exam_id', 'student_id', 'room_id', 'teacher_id', 'seat_no'];
    const placeholders = records.map(() => `(${fields.map(() => '?').join(',')})`).join(',');
    const flat = records.flatMap(r => fields.map(f => r[f] || null));
    const [result] = await conn.query(
      `INSERT INTO seating (${fields.join(',')}) VALUES ${placeholders}`, flat
    );
    return result.affectedRows;
  },
};

module.exports = SeatingModel;
