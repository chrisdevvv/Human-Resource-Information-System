const Employee = require('./employeeModel');
const Backlog = require('../backlog/backlogModel');

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
        const { first_name, last_name, employee_type, school_id } = req.body;
        Backlog.create({
            user_id: req.user.id,
            school_id: school_id || null,
            employee_id: result.insertId,
            leave_id: null,
            action: 'EMPLOYEE_CREATED',
            details: `${first_name} ${last_name} (${employee_type})`,
        });
        res.status(201).json({ message: 'Employee created successfully', data: result });
    } catch (err) {
        res.status(500).json({ message: 'Error creating employee', error: err.message });
    }
};

const updateEmployee = async (req, res) => {
    try {
        const result = await Employee.update(req.params.id, req.body);
        const { first_name, last_name, employee_type, school_id } = req.body;
        Backlog.create({
            user_id: req.user.id,
            school_id: school_id || null,
            employee_id: Number(req.params.id),
            leave_id: null,
            action: 'EMPLOYEE_UPDATED',
            details: `${first_name} ${last_name} (${employee_type})`,
        });
        res.status(200).json({ message: 'Employee updated successfully', data: result });
    } catch (err) {
        res.status(500).json({ message: 'Error updating employee', error: err.message });
    }
};

const deleteEmployee = async (req, res) => {
    try {
        const employee = await Employee.getById(req.params.id);
        if (!employee) return res.status(404).json({ message: 'Employee not found' });
        const result = await Employee.delete(req.params.id);
        Backlog.create({
            user_id: req.user.id,
            school_id: employee.school_id || null,
            employee_id: Number(req.params.id),
            leave_id: null,
            action: 'EMPLOYEE_DELETED',
            details: `${employee.first_name} ${employee.last_name} (${employee.employee_type})`,
        });
        res.status(200).json({ message: 'Employee deleted successfully', data: result });
    } catch (err) {
        res.status(500).json({ message: 'Error deleting employee', error: err.message });
    }
};

module.exports = { getAllEmployees, getEmployeeById, getEmployeesBySchool, createEmployee, updateEmployee, deleteEmployee };
