const puppeteer = require('puppeteer');
const ExamModel = require('../models/examModel');
const SeatingModel = require('../models/seatingModel');
const RoomModel = require('../models/roomModel');
const TeacherModel = require('../models/teacherModel');
const { pool } = require('../config/db');

// ─── GET /api/seating?exam_id= ───────────────────────────────────────────────
const getSeating = async (req, res, next) => {
  try {
    const { exam_id } = req.query;
    const records = await SeatingModel.getAll({ exam_id });
    res.json({ success: true, count: records.length, seating: records });
  } catch (err) { next(err); }
};

// ─── DELETE /api/seating/:id ─────────────────────────────────────────────────
const deleteSeat = async (req, res, next) => {
  try {
    const affected = await SeatingModel.deleteById(req.params.id);
    if (!affected) return res.status(404).json({ success: false, message: 'Record not found.' });
    res.json({ success: true, message: 'Seating record deleted.' });
  } catch (err) { next(err); }
};

// ─── DELETE /api/seating/exam/:exam_id ───────────────────────────────────────
const clearSeatingForExam = async (req, res, next) => {
  try {
    const count = await SeatingModel.deleteByExam(req.params.exam_id);
    res.json({ success: true, message: `Cleared ${count} seating records.` });
  } catch (err) { next(err); }
};

// ─── POST /api/seating/generate ──────────────────────────────────────────────
/**
 * Body: { exam_id, room_ids: [1,2,3], teacher_ids: [1,2,3] }
 *
 * Algorithm (Column-based multi-program interleaving):
 * 1. Fetch exam → get programs (comma-separated) + semester
 * 2. Fetch students matching ANY of the exam's programs + semester
 * 3. Group students by program
 * 4. Fill grid COLUMN-BY-COLUMN: each column cycles through program groups
 *    so that same-program students sit behind each other (vertically)
 *    but adjacent columns have different programs (horizontally)
 * 5. This ensures:
 *    - Students from DIFFERENT programs sit next to each other in a row
 *    - Students from the SAME program sit in the same column (behind each other)
 *    - Columns alternate between programs
 */
const generateSeating = async (req, res, next) => {
  try {
    const { exam_id, room_ids, teacher_ids = [] } = req.body;

    if (!exam_id) return res.status(400).json({ success: false, message: 'exam_id is required.' });
    if (!room_ids?.length) return res.status(400).json({ success: false, message: 'At least one room is required.' });

    const exam = await ExamModel.getById(exam_id);
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found.' });

    // Parse programs (comma-separated)
    const programList = exam.programs.split(',').map(p => p.trim()).filter(Boolean);
    if (!programList.length) {
      return res.status(400).json({ success: false, message: 'No programs defined for this exam.' });
    }

    // Fetch students matching any of the exam's programs + semester
    const placeholders = programList.map(() => '?').join(',');
    const [students] = await pool.query(
      `SELECT id, name, roll_no, program, specialization, year, semester 
       FROM students WHERE program IN (${placeholders}) AND semester = ? 
       ORDER BY program, specialization, roll_no`,
      [...programList, exam.semester]
    );

    if (!students.length) {
      return res.status(400).json({
        success: false,
        message: `No students found for Programs: "${programList.join(', ')}", Semester: ${exam.semester}. Please upload student data first.`,
      });
    }

    // Fetch and validate rooms
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
        message: `Insufficient capacity. Students: ${students.length}, Total seats: ${totalCapacity}. Add more rooms.`,
      });
    }

    // Fetch teachers if provided
    const teachers = [];
    for (const tid of teacher_ids) {
      const t = await TeacherModel.getById(tid);
      if (t) teachers.push(t);
    }

    // ── Group students by program ─────────────────────────────────────────────
    const programMap = {};
    for (const s of students) {
      const key = s.program || 'General';
      if (!programMap[key]) programMap[key] = [];
      programMap[key].push(s);
    }
    const programKeys = Object.keys(programMap);
    // Sort programs by size (largest first) for better distribution
    programKeys.sort((a, b) => programMap[b].length - programMap[a].length);

    // ── Clear old seating for this exam ───────────────────────────────────────
    await SeatingModel.deleteByExam(exam_id);

    // ── Assign seats room by room using column-based interleaving ─────────────
    const seatingRecords = [];
    let globalProgramOffset = 0; // tracks which program starts each room
    
    // Create a flat queue of students per program for sequential consumption
    const programQueues = {};
    for (const key of programKeys) {
      programQueues[key] = [...programMap[key]];
    }

    for (let ri = 0; ri < rooms.length; ri++) {
      const room = rooms[ri];
      const teacher = teachers.length > 0 ? teachers[ri % teachers.length] : null;
      const rows = room.rows_count || Math.ceil(Math.sqrt(room.capacity));
      const cols = room.cols_count || Math.ceil(room.capacity / rows);

      let seatNum = 0;
      const allExhausted = () => programKeys.every(k => programQueues[k].length === 0);

      // Fill column-by-column
      for (let c = 1; c <= cols; c++) {
        if (allExhausted()) break;

        // Each column is assigned a starting program (offset by column index)
        // This ensures adjacent columns start with different programs
        const colProgramIndex = (c - 1 + globalProgramOffset) % programKeys.length;

        for (let r = 1; r <= rows; r++) {
          if (allExhausted()) break;
          seatNum++;
          if (seatNum > room.capacity) break;

          // For each row in a column, pick the next student from the assigned program
          // The program for this row alternates: row 1 = programA, row 2 = programB, etc.
          // But the starting program for each column is offset
          const rowProgramIndex = (colProgramIndex + (r - 1)) % programKeys.length;
          
          // Try to find a student from the target program
          let student = null;
          let triedPrograms = 0;
          let tryIndex = rowProgramIndex;
          
          while (triedPrograms < programKeys.length) {
            const targetProgram = programKeys[tryIndex % programKeys.length];
            if (programQueues[targetProgram].length > 0) {
              student = programQueues[targetProgram].shift();
              break;
            }
            tryIndex++;
            triedPrograms++;
          }

          if (!student) break; // All programs exhausted

          seatingRecords.push({
            exam_id,
            student_id: student.id,
            room_id: room.id,
            teacher_id: teacher ? teacher.id : null,
            seat_no: `R${r}-C${c}`,
          });
        }
      }

      globalProgramOffset += 1; // Next room starts with a different program offset
      if (programKeys.every(k => programQueues[k].length === 0)) break;
    }

    await SeatingModel.bulkInsert(seatingRecords);
    const generated = await SeatingModel.getAll({ exam_id });

    res.status(201).json({
      success: true,
      message: `Seating plan generated for ${seatingRecords.length} students across ${rooms.length} room(s).`,
      exam,
      total_students: seatingRecords.length,
      rooms_used: rooms.length,
      seating: generated,
    });
  } catch (err) { next(err); }
};

