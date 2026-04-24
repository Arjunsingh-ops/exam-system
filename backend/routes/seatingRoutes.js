const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const {
  getSeating, generateSeating, deleteSeat, clearSeatingForExam, downloadPDF
} = require('../controllers/seatingController');

router.get('/',                    authenticate, getSeating);
router.post('/generate',           authenticate, generateSeating);
router.get('/pdf',                 authenticate, downloadPDF);
router.delete('/exam/:exam_id',    authenticate, clearSeatingForExam);
router.delete('/:id',              authenticate, deleteSeat);

module.exports = router;
