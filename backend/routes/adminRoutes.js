const express = require('express');
const router = express.Router();
const { getStats } = require('../controllers/adminController');
const { authenticate, authorizeAdmin } = require('../middleware/auth');

// Protect all admin routes
router.use(authenticate, authorizeAdmin);

router.get('/stats', getStats);

module.exports = router;
