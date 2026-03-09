const express = require('express');
const { getAllEmployees, getEmployeeById, getEmployeesBySchool, createEmployee, updateEmployee, deleteEmployee } = require('./employeeController');

const router = express.Router();

router.get('/', getAllEmployees);
router.get('/school/:school_id', getEmployeesBySchool);
router.get('/:id', getEmployeeById);
router.post('/', createEmployee);
router.put('/:id', updateEmployee);
router.delete('/:id', deleteEmployee);

module.exports = router;
