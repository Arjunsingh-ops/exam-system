const puppeteer = require('puppeteer');
const ExamModel = require('../models/examModel');
const SeatingModel = require('../models/seatingModel');
const RoomModel = require('../models/roomModel');
const StudentModel = require('../models/studentModel');
const { pool } = require('../config/db');

/**
 * GET /api/seating?exam_id=&date=&shift=
 */
const getSeating = async (req, res, next) => {
  try {
    const { exam_id, date, shift } = req.query;
    const records = await SeatingModel.getAll({ exam_id, date, shift });
    res.json({ success: true, count: records.length, seating: records });
  } catch (err) { next(err); }
};

/**
 * GET /api/seating/student/:student_id
 */
const getStudentSeating = async (req, res, next) => {
  try {
    const records = await SeatingModel.getByStudent(req.params.student_id);
    res.json({ success: true, seating: records });
  } catch (err) { next(err); }
};

/**
 * DELETE /api/seating/:id
 */
const deleteSeat = async (req, res, next) => {
  try {
    const affected = await SeatingModel.deleteById(req.params.id);
    if (!affected) return res.status(404).json({ success: false, message: 'Seating record not found.' });
    res.json({ success: true, message: 'Seating record deleted.' });
  } catch (err) { next(err); }
};

/**
 * POST /api/seating/generate
 * Body: { exam_id, room_ids: [1, 2, 3] }
 *
 * Algorithm:
 * 1. Fetch exam + students for that exam's dept/semester (or all if none specified)
 * 2. Group students by department
 * 3. Interleave departments so no two same-dept students sit adjacent
 * 4. For each room (ordered by capacity), fill seats respecting capacity
 * 5. Seat format: R{row}-C{col}
 */
const generateSeating = async (req, res, next) => {
  try {
    const { exam_id, room_ids } = req.body;

    const exam = await ExamModel.getById(exam_id);
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found.' });

    // Fetch all students (optionally filter by exam's department/semester/exam_type)
    let query = 'SELECT id, name, roll_no, department, semester, exam_type FROM students';
    const params = [];
    const conditions = [];
    if (exam.exam_type)  { conditions.push('exam_type = ?');  params.push(exam.exam_type); }
    if (exam.department) { conditions.push('department = ?'); params.push(exam.department); }
    if (exam.semester)   { conditions.push('semester = ?');   params.push(exam.semester); }
    if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY department, roll_no';

    const [students] = await pool.query(query, params);
    if (!students.length) {
      return res.status(400).json({ success: false, message: 'No students found matching exam criteria.' });
    }

    // Fetch rooms and validate
    const rooms = [];
    for (const rid of room_ids) {
      const room = await RoomModel.getById(rid);
      if (!room) return res.status(404).json({ success: false, message: `Room ID ${rid} not found.` });
      rooms.push(room);
    }

    const totalCapacity = rooms.reduce((sum, r) => sum + r.capacity, 0);
    if (students.length > totalCapacity) {
      return res.status(400).json({
        success: false,
        message: `Not enough room capacity. Students: ${students.length}, Total capacity: ${totalCapacity}`,
      });
    }

    // Group students by department
    const deptMap = {};
    for (const s of students) {
      if (!deptMap[s.department]) deptMap[s.department] = [];
      deptMap[s.department].push(s);
    }

    // Interleave: alternate departments so same-dept students don't sit together
    const interleaved = interleaveByDepartment(deptMap);

    // Delete old seating for this exam first (regenerate)
    await SeatingModel.deleteByExam(exam_id);

    // Assign seats room by room
    const seatingRecords = [];
    let studentIdx = 0;

    for (const room of rooms) {
      const cols = Math.ceil(Math.sqrt(room.capacity)); // grid width
      let seatNum = 1;

      while (studentIdx < interleaved.length && seatNum <= room.capacity) {
        const student = interleaved[studentIdx];
        const row = Math.ceil(seatNum / cols);
        const col = seatNum - (row - 1) * cols;
        const seat_no = `R${row}-C${col}`;

        seatingRecords.push({
          exam_id,
          student_id: student.id,
          room_id: room.id,
          seat_no,
          shift: exam.shift,
        });

        studentIdx++;
        seatNum++;
      }

      if (studentIdx >= interleaved.length) break;
    }

    await SeatingModel.bulkInsert(seatingRecords);
    const generated = await SeatingModel.getAll({ exam_id });

    res.status(201).json({
      success: true,
      message: `Seating plan generated for ${seatingRecords.length} students.`,
      exam,
      seating: generated,
    });
  } catch (err) { next(err); }
};

/**
 * Interleave students from different departments cyclically
 * so no two adjacent students are from the same department
 */
function interleaveByDepartment(deptMap) {
  const depts = Object.values(deptMap);
  const result = [];

  // Sort so largest departments get spread first
  depts.sort((a, b) => b.length - a.length);

  let remaining = depts.filter(d => d.length > 0);
  while (remaining.some(d => d.length > 0)) {
    for (const dept of remaining) {
      if (dept.length > 0) result.push(dept.shift());
    }
    remaining = remaining.filter(d => d.length > 0);
  }
  return result;
}

