const User = require('./userModel');
const { sendRoleChanged } = require('../../utils/mailer');

const VALID_ROLES = ['SUPER_ADMIN', 'ADMIN', 'DATA_ENCODER'];

const getAllUsers = async (req, res) => {
    try {
        const { search, role, is_active } = req.query;

        const filters = {
            search: search || null,
            role: role || null,
            is_active: is_active !== undefined ? Number(is_active) : null,
        };

        const results = await User.getAll(filters);
        res.status(200).json({ data: results });
    } catch (err) {
        res.status(500).json({ message: 'Error retrieving users', error: err.message });
    }
};

const getUserById = async (req, res) => {
    try {
        const user = await User.getById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.status(200).json({ data: user });
    } catch (err) {
        res.status(500).json({ message: 'Error retrieving user', error: err.message });
    }
};

const updateUserRole = async (req, res) => {
    try {
        const { role } = req.body;
        if (!role || !VALID_ROLES.includes(role)) {
            return res.status(400).json({ message: `Role must be one of: ${VALID_ROLES.join(', ')}` });
        }

        // Only SUPER_ADMIN can update user roles
        if (req.user.role !== 'SUPER_ADMIN') {
            return res.status(403).json({ message: 'Only SUPER_ADMIN users can assign roles' });
        }

        const user = await User.getById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Prevent super admin from demoting themselves
        if (String(req.user.id) === String(req.params.id) && role !== 'SUPER_ADMIN') {
            return res.status(403).json({ message: 'You cannot change your own role' });
        }

        const previousRole = user.role;
        await User.updateRole(req.params.id, role);

        // Fire-and-forget — email failure must not block the response
        if (previousRole !== role) {
            sendRoleChanged(user.email, user.first_name, previousRole, role);
        }

        res.status(200).json({ message: 'User role updated successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Error updating user role', error: err.message });
    }
};

const updateUserStatus = async (req, res) => {
    try {
        const rawValue = req.body.is_active;
        if (rawValue === undefined || rawValue === null) {
            return res.status(400).json({ message: 'is_active (true/false) is required' });
        }

        // Normalize to strict boolean regardless of whether frontend sends boolean or 0/1
        const is_active = rawValue === true || rawValue === 1 || rawValue === '1' || rawValue === 'true';

        // Only SUPER_ADMIN can change account status
        if (req.user.role !== 'SUPER_ADMIN') {
            return res.status(403).json({ message: 'Only SUPER_ADMIN users can change account status' });
        }

        const user = await User.getById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Prevent self-deactivation
        if (String(req.user.id) === String(req.params.id) && !is_active) {
            return res.status(403).json({ message: 'You cannot deactivate your own account' });
        }

        await User.updateStatus(req.params.id, is_active);
        res.status(200).json({ message: `User ${is_active ? 'activated' : 'deactivated'} successfully` });
    } catch (err) {
        res.status(500).json({ message: 'Error updating user status', error: err.message });
    }
};

const deleteUser = async (req, res) => {
    try {
        // Prevent self-deletion
        if (String(req.user.id) === String(req.params.id)) {
            return res.status(403).json({ message: 'You cannot delete your own account' });
        }

        const user = await User.getById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        await User.deleteUser(req.params.id);
        res.status(200).json({ message: 'User deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Error deleting user', error: err.message });
    }
};

module.exports = { getAllUsers, getUserById, updateUserRole, updateUserStatus, deleteUser };