// ─── GET /api/seating/pdf?exam_id= ───────────────────────────────────────────
const downloadPDF = async (req, res, next) => {
  try {
    const { exam_id } = req.query;
    if (!exam_id) return res.status(400).json({ success: false, message: 'exam_id is required.' });

    const exam = await ExamModel.getById(exam_id);
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found.' });

    const records = await SeatingModel.getAll({ exam_id });
    if (!records.length) {
      return res.status(404).json({ success: false, message: 'No seating plan found. Generate first.' });
    }

    // Group by room
    const roomMap = {};
    for (const r of records) {
      if (!roomMap[r.room_no]) {
        roomMap[r.room_no] = {
          room_no: r.room_no,
          floor: r.floor,
          block: r.block,
          teacher_name: r.teacher_name,
          teacher_dept: r.teacher_dept,
          seats: [],
        };
      }
      roomMap[r.room_no].seats.push(r);
    }

    const examDate = exam.exam_date
      ? new Date(exam.exam_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
      : '—';

    const examTypeBadgeColor = {
      'End Sem': '#059669',
      'Mid Sem': '#2563eb',
      'Back Exam': '#dc2626',
    }[exam.exam_type] || '#6b7280';

    // Parse programs for display
    const programList = exam.programs.split(',').map(p => p.trim()).filter(Boolean);

    const roomSections = Object.values(roomMap).map(room => `
      <div class="room-section">
        <div class="room-header">
          <div class="room-title">
            <span class="room-icon">🏫</span>
            <div>
              <h3>Room: ${room.room_no}</h3>
              <span class="room-meta">${[room.block ? 'Block ' + room.block : '', room.floor ? 'Floor ' + room.floor : ''].filter(Boolean).join(' • ')}</span>
            </div>
          </div>
          <div class="invigilator-tag">
            <span style="opacity:0.7">Invigilator:</span>
            <strong>${room.teacher_name || '—'}</strong>
            ${room.teacher_dept ? `<span style="opacity:0.7">(${room.teacher_dept})</span>` : ''}
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Seat No</th>
              <th>Student Name</th>
              <th>Roll No</th>
              <th>Program</th>
              <th>Specialization</th>
              <th>Year</th>
            </tr>
          </thead>
          <tbody>
            ${room.seats.map((s, i) => `
              <tr class="${i % 2 === 0 ? 'even' : 'odd'}">
                <td>${i + 1}</td>
                <td><span class="seat-badge">${s.seat_no}</span></td>
                <td class="bold">${s.student_name}</td>
                <td>${s.roll_no}</td>
                <td><span class="program-badge">${s.program}</span></td>
                <td>${s.specialization || '—'}</td>
                <td>${s.year || '—'}</td>
              </tr>`).join('')}
          </tbody>
        </table>
        <div class="room-footer">Total students in this room: <strong>${room.seats.length}</strong></div>
      </div>
    `).join('');

    const departments = [...new Set(records.map(r => r.specialization).filter(Boolean))];

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>${exam.title} — Seating Plan</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #111827; background: #fff; font-size: 12px; }

    .page-header { background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%); color: white; padding: 28px 36px; }
    .institute { font-size: 11px; letter-spacing: 2px; text-transform: uppercase; opacity: 0.8; margin-bottom: 6px; }
    .exam-title { font-size: 22px; font-weight: 700; margin-bottom: 12px; }
    .exam-meta { display: flex; flex-wrap: wrap; gap: 20px; font-size: 11px; opacity: 0.9; }
    .exam-meta span { display: flex; align-items: center; gap: 5px; }
    .exam-type-badge { 
      display: inline-block; padding: 3px 10px; border-radius: 99px; 
      background: ${examTypeBadgeColor}; color: white; font-size: 11px; font-weight: 600;
      margin-left: 8px; vertical-align: middle;
    }

    .stats-bar { display: flex; gap: 0; border-bottom: 2px solid #e5e7eb; }
    .stat { flex: 1; padding: 16px 20px; text-align: center; border-right: 1px solid #e5e7eb; }
    .stat:last-child { border-right: none; }
    .stat-num { font-size: 26px; font-weight: 700; color: #4338ca; }
    .stat-label { font-size: 10px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px; margin-top: 2px; }

    .content { padding: 24px 36px; }

    .room-section { margin-bottom: 32px; page-break-inside: avoid; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; }
    .room-header { background: #f8fafc; padding: 14px 20px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e5e7eb; }
    .room-title { display: flex; align-items: center; gap: 12px; }
    .room-icon { font-size: 20px; }
    .room-title h3 { font-size: 15px; font-weight: 700; color: #1e1b4b; }
    .room-meta { font-size: 11px; color: #6b7280; }
    .invigilator-tag { font-size: 11px; color: #374151; background: #ede9fe; padding: 6px 14px; border-radius: 6px; }
    .invigilator-tag strong { color: #4338ca; }

    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    thead tr { background: #4338ca; color: white; }
    th { padding: 9px 14px; text-align: left; font-weight: 600; letter-spacing: 0.5px; }
    td { padding: 8px 14px; }
    tr.even { background: #fff; }
    tr.odd { background: #f9fafb; }
    td.bold { font-weight: 600; }
    .seat-badge { background: #ede9fe; color: #4338ca; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 600; }
    .program-badge { background: #dbeafe; color: #1e40af; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 600; }

    .room-footer { padding: 10px 20px; font-size: 11px; color: #6b7280; background: #f8fafc; border-top: 1px solid #e5e7eb; text-align: right; }

    .page-footer { text-align: center; font-size: 10px; color: #9ca3af; padding: 16px 36px; border-top: 1px solid #e5e7eb; margin-top: 8px; }

    @media print { .room-section { page-break-inside: avoid; } }
  </style>
</head>
<body>
  <div class="page-header">
    <div class="institute">Exam Seating Management System</div>
    <div class="exam-title">
      ${exam.title}
      <span class="exam-type-badge">${exam.exam_type}</span>
    </div>
    <div class="exam-meta">
      <span>📅 Date: <strong>${examDate}</strong></span>
      <span>⏰ Time: <strong>${exam.start_time} – ${exam.end_time}</strong></span>
      <span>📚 Course: <strong>${exam.course_name}${exam.course_code ? ' (' + exam.course_code + ')' : ''}</strong></span>
      <span>🎓 Programs: <strong>${programList.join(', ')}</strong></span>
      <span>📖 Semester: <strong>Sem ${exam.semester}</strong></span>
    </div>
  </div>

  <div class="stats-bar">
    <div class="stat"><div class="stat-num">${records.length}</div><div class="stat-label">Total Students</div></div>
    <div class="stat"><div class="stat-num">${Object.keys(roomMap).length}</div><div class="stat-label">Rooms Used</div></div>
    <div class="stat"><div class="stat-num">${programList.length}</div><div class="stat-label">Programs</div></div>
    <div class="stat"><div class="stat-num">${departments.length}</div><div class="stat-label">Specializations</div></div>
    <div class="stat"><div class="stat-num">${exam.semester}</div><div class="stat-label">Semester</div></div>
  </div>

  <div class="content">
    ${roomSections}
  </div>

  <div class="page-footer">
    Generated on ${new Date().toLocaleString('en-IN')} &nbsp;|&nbsp; Exam Seating Automation System
  </div>
</body>
</html>`;

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    });
    await browser.close();

    const safeTitle = exam.title.replace(/[^a-z0-9]/gi, '_').slice(0, 40);
    const filename = `SeatingPlan_${safeTitle}_Sem${exam.semester}.pdf`;

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': pdfBuffer.length,
    });
    res.end(pdfBuffer);
  } catch (err) { next(err); }
};

module.exports = { getSeating, generateSeating, deleteSeat, clearSeatingForExam, downloadPDF };
