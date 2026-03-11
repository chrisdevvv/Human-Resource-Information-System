const Registration = require('./registrationModel');

const getAllRegistrations = async (req, res) => {
    try {
        const { status } = req.query;
        const results = await Registration.getAll(status || null);
        res.status(200).json({ data: results });
    } catch (err) {
        res.status(500).json({ message: 'Error retrieving registration requests', error: err.message });
    }
};

const getPendingRegistrations = async (req, res) => {
    try {
        const results = await Registration.getAll('PENDING');
        res.status(200).json({ data: results });
    } catch (err) {
        res.status(500).json({ message: 'Error retrieving pending registrations', error: err.message });
    }
};

const getRegistrationById = async (req, res) => {
    try {
        const result = await Registration.getById(req.params.id);
        if (!result) return res.status(404).json({ message: 'Registration request not found' });
        res.status(200).json({ data: result });
    } catch (err) {
        res.status(500).json({ message: 'Error retrieving registration request', error: err.message });
    }
};

const approveRegistration = async (req, res) => {
    try {
        if (req.user.role !== 'SUPER_ADMIN') {
            return res.status(403).json({ message: 'Only super admin can approve registrations' });
        }

        const { approved_role } = req.body;
        await Registration.approve(req.params.id, approved_role || null, req.user.id);
        res.status(200).json({ message: 'Registration request approved successfully' });
    } catch (err) {
        const status = err.message.includes('not found') ? 404 : 500;
        res.status(status).json({ message: err.message || 'Error approving registration', error: err.message });
    }
};

const rejectRegistration = async (req, res) => {
    try {
        if (req.user.role !== 'SUPER_ADMIN') {
            return res.status(403).json({ message: 'Only super admin can reject registrations' });
        }

        const { rejection_reason } = req.body;
        await Registration.reject(req.params.id, rejection_reason || null, req.user.id);
        res.status(200).json({ message: 'Registration request rejected' });
    } catch (err) {
        res.status(500).json({ message: 'Error rejecting registration request', error: err.message });
    }
};

module.exports = { getAllRegistrations, getPendingRegistrations, getRegistrationById, approveRegistration, rejectRegistration };
