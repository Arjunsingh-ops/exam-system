const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { getAllRooms, getRoom, createRoom, updateRoom, deleteRoom } = require('../controllers/roomController');

router.get('/',      authenticate, getAllRooms);
router.get('/:id',   authenticate, getRoom);
router.post('/',     authenticate, createRoom);
router.put('/:id',   authenticate, updateRoom);
router.delete('/:id', authenticate, deleteRoom);

module.exports = router;
