const router = require('express').Router();
const { register, login, getMe } = require('../controllers/authController');
const { validate, schemas } = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');

router.post('/register', validate(schemas.register), register);
router.post('/login',    validate(schemas.login),    login);
router.get('/me',        authenticate,               getMe);

module.exports = router;
