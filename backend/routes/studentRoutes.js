const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const {
  getAllStudents, getStudent, createStudent, updateStudent,
  deleteStudent, getPrograms, uploadCSV, clearAllStudents
} = require('../controllers/studentController');
const upload = require('../middleware/upload');

router.get('/',           authenticate, getAllStudents);
router.get('/programs',   authenticate, getPrograms);
router.get('/:id',        authenticate, getStudent);
router.post('/',          authenticate, createStudent);
router.put('/:id',        authenticate, updateStudent);
router.delete('/clear',   authenticate, clearAllStudents);
router.delete('/:id',     authenticate, deleteStudent);
router.post('/upload-csv', authenticate, upload.single('file'), uploadCSV);

module.exports = router;
