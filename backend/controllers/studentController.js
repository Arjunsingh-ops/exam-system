const StudentModel = require('../models/studentModel');

const getAll = async (req, res, next) => {
  try {
    const { search, department, page, limit } = req.query;
    const result = await StudentModel.getAll({ search, department, page, limit });
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
};

const getById = async (req, res, next) => {
  try {
    const student = await StudentModel.getById(req.params.id);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found.' });
    res.json({ success: true, student });
  } catch (err) { next(err); }
};

const getMyProfile = async (req, res, next) => {
  try {
    const student = await StudentModel.getByUserId(req.user.id);
    if (!student) return res.status(404).json({ success: false, message: 'Profile not found.' });
    res.json({ success: true, student });
  } catch (err) { next(err); }
};

const upsertMyProfile = async (req, res, next) => {
  try {
    const existing = await StudentModel.getByUserId(req.user.id);
    const data = { ...req.body, user_id: req.user.id };
    if (existing) {
      await StudentModel.update(existing.id, data);
      res.json({ success: true, message: 'Profile updated.' });
    } else {
      await StudentModel.create(data);
      res.status(201).json({ success: true, message: 'Profile created.' });
    }
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const id = await StudentModel.create(req.body);
    const student = await StudentModel.getById(id);
    res.status(201).json({ success: true, message: 'Student created.', student });
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const affected = await StudentModel.update(req.params.id, req.body);
    if (!affected) return res.status(404).json({ success: false, message: 'Student not found.' });
    const student = await StudentModel.getById(req.params.id);
    res.json({ success: true, message: 'Student updated.', student });
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    const affected = await StudentModel.delete(req.params.id);
    if (!affected) return res.status(404).json({ success: false, message: 'Student not found.' });
    res.json({ success: true, message: 'Student deleted.' });
  } catch (err) { next(err); }
};

const getDepartments = async (req, res, next) => {
  try {
    const departments = await StudentModel.getDepartments();
    res.json({ success: true, departments });
  } catch (err) { next(err); }
};

module.exports = { getAll, getById, create, update, remove, getDepartments, getMyProfile, upsertMyProfile };
