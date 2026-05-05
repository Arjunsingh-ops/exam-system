const csv = require('csv-parser');
const fs = require('fs');
const StudentModel = require('../models/studentModel');

const getAllStudents = async (req, res, next) => {
  try {
    const { search, program, semester, page, limit } = req.query;
    const data = await StudentModel.getAll({ search, program, semester, page, limit });
    res.json({ success: true, ...data });
  } catch (err) { next(err); }
};

const getStudent = async (req, res, next) => {
  try {
    const student = await StudentModel.getById(req.params.id);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found.' });
    res.json({ success: true, student });
  } catch (err) { next(err); }
};

const createStudent = async (req, res, next) => {
  try {
    const { name, roll_no, enrollment_no, program, batch, specialization, year, semester, email, contact } = req.body;
    if (!name || !roll_no || !enrollment_no || !program || !semester) {
      return res.status(400).json({ success: false, message: 'name, roll_no, enrollment_no, program, semester are required.' });
    }
    const id = await StudentModel.create({ name, roll_no, enrollment_no, program, batch, specialization, year, semester, email, contact });
    const student = await StudentModel.getById(id);
    res.status(201).json({ success: true, student });
  } catch (err) { next(err); }
};

const updateStudent = async (req, res, next) => {
  try {
    const affected = await StudentModel.update(req.params.id, req.body);
    if (!affected) return res.status(404).json({ success: false, message: 'Student not found.' });
    const student = await StudentModel.getById(req.params.id);
    res.json({ success: true, student });
  } catch (err) { next(err); }
};

const deleteStudent = async (req, res, next) => {
  try {
    const affected = await StudentModel.delete(req.params.id);
    if (!affected) return res.status(404).json({ success: false, message: 'Student not found.' });
    res.json({ success: true, message: 'Student deleted.' });
  } catch (err) { next(err); }
};

const getPrograms = async (req, res, next) => {
  try {
    const programs = await StudentModel.getPrograms();
    res.json({ success: true, programs });
  } catch (err) { next(err); }
};

const uploadCSV = async (req, res, next) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No CSV file uploaded.' });

  const results = [];
  const errors = [];

  try {
    await new Promise((resolve, reject) => {
      fs.createReadStream(req.file.path)
        .pipe(csv({ mapHeaders: ({ header }) => header.trim().toLowerCase().replace(/\s+/g, '_') }))
        .on('data', (row) => {
          // Map common column variations
          const student = {
            name: row.name || row.student_name || '',
            roll_no: row.roll_no || row.rollno || row.roll_number || '',
            enrollment_no: row.enrollment_no || row.enrollment_number || row.enroll_no || row.enrollment || '',
            program: row.program || row.course || row.programme || '',
            batch: row.batch || row.batch_year || '',
            specialization: row.specialization || row.spec || row.branch || row.stream || '',
            year: parseInt(row.year || row.academic_year || '1') || 1,
            semester: parseInt(row.semester || row.sem || '1') || 1,
            email: row.email || row.email_id || '',
            contact: row.contact || row.phone || row.mobile || '',
          };

          if (!student.name || !student.roll_no || !student.enrollment_no || !student.program) {
            errors.push({ row: JSON.stringify(row), reason: 'Missing required fields (name, roll_no, enrollment_no, program)' });
            return;
          }
          results.push(student);
        })
        .on('end', resolve)
        .on('error', reject);
    });

    // Clean up uploaded file
    fs.unlink(req.file.path, () => {});

    if (!results.length) {
      return res.status(400).json({ success: false, message: 'No valid rows found in CSV.', errors });
    }

    const inserted = await StudentModel.bulkCreate(results);

    res.json({
      success: true,
      message: `CSV processed: ${inserted} students imported (${results.length - inserted} duplicates skipped).`,
      total_parsed: results.length,
      inserted,
      skipped: results.length - inserted,
      errors,
    });
  } catch (err) {
    fs.unlink(req.file?.path, () => {});
    next(err);
  }
};

const clearAllStudents = async (req, res, next) => {
  try {
    const count = await StudentModel.deleteAll();
    res.json({ success: true, message: `Cleared ${count} student records.` });
  } catch (err) { next(err); }
};

module.exports = { getAllStudents, getStudent, createStudent, updateStudent, deleteStudent, getPrograms, uploadCSV, clearAllStudents };
