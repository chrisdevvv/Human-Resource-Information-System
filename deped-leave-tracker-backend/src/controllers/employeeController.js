const Employee = require('../models/employee');

const getAllEmployees = async (req, res) => {
    try {
        const results = await Employee.getAll();
        res.status(200).json({ data: results });
    } catch (err) {
        res.status(500).json({ message: 'Error retrieving employees', error: err.message });
    }
};

const getEmployeeById = async (req, res) => {
    try {
        const result = await Employee.getById(req.params.id);
        if (!result) return res.status(404).json({ message: 'Employee not found' });
        res.status(200).json({ data: result });
    } catch (err) {
        res.status(500).json({ message: 'Error retrieving employee', error: err.message });
    }
};

const getEmployeesBySchool = async (req, res) => {
    try {
        const results = await Employee.getBySchool(req.params.school_id);
        res.status(200).json({ data: results });
    } catch (err) {
        res.status(500).json({ message: 'Error retrieving employees', error: err.message });
    }
};

const createEmployee = async (req, res) => {
    try {
        const result = await Employee.create(req.body);
        res.status(201).json({ message: 'Employee created successfully', data: result });
    } catch (err) {
        res.status(500).json({ message: 'Error creating employee', error: err.message });
    }
};

const updateEmployee = async (req, res) => {
    try {
        const result = await Employee.update(req.params.id, req.body);
        res.status(200).json({ message: 'Employee updated successfully', data: result });
    } catch (err) {
        res.status(500).json({ message: 'Error updating employee', error: err.message });
    }
};

const deleteEmployee = async (req, res) => {
    try {
        const result = await Employee.delete(req.params.id);
        res.status(200).json({ message: 'Employee deleted successfully', data: result });
    } catch (err) {
        res.status(500).json({ message: 'Error deleting employee', error: err.message });
    }
};

module.exports = { getAllEmployees, getEmployeeById, getEmployeesBySchool, createEmployee, updateEmployee, deleteEmployee };
