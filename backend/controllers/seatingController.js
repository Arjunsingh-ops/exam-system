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
    res.json({ success: true, message: 'Seating record deleted successfully.' });
  } catch (err) { next(err); }
};

// ─── DELETE /api/seating/exam/:exam_id ───────────────────────────────────────
const clearSeatingForExam = async (req, res, next) => {
  try {
    const count = await SeatingModel.deleteByExam(req.params.exam_id);
    res.json({ success: true, message: `Cleared ${count} seating record(s) for this exam.` });
  } catch (err) { next(err); }
};

// ─── POST /api/seating/generate ──────────────────────────────────────────────
/**
 * Body: { exam_id, room_ids: [1,2,3], teacher_ids: [1,2,3] }
 *
 * Algorithm (Column-based multi-program anti-conflict interleaving):
 * 1. Fetch and validate exam, programs and semester
 * 2. Fetch all eligible students matching any of the exam programs and semester
 * 3. Validate selected rooms and compute combined seating capacity
 * 4. Verify capacity is sufficient
 * 5. Run atomic database transaction to clear existing plan and insert new assignments
 * 6. Return comprehensive summary
 */
const generateSeating = async (req, res, next) => {
  let connection;
  try {
    const { exam_id, room_ids, teacher_ids = [] } = req.body;

    if (!exam_id) {
      return res.status(400).json({ success: false, message: 'Exam ID is required.' });
    }
    if (!room_ids || !Array.isArray(room_ids) || room_ids.length === 0) {
      return res.status(400).json({ success: false, message: 'Please select at least one room for seating allocation.' });
    }

    const exam = await ExamModel.getById(exam_id);
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Target exam not found.' });
    }

    // Parse programs
    const programList = exam.programs
      ? exam.programs.split(',').map(p => p.trim()).filter(Boolean)
      : [];

    if (!programList.length) {
      return res.status(400).json({
        success: false,
        message: 'No academic programs are configured for this examination.'
      });
    }

    // Fetch students matching exam programs and semester
    const placeholders = programList.map(() => '?').join(',');
    const [students] = await pool.query(
      `SELECT id, name, roll_no, enrollment_no, program, specialization, year, semester 
       FROM students 
       WHERE program IN (${placeholders}) AND semester = ? 
       ORDER BY program, specialization, roll_no`,
      [...programList, exam.semester]
    );

    if (!students || students.length === 0) {
      return res.status(400).json({
        success: false,
        message: `No students found enrolled in [${programList.join(', ')}] for Semester ${exam.semester}. Please import student records in the registry first.`
      });
    }

    // Fetch and validate selected rooms
    const rooms = [];
    for (const rid of room_ids) {
      const room = await RoomModel.getById(rid);
      if (!room) {
        return res.status(404).json({ success: false, message: `Room ID ${rid} does not exist.` });
      }
      rooms.push(room);
    }

    const totalCapacity = rooms.reduce((sum, r) => sum + (parseInt(r.capacity, 10) || 0), 0);
    if (students.length > totalCapacity) {
      return res.status(400).json({
        success: false,
        message: `Insufficient room capacity: ${students.length} students require seats, but selected room(s) only provide ${totalCapacity} seats. Please add more rooms (shortage: ${students.length - totalCapacity} seats).`
      });
    }

    // Fetch teachers/invigilators
    const teachers = [];
    if (Array.isArray(teacher_ids)) {
      for (const tid of teacher_ids) {
        const t = await TeacherModel.getById(tid);
        if (t) teachers.push(t);
      }
    }

    // Group students by program for anti-conflict interleaving
    const programMap = {};
    for (const s of students) {
      const key = s.program || 'General';
      if (!programMap[key]) programMap[key] = [];
      programMap[key].push(s);
    }

    const programKeys = Object.keys(programMap);
    // Sort descending by count so larger cohorts interleave nicely
    programKeys.sort((a, b) => programMap[b].length - programMap[a].length);

    const programQueues = {};
    for (const key of programKeys) {
      programQueues[key] = [...programMap[key]];
    }

    const seatingRecords = [];
    let globalProgramOffset = 0;

    for (let ri = 0; ri < rooms.length; ri++) {
      const room = rooms[ri];
      const teacher = teachers.length > 0 ? teachers[ri % teachers.length] : null;
      const rows = room.rows_count || Math.ceil(Math.sqrt(room.capacity)) || 5;
      const cols = room.cols_count || Math.ceil(room.capacity / rows) || 6;
      let seatNum = 0;

      const allExhausted = () => programKeys.every(k => programQueues[k].length === 0);

      // Fill column by column to ensure adjacent seats in rows have different programs
      for (let c = 1; c <= cols; c++) {
        if (allExhausted()) break;

        const colProgramIndex = (c - 1 + globalProgramOffset) % programKeys.length;

        for (let r = 1; r <= rows; r++) {
          if (allExhausted()) break;
          seatNum++;
          if (seatNum > room.capacity) break;

          const rowProgramIndex = (colProgramIndex + (r - 1)) % programKeys.length;
          let student = null;
          let tried = 0;
          let tryIdx = rowProgramIndex;

          while (tried < programKeys.length) {
            const candidateProgram = programKeys[tryIdx % programKeys.length];
            if (programQueues[candidateProgram].length > 0) {
              student = programQueues[candidateProgram].shift();
              break;
            }
            tryIdx++;
            tried++;
          }

          if (!student) break;

          seatingRecords.push({
            exam_id: exam.id,
            student_id: student.id,
            room_id: room.id,
            teacher_id: teacher ? teacher.id : null,
            seat_no: `R${r}-C${c}`,
          });
        }
      }

      globalProgramOffset++;
      if (allExhausted()) break;
    }

    // Execute atomic transaction for safe persistence
    connection = await pool.getConnection();
    await connection.beginTransaction();

    await SeatingModel.deleteByExam(exam_id, connection);
    await SeatingModel.bulkInsert(seatingRecords, connection);

    await connection.commit();

    const generated = await SeatingModel.getAll({ exam_id });

    res.status(201).json({
      success: true,
      message: `Successfully generated seating plan for ${seatingRecords.length} student(s) across ${rooms.length} room(s).`,
      exam,
      total_students: seatingRecords.length,
      rooms_used: rooms.length,
      seating: generated,
    });
  } catch (err) {
    if (connection) {
      try { await connection.rollback(); } catch (_) {}
    }
    next(err);
  } finally {
    if (connection) connection.release();
  }
};

