const db = require('../config/db');

const Leave = {
    createLeave: (leaveData, callback) => {
        const query = 'INSERT INTO leaves (employee_id, leave_type, start_date, end_date, status) VALUES (?, ?, ?, ?, ?)';
        db.query(query, [leaveData.employee_id, leaveData.leave_type, leaveData.start_date, leaveData.end_date, leaveData.status], (error, results) => {
            if (error) {
                return callback(error);
            }
            return callback(null, results);
        });
    },

    getLeaveById: (leaveId, callback) => {
        const query = 'SELECT * FROM leaves WHERE id = ?';
        db.query(query, [leaveId], (error, results) => {
            if (error) {
                return callback(error);
            }
            return callback(null, results[0]);
        });
    },

    updateLeave: (leaveId, leaveData, callback) => {
        const query = 'UPDATE leaves SET leave_type = ?, start_date = ?, end_date = ?, status = ? WHERE id = ?';
        db.query(query, [leaveData.leave_type, leaveData.start_date, leaveData.end_date, leaveData.status, leaveId], (error, results) => {
            if (error) {
                return callback(error);
            }
            return callback(null, results);
        });
    },

    deleteLeave: (leaveId, callback) => {
        const query = 'DELETE FROM leaves WHERE id = ?';
        db.query(query, [leaveId], (error, results) => {
            if (error) {
                return callback(error);
            }
            return callback(null, results);
        });
    },

    getAllLeaves: (callback) => {
        const query = 'SELECT * FROM leaves';
        db.query(query, (error, results) => {
            if (error) {
                return callback(error);
            }
            return callback(null, results);
        });
    }
};

module.exports = Leave;