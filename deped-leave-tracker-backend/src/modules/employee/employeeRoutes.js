const express = require('express');
const { getAllEmployees, getEmployeeById, getEmployeesBySchool, createEmployee, updateEmployee, deleteEmployee } = require('./employeeController');
const authMiddleware = require('../../middleware/authMiddleware');

const router = express.Router();

router.get('/', authMiddleware, getAllEmployees);
router.get('/school/:school_id', authMiddleware, getEmployeesBySchool);
router.get('/:id', authMiddleware, getEmployeeById);
router.post('/', authMiddleware, createEmployee);
router.put('/:id', authMiddleware, updateEmployee);
router.delete('/:id', authMiddleware, deleteEmployee);

module.exports = router;
