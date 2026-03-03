const express = require('express');
const { createLeaveRequest, getAllLeaveRequests, getLeaveRequestById, updateLeaveRequest, deleteLeaveRequest } = require('../controllers/leaveController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Route to create a leave request
router.post('/', authMiddleware, createLeaveRequest);

// Route to get all leave requests
router.get('/', authMiddleware, getAllLeaveRequests);

// Route to get a leave request by ID
router.get('/:id', authMiddleware, getLeaveRequestById);

// Route to update a leave request
router.put('/:id', authMiddleware, updateLeaveRequest);

// Route to delete a leave request
router.delete('/:id', authMiddleware, deleteLeaveRequest);

module.exports = router;
