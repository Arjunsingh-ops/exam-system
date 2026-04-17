const router = require('express').Router();
const ctrl = require('../controllers/studentController');
const { validate, schemas } = require('../middleware/validate');
const { authenticate, authorizeAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(authenticate);

router.get('/',                              ctrl.getAll);
router.get('/departments',                   ctrl.getDepartments);
router.get('/me',                            ctrl.getMyProfile);
router.post('/me',                           validate(schemas.student), ctrl.upsertMyProfile);
router.get('/:id',                           ctrl.getById);
router.post('/',     authorizeAdmin, validate(schemas.student), ctrl.create);
router.put('/:id',   authorizeAdmin, validate(schemas.student), ctrl.update);
router.delete('/:id',authorizeAdmin,                            ctrl.remove);

module.exports = router;
