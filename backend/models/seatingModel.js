const { pool } = require('../config/db');

const SeatingModel = {
  /**
   * Get all seating with student, room, exam details
   */
  async getAll({ exam_id, date, shift } = {}) {
    let where = 'WHERE 1=1';
    const params = [];
    if (exam_id) { where += ' AND s.exam_id = ?'; params.push(exam_id); }
    if (date)    { where += ' AND e.exam_date = ?'; params.push(date); }
    if (shift)   { where += ' AND s.shift = ?'; params.push(shift); }

    const [rows] = await pool.query(
      `SELECT s.id, s.seat_no, s.shift,
              st.name AS student_name, st.roll_no, st.department,
              r.room_no, r.block, r.floor,
              e.title AS exam_title, e.exam_date, e.subject
       FROM seating s
       JOIN students st ON s.student_id = st.id
       JOIN rooms r ON s.room_id = r.id
       JOIN exams e ON s.exam_id = e.id
       ${where}
       ORDER BY r.room_no, s.seat_no`,
      params
    );
    return rows;
  },

  /**
   * Check how many seats already allocated in a room for an exam
   */
  async getSeatCountInRoom(exam_id, room_id) {
    const [[{ cnt }]] = await pool.query(
      'SELECT COUNT(*) as cnt FROM seating WHERE exam_id = ? AND room_id = ?',
      [exam_id, room_id]
    );
    return cnt;
  },

  /**
   * Get all departments already placed in a room for this exam
   */
  async getDeptInRoom(exam_id, room_id) {
    const [rows] = await pool.query(
      `SELECT DISTINCT st.department FROM seating s
       JOIN students st ON s.student_id = st.id
       WHERE s.exam_id = ? AND s.room_id = ?`,
      [exam_id, room_id]
    );
    return rows.map(r => r.department);
  },

  /**
   * Bulk insert seating records
   */
  async bulkInsert(records) {
    if (!records.length) return 0;
    const placeholders = records.map(() => '(?, ?, ?, ?, ?)').join(', ');
    const values = records.flatMap(r => [r.exam_id, r.student_id, r.room_id, r.seat_no, r.shift]);
    const [result] = await pool.query(
      `INSERT INTO seating (exam_id, student_id, room_id, seat_no, shift) VALUES ${placeholders}`,
      values
    );
    return result.affectedRows;
  },

  /**
   * Delete all seating for an exam (to regenerate)
   */
  async deleteByExam(exam_id) {
    const [result] = await pool.query('DELETE FROM seating WHERE exam_id = ?', [exam_id]);
    return result.affectedRows;
  },

  async deleteById(id) {
    const [result] = await pool.query('DELETE FROM seating WHERE id = ?', [id]);
    return result.affectedRows;
  },

  async getByStudent(student_id) {
    const [rows] = await pool.query(
      `SELECT s.*, r.room_no, e.title AS exam_title, e.exam_date, e.subject
       FROM seating s
       JOIN rooms r ON s.room_id = r.id
       JOIN exams e ON s.exam_id = e.id
       WHERE s.student_id = ?`,
      [student_id]
    );
    return rows;
  },
};

module.exports = SeatingModel;
