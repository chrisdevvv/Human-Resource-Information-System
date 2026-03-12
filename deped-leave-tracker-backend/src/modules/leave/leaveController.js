const Leave = require('./leaveModel');
const Backlog = require('../backlog/backlogModel');

const createLeaveRequest = async (req, res) => {
    try {
        const result = await Leave.create(req.body);
        const { employee_id, leave_type, start_date, end_date } = req.body;
        Backlog.create({
            user_id: req.user.id,
            school_id: null,
            employee_id: employee_id || null,
            leave_id: result.insertId,
            action: 'LEAVE_CREATED',
            details: `${leave_type} from ${start_date} to ${end_date}`,
        });
        res.status(201).json({ message: 'Leave request created successfully', data: result });
    } catch (err) {
        res.status(500).json({ message: 'Error creating leave request', error: err.message });
    }
};

const getAllLeaveRequests = async (req, res) => {
    try {
        const results = await Leave.getAll();
        res.status(200).json({ data: results });
    } catch (err) {
        res.status(500).json({ message: 'Error retrieving leave requests', error: err.message });
    }
};

const getLeaveRequestById = async (req, res) => {
    try {
        const result = await Leave.getById(req.params.id);
        if (!result) return res.status(404).json({ message: 'Leave request not found' });
        res.status(200).json({ data: result });
    } catch (err) {
        res.status(500).json({ message: 'Error retrieving leave request', error: err.message });
    }
};

const getLeavesByEmployee = async (req, res) => {
    try {
        const results = await Leave.getByEmployeeId(req.params.employee_id);
        res.status(200).json({ data: results });
    } catch (err) {
        res.status(500).json({ message: 'Error retrieving leave requests', error: err.message });
    }
};

const updateLeaveRequest = async (req, res) => {
    try {
        const leave = await Leave.getById(req.params.id);
        if (!leave) return res.status(404).json({ message: 'Leave request not found' });
        const result = await Leave.update(req.params.id, req.body);
        const { status } = req.body;
        Backlog.create({
            user_id: req.user.id,
            school_id: null,
            employee_id: leave.employee_id || null,
            leave_id: Number(req.params.id),
            action: 'LEAVE_UPDATED',
            details: status ? `Status changed to ${status}` : `Leave #${req.params.id} updated`,
        });
        res.status(200).json({ message: 'Leave request updated successfully', data: result });
    } catch (err) {
        res.status(500).json({ message: 'Error updating leave request', error: err.message });
    }
};

const deleteLeaveRequest = async (req, res) => {
    try {
        const leave = await Leave.getById(req.params.id);
        if (!leave) return res.status(404).json({ message: 'Leave request not found' });
        const result = await Leave.delete(req.params.id);
        Backlog.create({
            user_id: req.user.id,
            school_id: null,
            employee_id: leave.employee_id || null,
            leave_id: Number(req.params.id),
            action: 'LEAVE_DELETED',
            details: `${leave.leave_type} from ${leave.start_date} to ${leave.end_date}`,
        });
        res.status(200).json({ message: 'Leave request deleted successfully', data: result });
    } catch (err) {
        res.status(500).json({ message: 'Error deleting leave request', error: err.message });
    }
};

module.exports = { createLeaveRequest, getAllLeaveRequests, getLeaveRequestById, getLeavesByEmployee, updateLeaveRequest, deleteLeaveRequest };
