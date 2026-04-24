const ExamModel = require('../models/examModel');

const getAllExams = async (req, res, next) => {
  try {
    const exams = await ExamModel.getAll();
    res.json({ success: true, exams });
  } catch (err) { next(err); }
};

const getExam = async (req, res, next) => {
  try {
    const exam = await ExamModel.getById(req.params.id);
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found.' });
    res.json({ success: true, exam });
  } catch (err) { next(err); }
};

const createExam = async (req, res, next) => {
  try {
    const { title, subject, course, semester, exam_type, exam_date, start_time, end_time } = req.body;
    if (!title || !course || !semester || !exam_type || !exam_date || !start_time || !end_time) {
      return res.status(400).json({ success: false, message: 'title, course, semester, exam_type, exam_date, start_time, end_time are required.' });
    }
    const id = await ExamModel.create({ title, subject, course, semester, exam_type, exam_date, start_time, end_time });
    const exam = await ExamModel.getById(id);
    res.status(201).json({ success: true, exam });
  } catch (err) { next(err); }
};

const updateExam = async (req, res, next) => {
  try {
    const affected = await ExamModel.update(req.params.id, req.body);
    if (!affected) return res.status(404).json({ success: false, message: 'Exam not found.' });
    const exam = await ExamModel.getById(req.params.id);
    res.json({ success: true, exam });
  } catch (err) { next(err); }
};

const deleteExam = async (req, res, next) => {
  try {
    const affected = await ExamModel.delete(req.params.id);
    if (!affected) return res.status(404).json({ success: false, message: 'Exam not found.' });
    res.json({ success: true, message: 'Exam deleted.' });
  } catch (err) { next(err); }
};

module.exports = { getAllExams, getExam, createExam, updateExam, deleteExam };
