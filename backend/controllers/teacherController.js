const TeacherModel = require('../models/teacherModel');

const getAllTeachers = async (req, res, next) => {
  try {
    const teachers = await TeacherModel.getAll();
    res.json({ success: true, teachers });
  } catch (err) { next(err); }
};

const getTeacher = async (req, res, next) => {
  try {
    const teacher = await TeacherModel.getById(req.params.id);
    if (!teacher) return res.status(404).json({ success: false, message: 'Teacher not found.' });
    res.json({ success: true, teacher });
  } catch (err) { next(err); }
};

const createTeacher = async (req, res, next) => {
  try {
    const { name, department, email, contact } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Teacher name is required.' });
    const id = await TeacherModel.create({ name, department, email, contact });
    const teacher = await TeacherModel.getById(id);
    res.status(201).json({ success: true, teacher });
  } catch (err) { next(err); }
};

const updateTeacher = async (req, res, next) => {
  try {
    const affected = await TeacherModel.update(req.params.id, req.body);
    if (!affected) return res.status(404).json({ success: false, message: 'Teacher not found.' });
    const teacher = await TeacherModel.getById(req.params.id);
    res.json({ success: true, teacher });
  } catch (err) { next(err); }
};

const deleteTeacher = async (req, res, next) => {
  try {
    const affected = await TeacherModel.delete(req.params.id);
    if (!affected) return res.status(404).json({ success: false, message: 'Teacher not found.' });
    res.json({ success: true, message: 'Teacher deleted.' });
  } catch (err) { next(err); }
};

module.exports = { getAllTeachers, getTeacher, createTeacher, updateTeacher, deleteTeacher };
