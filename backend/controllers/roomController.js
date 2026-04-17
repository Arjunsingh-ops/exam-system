const RoomModel = require('../models/roomModel');

const getAll = async (req, res, next) => {
  try {
    const rooms = await RoomModel.getAll();
    res.json({ success: true, rooms });
  } catch (err) { next(err); }
};

const getById = async (req, res, next) => {
  try {
    const room = await RoomModel.getById(req.params.id);
    if (!room) return res.status(404).json({ success: false, message: 'Room not found.' });
    res.json({ success: true, room });
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const id = await RoomModel.create(req.body);
    const room = await RoomModel.getById(id);
    res.status(201).json({ success: true, message: 'Room created.', room });
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const affected = await RoomModel.update(req.params.id, req.body);
    if (!affected) return res.status(404).json({ success: false, message: 'Room not found.' });
    const room = await RoomModel.getById(req.params.id);
    res.json({ success: true, message: 'Room updated.', room });
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    const affected = await RoomModel.delete(req.params.id);
    if (!affected) return res.status(404).json({ success: false, message: 'Room not found.' });
    res.json({ success: true, message: 'Room deleted.' });
  } catch (err) { next(err); }
};

module.exports = { getAll, getById, create, update, remove };
