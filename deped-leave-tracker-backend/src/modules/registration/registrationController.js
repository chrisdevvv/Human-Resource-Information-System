const Registration = require('./registrationModel');
const Backlog = require('../backlog/backlogModel');
const { sendRegistrationApproved, sendRegistrationRejected } = require('../../utils/mailer');

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

        // Fetch record before approving so we have email/name for the notification
        const registration = await Registration.getById(req.params.id);
        if (!registration) {
            return res.status(404).json({ message: 'Registration request not found' });
        }

        const { approved_role } = req.body;
        const finalRole = approved_role || registration.requested_role || 'DATA_ENCODER';
        await Registration.approve(req.params.id, approved_role || null, req.user.id);

        // Fire-and-forget — email failure must not block the response
        sendRegistrationApproved(registration.email, registration.first_name, finalRole);
        Backlog.create({
            user_id: req.user.id,
            school_id: null,
            employee_id: null,
            leave_id: null,
            action: 'REGISTRATION_APPROVED',
            details: `${registration.first_name} ${registration.last_name} as ${finalRole}`,
        });

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

        // Fetch record before rejecting so we have email/name for the notification
        const registration = await Registration.getById(req.params.id);
        if (!registration) {
            return res.status(404).json({ message: 'Registration request not found' });
        }

        const { rejection_reason } = req.body;
        await Registration.reject(req.params.id, rejection_reason || null, req.user.id);

        // Fire-and-forget — email failure must not block the response
        sendRegistrationRejected(registration.email, registration.first_name, rejection_reason || null);
        Backlog.create({
            user_id: req.user.id,
            school_id: null,
            employee_id: null,
            leave_id: null,
            action: 'REGISTRATION_REJECTED',
            details: `${registration.first_name} ${registration.last_name}${rejection_reason ? `: ${rejection_reason}` : ''}`,
        });

        res.status(200).json({ message: 'Registration request rejected' });
    } catch (err) {
        res.status(500).json({ message: 'Error rejecting registration request', error: err.message });
    }
};

module.exports = { getAllRegistrations, getPendingRegistrations, getRegistrationById, approveRegistration, rejectRegistration };
