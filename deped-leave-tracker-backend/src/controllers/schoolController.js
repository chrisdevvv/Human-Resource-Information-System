const School = require('../models/school');

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
        res.status(201).json({ message: 'School created successfully', data: result });
    } catch (err) {
        res.status(500).json({ message: 'Error creating school', error: err.message });
    }
};

const updateSchool = async (req, res) => {
    try {
        const result = await School.update(req.params.id, req.body);
        res.status(200).json({ message: 'School updated successfully', data: result });
    } catch (err) {
        res.status(500).json({ message: 'Error updating school', error: err.message });
    }
};

const deleteSchool = async (req, res) => {
    try {
        const result = await School.delete(req.params.id);
        res.status(200).json({ message: 'School deleted successfully', data: result });
    } catch (err) {
        res.status(500).json({ message: 'Error deleting school', error: err.message });
    }
};

module.exports = { getAllSchools, getSchoolById, createSchool, updateSchool, deleteSchool };
