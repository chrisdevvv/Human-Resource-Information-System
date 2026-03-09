const express = require('express');
const { createLeaveRequest, getAllLeaveRequests, getLeaveRequestById, getLeavesByEmployee, updateLeaveRequest, deleteLeaveRequest } = require('./leaveController');

const router = express.Router();

router.get('/', getAllLeaveRequests);
router.get('/employee/:employee_id', getLeavesByEmployee);
router.get('/:id', getLeaveRequestById);
router.post('/', createLeaveRequest);
router.put('/:id', updateLeaveRequest);
router.delete('/:id', deleteLeaveRequest);

module.exports = router;
