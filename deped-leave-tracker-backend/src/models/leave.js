const pool = require('../config/db');

const Leave = {
    getAll: async () => {
        const [rows] = await pool.promise().query(`
            SELECT leaves.*, employees.full_name, employees.employee_type
            FROM leaves
            JOIN employees ON leaves.employee_id = employees.id
        `);
        return rows;
    },

    getById: async (id) => {
        const [rows] = await pool.promise().query(`
            SELECT leaves.*, employees.full_name, employees.employee_type
            FROM leaves
            JOIN employees ON leaves.employee_id = employees.id
            WHERE leaves.id = ?
        `, [id]);
        return rows[0];
    },

    getByEmployeeId: async (employee_id) => {
        const [rows] = await pool.promise().query('SELECT * FROM leaves WHERE employee_id = ?', [employee_id]);
        return rows;
    },

    create: async (data) => {
        const {
            employee_id, period_of_leave, particulars,
            earned_vl, abs_with_pay_vl, abs_without_pay_vl, bal_vl,
            earned_sl, abs_with_pay_sl, abs_without_pay_sl, bal_sl,
            date_of_action
        } = data;
        const [result] = await pool.promise().query(
            `INSERT INTO leaves (
                employee_id, period_of_leave, particulars,
                earned_vl, abs_with_pay_vl, abs_without_pay_vl, bal_vl,
                earned_sl, abs_with_pay_sl, abs_without_pay_sl, bal_sl,
                date_of_action
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                employee_id, period_of_leave, particulars,
                earned_vl, abs_with_pay_vl, abs_without_pay_vl, bal_vl,
                earned_sl, abs_with_pay_sl, abs_without_pay_sl, bal_sl,
                date_of_action
            ]
        );
        return result;
    },

    update: async (id, data) => {
        const {
            period_of_leave, particulars,
            earned_vl, abs_with_pay_vl, abs_without_pay_vl, bal_vl,
            earned_sl, abs_with_pay_sl, abs_without_pay_sl, bal_sl,
            date_of_action
        } = data;
        const [result] = await pool.promise().query(
            `UPDATE leaves SET
                period_of_leave = ?, particulars = ?,
                earned_vl = ?, abs_with_pay_vl = ?, abs_without_pay_vl = ?, bal_vl = ?,
                earned_sl = ?, abs_with_pay_sl = ?, abs_without_pay_sl = ?, bal_sl = ?,
                date_of_action = ?
            WHERE id = ?`,
            [
                period_of_leave, particulars,
                earned_vl, abs_with_pay_vl, abs_without_pay_vl, bal_vl,
                earned_sl, abs_with_pay_sl, abs_without_pay_sl, bal_sl,
                date_of_action, id
            ]
        );
        return result;
    },

    delete: async (id) => {
        const [result] = await pool.promise().query('DELETE FROM leaves WHERE id = ?', [id]);
        return result;
    }
};

module.exports = Leave;
