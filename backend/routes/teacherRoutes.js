const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { getAllTeachers, getTeacher, createTeacher, updateTeacher, deleteTeacher } = require('../controllers/teacherController');

router.get('/',       authenticate, getAllTeachers);
router.get('/:id',    authenticate, getTeacher);
router.post('/',      authenticate, createTeacher);
router.put('/:id',    authenticate, updateTeacher);
router.delete('/:id', authenticate, deleteTeacher);

module.exports = router;
