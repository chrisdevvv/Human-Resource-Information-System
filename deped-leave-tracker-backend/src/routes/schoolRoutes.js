const express = require('express');
const { getAllSchools, getSchoolById, createSchool, updateSchool, deleteSchool } = require('../controllers/schoolController');

const router = express.Router();

router.get('/', getAllSchools);
router.get('/:id', getSchoolById);
router.post('/', createSchool);
router.put('/:id', updateSchool);
router.delete('/:id', deleteSchool);

module.exports = router;
