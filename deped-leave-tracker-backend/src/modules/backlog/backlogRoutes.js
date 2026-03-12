const express = require('express');
const { getAllBacklogs, getBacklogById, getBacklogsByUser, getBacklogsBySchool, createBacklog } = require('./backlogController');
const authMiddleware = require('../../middleware/authMiddleware');

const router = express.Router();

router.get('/', authMiddleware, getAllBacklogs);
router.get('/user/:user_id', authMiddleware, getBacklogsByUser);
router.get('/school/:school_id', authMiddleware, getBacklogsBySchool);
router.get('/:id', authMiddleware, getBacklogById);
router.post('/', authMiddleware, createBacklog);

module.exports = router;