// ─── GET /api/seating/pdf?exam_id= ───────────────────────────────────────────
const downloadPDF = async (req, res, next) => {
  let browser = null;
  try {
    const { exam_id } = req.query;
    if (!exam_id) {
      return res.status(400).json({ success: false, message: 'Exam ID is required.' });
    }

    const exam = await ExamModel.getById(exam_id);
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Target exam not found.' });
    }

    const records = await SeatingModel.getAll({ exam_id });
    if (!records || records.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No seating plan records found. Please generate the seating plan first.'
      });
    }

    // Group seating records by room
    const roomMap = {};
    for (const r of records) {
      if (!roomMap[r.room_no]) {
        roomMap[r.room_no] = {
          room_no: r.room_no,
          floor: r.floor,
          block: r.block,
          capacity: r.room_capacity,
          teacher_name: r.teacher_name,
          teacher_dept: r.teacher_dept,
          seats: [],
        };
      }
      roomMap[r.room_no].seats.push(r);
    }

    const examDate = exam.exam_date
      ? new Date(exam.exam_date).toLocaleDateString('en-US', { weekday: 'short', day: '2-digit', month: 'long', year: 'numeric' })
      : 'Scheduled';

    const safeExamTitle = (exam.title || 'Exam').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 30);
    const dateStamp = exam.exam_date ? new Date(exam.exam_date).toISOString().split('T')[0] : 'Date';
    const filename = `Exam-Seating-Plan-${safeExamTitle}-${dateStamp}.pdf`;

    const programList = exam.programs
      ? exam.programs.split(',').map(p => p.trim()).filter(Boolean)
      : [];

    const roomEntries = Object.values(roomMap);

    const roomPagesHtml = roomEntries.map((room, roomIdx) => {
      return `
      <div class="room-sheet ${roomIdx > 0 ? 'page-break' : ''}">
        <!-- University & Exam Header -->
        <header class="doc-header">
          <div class="uni-brand">
            <div class="uni-emblem">🏛️</div>
            <div class="uni-text">
              <h1 class="uni-name">APEX UNIVERSITY</h1>
              <p class="uni-dept">OFFICE OF THE CONTROLLER OF EXAMINATIONS</p>
            </div>
          </div>
          <div class="doc-badge-wrap">
            <span class="exam-type-tag">${exam.exam_type}</span>
          </div>
        </header>

        <div class="exam-title-bar">
          <h2>EXAMINATION SEATING & HALL ALLOCATION PLAN</h2>
        </div>

        <div class="exam-details-grid">
          <div class="detail-item"><span class="label">Course Name:</span> <span class="val bold">${exam.course_name}</span></div>
          <div class="detail-item"><span class="label">Course Code:</span> <span class="val font-mono">${exam.course_code || '—'}</span></div>
          <div class="detail-item"><span class="label">Exam Date:</span> <span class="val">${examDate}</span></div>
          <div class="detail-item"><span class="label">Timing:</span> <span class="val">${exam.start_time || '—'} to ${exam.end_time || '—'}</span></div>
          <div class="detail-item"><span class="label">Programs:</span> <span class="val">${programList.join(', ') || 'All'}</span></div>
          <div class="detail-item"><span class="label">Semester:</span> <span class="val">Semester ${exam.semester}</span></div>
        </div>

        <!-- Room Meta Bar -->
        <div class="room-meta-banner">
          <div class="room-ident">
            <span class="room-icon">🚪</span>
            <span class="room-title">ROOM NO: ${room.room_no}</span>
            <span class="room-location">(${[room.block ? 'Block ' + room.block : '', room.floor ? 'Floor ' + room.floor : ''].filter(Boolean).join(', ') || 'Main Campus'})</span>
          </div>
          <div class="room-stats">
            <span>Room Capacity: <strong>${room.capacity || room.seats.length}</strong></span>
            <span>Allocated: <strong>${room.seats.length} Students</strong></span>
          </div>
        </div>

        <div class="invigilator-strip">
          <span>Assigned Invigilator: <strong>${room.teacher_name || 'Unassigned / Faculty on Duty'}</strong> ${room.teacher_dept ? '(' + room.teacher_dept + ')' : ''}</span>
          <span>Room Sign-off: _______________________</span>
        </div>

        <!-- Student Seating Table -->
        <table class="seating-table">
          <thead>
            <tr>
              <th style="width: 45px; text-align: center;">S.NO</th>
              <th style="width: 80px; text-align: center;">SEAT NO</th>
              <th style="width: 220px;">STUDENT NAME</th>
              <th style="width: 110px;">ROLL NUMBER</th>
              <th style="width: 110px;">ENROLLMENT NO</th>
              <th style="width: 100px;">PROGRAM</th>
              <th style="width: 110px; text-align: center;">SIGNATURE</th>
            </tr>
          </thead>
          <tbody>
            ${room.seats.map((seat, sIdx) => `
              <tr class="${sIdx % 2 === 0 ? 'even' : 'odd'}">
                <td style="text-align: center; font-weight: 500;">${sIdx + 1}</td>
                <td style="text-align: center;"><span class="seat-badge">${seat.seat_no}</span></td>
                <td class="student-name">${seat.student_name}</td>
                <td class="font-mono">${seat.roll_no}</td>
                <td class="font-mono text-muted">${seat.enrollment_no || '—'}</td>
                <td><span class="prog-tag">${seat.program}</span></td>
                <td class="signature-cell"></td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <!-- Hall Summary Footer -->
        <div class="room-summary-footer">
          <div>Report Generated: ${new Date().toLocaleString('en-US')}</div>
          <div>Total Students in Room ${room.room_no}: <strong>${room.seats.length}</strong></div>
        </div>
      </div>
      `;
    }).join('');

    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${filename}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 10mm 12mm 14mm 12mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      font-size: 11px;
      line-height: 1.35;
      color: #0f172a;
      background: #ffffff;
    }
    .page-break {
      page-break-before: always;
      break-before: page;
    }
    .room-sheet {
      padding-top: 4px;
    }

    /* Header */
    .doc-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #1e293b;
      padding-bottom: 8px;
      margin-bottom: 10px;
    }
    .uni-brand {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .uni-emblem {
      font-size: 26px;
    }
    .uni-name {
      font-size: 16px;
      font-weight: 800;
      letter-spacing: 1.5px;
      color: #0f172a;
    }
    .uni-dept {
      font-size: 8.5px;
      letter-spacing: 1px;
      color: #475569;
      font-weight: 600;
      margin-top: 1px;
    }
    .exam-type-tag {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 4px;
      background: #1e1b4b;
      color: #ffffff;
      font-weight: 700;
      font-size: 10px;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }

    .exam-title-bar {
      text-align: center;
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      padding: 6px 12px;
      border-radius: 4px;
      margin-bottom: 8px;
    }
    .exam-title-bar h2 {
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 0.8px;
      color: #1e293b;
    }

    /* Exam Details */
    .exam-details-grid {
      display: grid;
      grid-template-columns: 1.2fr 1fr;
      gap: 5px 16px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      padding: 8px 12px;
      border-radius: 4px;
      margin-bottom: 8px;
    }
    .detail-item {
      display: flex;
      font-size: 10px;
    }
    .detail-item .label {
      width: 90px;
      color: #64748b;
      font-weight: 600;
      flex-shrink: 0;
    }
    .detail-item .val {
      color: #0f172a;
    }
    .bold { font-weight: 700; }
    .font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 9.5px; }

    /* Room Meta */
    .room-meta-banner {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #1e293b;
      color: #ffffff;
      padding: 6px 12px;
      border-radius: 4px;
      margin-bottom: 6px;
    }
    .room-ident {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .room-title {
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 0.5px;
    }
    .room-location {
      font-size: 10px;
      color: #cbd5e1;
    }
    .room-stats {
      font-size: 10px;
      display: flex;
      gap: 14px;
      color: #e2e8f0;
    }

    .invigilator-strip {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 9.5px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      padding: 5px 12px;
      border-radius: 4px;
      margin-bottom: 8px;
      color: #334155;
    }

    /* Table */
    table.seating-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10px;
    }
    table.seating-table thead {
      display: table-header-group;
    }
    table.seating-table th {
      background: #334155;
      color: #ffffff;
      font-weight: 700;
      padding: 6px 8px;
      border: 1px solid #1e293b;
      font-size: 9px;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    table.seating-table tr {
      page-break-inside: avoid;
      break-inside: avoid;
    }
    table.seating-table td {
      padding: 5px 8px;
      border: 1px solid #cbd5e1;
      vertical-align: middle;
      word-break: break-word;
    }
    tr.even { background: #ffffff; }
    tr.odd  { background: #f8fafc; }
    .seat-badge {
      display: inline-block;
      background: #ede9fe;
      color: #4338ca;
      font-weight: 700;
      font-family: monospace;
      padding: 1px 6px;
      border-radius: 3px;
      font-size: 9.5px;
      border: 1px solid #c7d2fe;
    }
    .prog-tag {
      display: inline-block;
      background: #e0f2fe;
      color: #0369a1;
      font-size: 9px;
      font-weight: 600;
      padding: 1px 5px;
      border-radius: 3px;
    }
    .student-name {
      font-weight: 600;
      color: #0f172a;
    }
    .signature-cell {
      border-bottom: 1px dotted #94a3b8 !important;
    }
    .text-muted { color: #64748b; }

    .room-summary-footer {
      display: flex;
      justify-content: space-between;
      margin-top: 8px;
      padding-top: 6px;
      border-top: 1px solid #e2e8f0;
      font-size: 9px;
      color: #64748b;
    }
  </style>
</head>
<body>
  ${roomPagesHtml}
</body>
</html>`;

    // Launch Puppeteer with production-safe arguments
    const puppeteerArgs = [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
    ];

    const launchOptions = {
      headless: true,
      args: puppeteerArgs,
    };

    if (process.env.PUPPETEER_EXECUTABLE_PATH) {
      launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
    }

    browser = await puppeteer.launch(launchOptions);
    const page = await browser.newPage();

    await page.setContent(fullHtml, {
      waitUntil: 'load',
      timeout: 30000,
    });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '10mm',
        bottom: '12mm',
        left: '10mm',
        right: '10mm',
      },
      displayHeaderFooter: true,
      headerTemplate: '<div></div>',
      footerTemplate: `
        <div style="font-size: 8px; font-family: sans-serif; width: 100%; display: flex; justify-content: space-between; padding: 0 12mm; color: #94a3b8;">
          <span>Apex University Examination Management System • Confidential</span>
          <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
        </div>
      `,
    });

    await browser.close();
    browser = null;

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': pdfBuffer.length,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    });

    return res.end(pdfBuffer);
  } catch (err) {
    console.error('❌ PDF Generation Error:', err);
    if (browser) {
      try { await browser.close(); } catch (_) {}
    }
    return res.status(500).json({
      success: false,
      message: `Failed to compile PDF: ${err.message || 'Chromium execution error'}. You may also use the Print Seating Plan option.`,
    });
  }
};

module.exports = {
  getSeating,
  generateSeating,
  deleteSeat,
  clearSeatingForExam,
  downloadPDF,
};
