const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { getAllExams, getExam, createExam, updateExam, deleteExam } = require('../controllers/examController');

router.get('/',      authenticate, getAllExams);
router.get('/:id',   authenticate, getExam);
router.post('/',     authenticate, createExam);
router.put('/:id',   authenticate, updateExam);
router.delete('/:id', authenticate, deleteExam);

module.exports = router;
