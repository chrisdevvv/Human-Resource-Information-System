const express = require('express');
const { getAllUsers, getUserById, updateUserRole, updateUserStatus, deleteUser } = require('./userController');
const authMiddleware = require('../../middleware/authMiddleware');

const router = express.Router();

// All routes require authentication (super-admin only)
router.get('/', authMiddleware, getAllUsers);
router.get('/:id', authMiddleware, getUserById);
router.patch('/:id/role', authMiddleware, updateUserRole);
router.patch('/:id/status', authMiddleware, updateUserStatus);
router.delete('/:id', authMiddleware, deleteUser);

module.exports = router;
