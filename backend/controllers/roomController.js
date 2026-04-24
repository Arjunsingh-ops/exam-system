const RoomModel = require('../models/roomModel');

const getAllRooms = async (req, res, next) => {
  try {
    const rooms = await RoomModel.getAll();
    res.json({ success: true, rooms });
  } catch (err) { next(err); }
};

const getRoom = async (req, res, next) => {
  try {
    const room = await RoomModel.getById(req.params.id);
    if (!room) return res.status(404).json({ success: false, message: 'Room not found.' });
    res.json({ success: true, room });
  } catch (err) { next(err); }
};

const createRoom = async (req, res, next) => {
  try {
    const { room_no, capacity, rows_count, cols_count, floor, block } = req.body;
    if (!room_no || !capacity) {
      return res.status(400).json({ success: false, message: 'room_no and capacity are required.' });
    }
    const id = await RoomModel.create({ room_no, capacity, rows_count, cols_count, floor, block });
    const room = await RoomModel.getById(id);
    res.status(201).json({ success: true, room });
  } catch (err) { next(err); }
};

const updateRoom = async (req, res, next) => {
  try {
    const affected = await RoomModel.update(req.params.id, req.body);
    if (!affected) return res.status(404).json({ success: false, message: 'Room not found.' });
    const room = await RoomModel.getById(req.params.id);
    res.json({ success: true, room });
  } catch (err) { next(err); }
};

const deleteRoom = async (req, res, next) => {
  try {
    const affected = await RoomModel.delete(req.params.id);
    if (!affected) return res.status(404).json({ success: false, message: 'Room not found.' });
    res.json({ success: true, message: 'Room deleted.' });
  } catch (err) { next(err); }
};

module.exports = { getAllRooms, getRoom, createRoom, updateRoom, deleteRoom };
