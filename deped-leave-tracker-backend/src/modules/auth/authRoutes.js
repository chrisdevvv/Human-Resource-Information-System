const express = require('express');
const { register, login, verifyPassword } = require('./authController');
const authMiddleware = require('../../middleware/authMiddleware');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/verify-password', authMiddleware, verifyPassword);

module.exports = router;
