const router = require('express').Router();
const { register, login, me, updateProfile, changePassword } = require('../controllers/authController');
const { authenticate, authorizeAdmin } = require('../middleware/auth');

// Public authentication
router.post('/register', register);
router.post('/login', login);

// Authenticated session & account management
router.get('/me', authenticate, me);
router.put('/profile', authenticate, authorizeAdmin, updateProfile);
router.put('/change-password', authenticate, authorizeAdmin, changePassword);

module.exports = router;
