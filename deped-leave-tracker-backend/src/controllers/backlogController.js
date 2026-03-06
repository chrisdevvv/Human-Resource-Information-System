const Backlog = require('../models/backlog');

const getAllBacklogs = async (req, res) => {
    try {
        const results = await Backlog.getAll();
        res.status(200).json({ data: results });
    } catch (err) {
        res.status(500).json({ message: 'Error retrieving backlogs', error: err.message });
    }
};

const getBacklogById = async (req, res) => {
    try {
        const result = await Backlog.getById(req.params.id);
        if (!result) return res.status(404).json({ message: 'Backlog not found' });
        res.status(200).json({ data: result });
    } catch (err) {
        res.status(500).json({ message: 'Error retrieving backlog', error: err.message });
    }
};

const getBacklogsByUser = async (req, res) => {
    try {
        const results = await Backlog.getByUser(req.params.user_id);
        res.status(200).json({ data: results });
    } catch (err) {
        res.status(500).json({ message: 'Error retrieving backlogs', error: err.message });
    }
};

const getBacklogsBySchool = async (req, res) => {
    try {
        const results = await Backlog.getBySchool(req.params.school_id);
        res.status(200).json({ data: results });
    } catch (err) {
        res.status(500).json({ message: 'Error retrieving backlogs', error: err.message });
    }
};

const createBacklog = async (req, res) => {
    try {
        const result = await Backlog.create(req.body);
        res.status(201).json({ message: 'Backlog created successfully', data: result });
    } catch (err) {
        res.status(500).json({ message: 'Error creating backlog', error: err.message });
    }
};

module.exports = { getAllBacklogs, getBacklogById, getBacklogsByUser, getBacklogsBySchool, createBacklog };
