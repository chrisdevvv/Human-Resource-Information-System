const Leave = require('../models/leave');

const createLeaveRequest = (req, res) => {
    const leaveData = req.body;
    Leave.createLeave(leaveData, (err, result) => {
        if (err) return res.status(500).json({ message: 'Error creating leave request', error: err.message });
        res.status(201).json({ message: 'Leave request created successfully', data: result });
    });
};

const getAllLeaveRequests = (req, res) => {
    Leave.getAllLeaves((err, results) => {
        if (err) return res.status(500).json({ message: 'Error retrieving leave requests', error: err.message });
        res.status(200).json({ data: results });
    });
};

const getLeaveRequestById = (req, res) => {
    const { id } = req.params;
    Leave.getLeaveById(id, (err, result) => {
        if (err) return res.status(500).json({ message: 'Error retrieving leave request', error: err.message });
        if (!result) return res.status(404).json({ message: 'Leave request not found' });
        res.status(200).json({ data: result });
    });
};

const updateLeaveRequest = (req, res) => {
    const { id } = req.params;
    const leaveData = req.body;
    Leave.updateLeave(id, leaveData, (err, result) => {
        if (err) return res.status(500).json({ message: 'Error updating leave request', error: err.message });
        res.status(200).json({ message: 'Leave request updated successfully', data: result });
    });
};

const deleteLeaveRequest = (req, res) => {
    const { id } = req.params;
    Leave.deleteLeave(id, (err, result) => {
        if (err) return res.status(500).json({ message: 'Error deleting leave request', error: err.message });
        res.status(200).json({ message: 'Leave request deleted successfully', data: result });
    });
};

module.exports = { createLeaveRequest, getAllLeaveRequests, getLeaveRequestById, updateLeaveRequest, deleteLeaveRequest };
