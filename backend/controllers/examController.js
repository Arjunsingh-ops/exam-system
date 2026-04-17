const ExamModel = require('../models/examModel');

const getAll = async (req, res, next) => {
  try {
    const exams = await ExamModel.getAll();
    res.json({ success: true, exams });
  } catch (err) { next(err); }
};

const getById = async (req, res, next) => {
  try {
    const exam = await ExamModel.getById(req.params.id);
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found.' });
    res.json({ success: true, exam });
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const id = await ExamModel.create(req.body);
    const exam = await ExamModel.getById(id);
    res.status(201).json({ success: true, message: 'Exam created.', exam });
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const affected = await ExamModel.update(req.params.id, req.body);
    if (!affected) return res.status(404).json({ success: false, message: 'Exam not found.' });
    const exam = await ExamModel.getById(req.params.id);
    res.json({ success: true, message: 'Exam updated.', exam });
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    const affected = await ExamModel.delete(req.params.id);
    if (!affected) return res.status(404).json({ success: false, message: 'Exam not found.' });
    res.json({ success: true, message: 'Exam deleted.' });
  } catch (err) { next(err); }
};

module.exports = { getAll, getById, create, update, remove };
