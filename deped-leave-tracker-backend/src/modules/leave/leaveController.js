const Leave = require('./leaveModel');

const createLeaveRequest = async (req, res) => {
    try {
        const result = await Leave.create(req.body);
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
        const result = await Leave.update(req.params.id, req.body);
        res.status(200).json({ message: 'Leave request updated successfully', data: result });
    } catch (err) {
        res.status(500).json({ message: 'Error updating leave request', error: err.message });
    }
};

const deleteLeaveRequest = async (req, res) => {
    try {
        const result = await Leave.delete(req.params.id);
        res.status(200).json({ message: 'Leave request deleted successfully', data: result });
    } catch (err) {
        res.status(500).json({ message: 'Error deleting leave request', error: err.message });
    }
};

module.exports = { createLeaveRequest, getAllLeaveRequests, getLeaveRequestById, getLeavesByEmployee, updateLeaveRequest, deleteLeaveRequest };
