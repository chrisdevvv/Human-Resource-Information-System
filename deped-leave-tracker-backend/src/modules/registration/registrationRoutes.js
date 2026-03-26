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

// All routes require authentication; controller enforces school scope and role-specific actions.
router.get('/', authMiddleware, roleAuthMiddleware(['data-encoder', 'admin', 'super-admin']), validateRequest({ query: registrationStatusQuerySchema }), getAllRegistrations);
router.get('/pending', authMiddleware, roleAuthMiddleware(['data-encoder', 'admin', 'super-admin']), getPendingRegistrations);
router.get('/:id', authMiddleware, roleAuthMiddleware(['data-encoder', 'admin', 'super-admin']), validateRequest({ params: idParamSchema }), getRegistrationById);
router.post('/:id/approve', authMiddleware, roleAuthMiddleware(['data-encoder', 'admin', 'super-admin']), validateRequest({ params: idParamSchema, body: registrationApproveBodySchema }), approveRegistration);
router.post('/:id/reject', authMiddleware, roleAuthMiddleware(['data-encoder', 'admin', 'super-admin']), validateRequest({ params: idParamSchema, body: registrationRejectBodySchema }), rejectRegistration);

module.exports = router;