/**
 * GET /api/seating/pdf?exam_id=&date=&shift=
 */
const downloadPDF = async (req, res, next) => {
  try {
    const { exam_id, date, shift } = req.query;
    const records = await SeatingModel.getAll({ exam_id, date, shift });

    if (!records.length) {
      return res.status(404).json({ success: false, message: 'No seating data found for the given filters.' });
    }

    // Get exam details
    let examTitle = 'Exam Seating Plan';
    let examDateStr = date || '';
    let examShift = shift || '';
    if (exam_id) {
      const exam = await ExamModel.getById(exam_id);
      if (exam) {
        examTitle = exam.title;
        examDateStr = exam.exam_date ? new Date(exam.exam_date).toLocaleDateString('en-IN') : examDateStr;
        examShift = exam.shift || examShift;

        // Ensure PDF can only be downloaded within 2 hours of the exam start time
        if (exam.exam_date && exam.start_time) {
          const dateStr = new Date(exam.exam_date).toISOString().split('T')[0];
          const examDateTime = new Date(`${dateStr}T${exam.start_time}`);
          const now = new Date();
          const diffHours = (examDateTime - now) / (1000 * 60 * 60);

          if (diffHours > 2) {
            return res.status(403).json({ 
              success: false, 
              message: 'Seating plan can only be downloaded starting 2 hours before the exam.' 
            });
          }
        }
      }
    }

    // Group records by room
    const roomMap = {};
    for (const r of records) {
      if (!roomMap[r.room_no]) roomMap[r.room_no] = [];
      roomMap[r.room_no].push(r);
    }

    const roomTables = Object.entries(roomMap).map(([room_no, seats]) => `
      <div class="room-section">
        <h3>Room: ${room_no}</h3>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Seat No</th>
              <th>Student Name</th>
              <th>Roll No</th>
              <th>Department</th>
              <th>Shift</th>
            </tr>
          </thead>
          <tbody>
            ${seats.map((s, i) => `
              <tr>
                <td>${i + 1}</td>
                <td>${s.seat_no}</td>
                <td>${s.student_name}</td>
                <td>${s.roll_no}</td>
                <td>${s.department}</td>
                <td>${s.shift}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
    `).join('');

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8"/>
      <title>${examTitle}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1a1a2e; background: #fff; }
        .header { background: linear-gradient(135deg, #4f46e5, #7c3aed); color: white; padding: 32px 40px; }
        .header h1 { font-size: 24px; font-weight: 700; }
        .header .meta { display: flex; gap: 32px; margin-top: 12px; font-size: 14px; opacity: 0.9; }
        .header .meta span { display: flex; align-items: center; gap: 6px; }
        .content { padding: 24px 40px; }
        .summary { display: flex; gap: 16px; margin-bottom: 24px; }
        .summary-card { flex: 1; background: #f4f3ff; border: 1px solid #e0e7ff; border-radius: 8px; padding: 16px; text-align: center; }
        .summary-card .number { font-size: 28px; font-weight: 700; color: #4f46e5; }
        .summary-card .label { font-size: 12px; color: #64748b; margin-top: 4px; }
        .room-section { margin-bottom: 28px; page-break-inside: avoid; }
        .room-section h3 { font-size: 16px; font-weight: 600; color: #4f46e5; border-bottom: 2px solid #e0e7ff; padding-bottom: 8px; margin-bottom: 12px; }
        table { width: 100%; border-collapse: collapse; font-size: 13px; }
        thead tr { background: #4f46e5; color: white; }
        th { padding: 10px 12px; text-align: left; }
        td { padding: 9px 12px; border-bottom: 1px solid #f1f5f9; }
        tbody tr:nth-child(even) { background: #f8fafc; }
        .footer { text-align: center; font-size: 11px; color: #94a3b8; padding: 16px; border-top: 1px solid #e2e8f0; margin-top: 16px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${examTitle}</h1>
        <div class="meta">
          <span>📅 Date: ${examDateStr}</span>
          <span>🕐 Shift: ${examShift}</span>
          <span>🏫 Rooms: ${Object.keys(roomMap).length}</span>
          <span>👥 Students: ${records.length}</span>
        </div>
      </div>
      <div class="content">
        <div class="summary">
          <div class="summary-card"><div class="number">${records.length}</div><div class="label">Total Students</div></div>
          <div class="summary-card"><div class="number">${Object.keys(roomMap).length}</div><div class="label">Rooms Used</div></div>
          <div class="summary-card"><div class="number">${[...new Set(records.map(r => r.department))].length}</div><div class="label">Departments</div></div>
        </div>
        ${roomTables}
      </div>
      <div class="footer">Generated on ${new Date().toLocaleString('en-IN')} • Exam Seating Management System</div>
    </body>
    </html>`;

    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '0', right: '0', bottom: '0', left: '0' } });
    await browser.close();

    const filename = `Seating_Plan_${examDateStr || 'all'}_${examShift || 'all'}.pdf`.replace(/\s+/g, '_');
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': pdfBuffer.length,
    });
    res.end(pdfBuffer);
  } catch (err) { next(err); }
};

module.exports = { getSeating, getStudentSeating, generateSeating, deleteSeat, downloadPDF };
