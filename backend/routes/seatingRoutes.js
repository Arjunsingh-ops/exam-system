const router = require('express').Router();
const ctrl = require('../controllers/seatingController');
const { validate, schemas } = require('../middleware/validate');
const { authenticate, authorizeAdmin } = require('../middleware/auth');

// PDF download — no auth required so frontend can trigger download directly
router.get('/pdf', ctrl.downloadPDF);

router.use(authenticate);

router.get('/',                   ctrl.getSeating);
router.get('/student/:student_id',ctrl.getStudentSeating);
router.delete('/:id',  authorizeAdmin, ctrl.deleteSeat);
router.post('/generate', authorizeAdmin, validate(schemas.generate), ctrl.generateSeating);

module.exports = router;
