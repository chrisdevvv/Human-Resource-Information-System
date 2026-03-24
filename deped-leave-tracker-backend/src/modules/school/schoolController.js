const School = require('./schoolModel');
const Backlog = require('../backlog/backlogModel');

const getAllSchools = async (req, res) => {
    try {
        const results = await School.getAll();
        res.status(200).json({ data: results });
    } catch (err) {
        res.status(500).json({ message: 'Error retrieving schools', error: err.message });
    }
};

const getSchoolById = async (req, res) => {
    try {
        const result = await School.getById(req.params.id);
        if (!result) return res.status(404).json({ message: 'School not found' });
        res.status(200).json({ data: result });
    } catch (err) {
        res.status(500).json({ message: 'Error retrieving school', error: err.message });
    }
};

const createSchool = async (req, res) => {
    try {
        const result = await School.create(req.body);
        await Backlog.record({
            user_id: req.user?.id || null,
            school_id: result.insertId,
            employee_id: null,
            leave_id: null,
            action: 'SCHOOL_CREATED',
            details: `${req.body.school_name} (${req.body.school_code})`,
        });
        res.status(201).json({ message: 'School created successfully', data: result });
    } catch (err) {
        res.status(500).json({ message: 'Error creating school', error: err.message });
    }
};

const updateSchool = async (req, res) => {
    try {
        const existingSchool = await School.getById(req.params.id);
        if (!existingSchool) {
            return res.status(404).json({ message: 'School not found' });
        }

        const result = await School.update(req.params.id, req.body);
        await Backlog.record({
            user_id: req.user?.id || null,
            school_id: Number(req.params.id),
            employee_id: null,
            leave_id: null,
            action: 'SCHOOL_UPDATED',
            details: `${existingSchool.school_name} (${existingSchool.school_code}) -> ${req.body.school_name} (${req.body.school_code})`,
        });
        res.status(200).json({ message: 'School updated successfully', data: result });
    } catch (err) {
        res.status(500).json({ message: 'Error updating school', error: err.message });
    }
};

const deleteSchool = async (req, res) => {
    try {
        const existingSchool = await School.getById(req.params.id);
        if (!existingSchool) {
            return res.status(404).json({ message: 'School not found' });
        }

        const result = await School.delete(req.params.id);
        await Backlog.record({
            user_id: req.user?.id || null,
            school_id: Number(req.params.id),
            employee_id: null,
            leave_id: null,
            action: 'SCHOOL_DELETED',
            details: `${existingSchool.school_name} (${existingSchool.school_code})`,
        });
        res.status(200).json({ message: 'School deleted successfully', data: result });
    } catch (err) {
        res.status(500).json({ message: 'Error deleting school', error: err.message });
    }
};

module.exports = { getAllSchools, getSchoolById, createSchool, updateSchool, deleteSchool };
