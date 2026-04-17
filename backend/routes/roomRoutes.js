const router = require('express').Router();
const ctrl = require('../controllers/roomController');
const { validate, schemas } = require('../middleware/validate');
const { authenticate, authorizeAdmin } = require('../middleware/auth');

router.use(authenticate);

router.get('/',          ctrl.getAll);
router.get('/:id',       ctrl.getById);
router.post('/',         authorizeAdmin, validate(schemas.room), ctrl.create);
router.put('/:id',       authorizeAdmin, validate(schemas.room), ctrl.update);
router.delete('/:id',    authorizeAdmin,                         ctrl.remove);

module.exports = router;
