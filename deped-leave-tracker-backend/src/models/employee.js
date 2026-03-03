const db = require('../config/db');

const Employee = {
    create: (employeeData, callback) => {
        const query = 'INSERT INTO employees SET ?';
        db.query(query, employeeData, (error, results) => {
            if (error) {
                return callback(error);
            }
            callback(null, results.insertId);
        });
    },

    getAll: (callback) => {
        const query = 'SELECT * FROM employees';
        db.query(query, (error, results) => {
            if (error) {
                return callback(error);
            }
            callback(null, results);
        });
    },

    getById: (id, callback) => {
        const query = 'SELECT * FROM employees WHERE id = ?';
        db.query(query, [id], (error, results) => {
            if (error) {
                return callback(error);
            }
            callback(null, results[0]);
        });
    },

    update: (id, employeeData, callback) => {
        const query = 'UPDATE employees SET ? WHERE id = ?';
        db.query(query, [employeeData, id], (error, results) => {
            if (error) {
                return callback(error);
            }
            callback(null, results.affectedRows);
        });
    },

    delete: (id, callback) => {
        const query = 'DELETE FROM employees WHERE id = ?';
        db.query(query, [id], (error, results) => {
            if (error) {
                return callback(error);
            }
            callback(null, results.affectedRows);
        });
    }
};

module.exports = Employee;
