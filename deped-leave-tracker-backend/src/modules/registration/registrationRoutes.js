const express = require('express');
const { getAllRegistrations, getPendingRegistrations, getRegistrationById, approveRegistration, rejectRegistration } = require('./registrationController');
const authMiddleware = require('../../middleware/authMiddleware');
const { roleAuthMiddleware } = require('../../middleware/roleAuthMiddleware');
const { validateRequest } = require('../../middleware/validateRequest');
const {
	idParamSchema,
	registrationStatusQuerySchema,
	registrationApproveBodySchema,
	registrationRejectBodySchema,
} = require('../../validation/schemas');

const router = express.Router();

// All routes require authentication (admin/super-admin only)
router.get('/', authMiddleware, roleAuthMiddleware(['admin', 'super-admin']), validateRequest({ query: registrationStatusQuerySchema }), getAllRegistrations);
router.get('/pending', authMiddleware, roleAuthMiddleware(['admin', 'super-admin']), getPendingRegistrations);
router.get('/:id', authMiddleware, roleAuthMiddleware(['admin', 'super-admin']), validateRequest({ params: idParamSchema }), getRegistrationById);
router.post('/:id/approve', authMiddleware, roleAuthMiddleware(['admin', 'super-admin']), validateRequest({ params: idParamSchema, body: registrationApproveBodySchema }), approveRegistration);
router.post('/:id/reject', authMiddleware, roleAuthMiddleware(['admin', 'super-admin']), validateRequest({ params: idParamSchema, body: registrationRejectBodySchema }), rejectRegistration);

module.exports = router;
