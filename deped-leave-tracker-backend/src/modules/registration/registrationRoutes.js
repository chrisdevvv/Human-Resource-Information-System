const express = require('express');
const { getAllRegistrations, getPendingRegistrations, getRegistrationById, approveRegistration, rejectRegistration } = require('./registrationController');
const authMiddleware = require('../../middleware/authMiddleware');

const router = express.Router();

// All routes require authentication (admin/super-admin only)
router.get('/', authMiddleware, getAllRegistrations);
router.get('/pending', authMiddleware, getPendingRegistrations);
router.get('/:id', authMiddleware, getRegistrationById);
router.post('/:id/approve', authMiddleware, approveRegistration);
router.post('/:id/reject', authMiddleware, rejectRegistration);

module.exports = router;
