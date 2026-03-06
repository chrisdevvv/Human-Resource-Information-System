const express = require('express');
const { createLeaveRequest, getAllLeaveRequests, getLeaveRequestById, getLeavesByEmployee, updateLeaveRequest, deleteLeaveRequest } = require('../controllers/leaveController');

const router = express.Router();

router.get('/', getAllLeaveRequests);
router.get('/:id', getLeaveRequestById);
router.get('/employee/:employee_id', getLeavesByEmployee);
router.post('/', createLeaveRequest);
router.put('/:id', updateLeaveRequest);
router.delete('/:id', deleteLeaveRequest);

module.exports = router;
