const express = require('express');
const { getAllBacklogs, getBacklogById, getBacklogsByUser, getBacklogsBySchool, createBacklog } = require('../controllers/backlogController');

const router = express.Router();

router.get('/', getAllBacklogs);
router.get('/:id', getBacklogById);
router.get('/user/:user_id', getBacklogsByUser);
router.get('/school/:school_id', getBacklogsBySchool);
router.post('/', createBacklog);

module.exports = router;
