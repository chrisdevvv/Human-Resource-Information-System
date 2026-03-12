const express = require('express');
const { createLeaveRequest, getAllLeaveRequests, getLeaveRequestById, getLeavesByEmployee, updateLeaveRequest, deleteLeaveRequest } = require('./leaveController');
const authMiddleware = require('../../middleware/authMiddleware');

const router = express.Router();

router.get('/', authMiddleware, getAllLeaveRequests);
router.get('/employee/:employee_id', authMiddleware, getLeavesByEmployee);
router.get('/:id', authMiddleware, getLeaveRequestById);
router.post('/', authMiddleware, createLeaveRequest);
router.put('/:id', authMiddleware, updateLeaveRequest);
router.delete('/:id', authMiddleware, deleteLeaveRequest);

module.exports = router;
