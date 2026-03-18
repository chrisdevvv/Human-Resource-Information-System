const pool = require('../../config/db');

const Leave = {
    getAll: async () => {
        const [rows] = await pool.promise().query(`
            SELECT leaves.*,
                   CONCAT(employees.first_name, ' ', employees.last_name) AS full_name,
                   employees.employee_type
            FROM leaves
            JOIN employees ON leaves.employee_id = employees.id
            ORDER BY leaves.employee_id ASC, leaves.id ASC
        `);
        return rows;
    },

    getById: async (id) => {
        const [rows] = await pool.promise().query(`
            SELECT leaves.*,
                   CONCAT(employees.first_name, ' ', employees.last_name) AS full_name,
                   employees.employee_type
            FROM leaves
            JOIN employees ON leaves.employee_id = employees.id
            WHERE leaves.id = ?
        `, [id]);
        return rows[0];
    },

    getByEmployeeId: async (employee_id) => {
        const [rows] = await pool.promise().query(
            'SELECT * FROM leaves WHERE employee_id = ? ORDER BY id ASC', [employee_id]
        );
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
    },

    // Returns the most recent leave entry for an employee (for balance carry-forward)
    getLatestByEmployee: async (employee_id) => {
        const [rows] = await pool.promise().query(
            'SELECT * FROM leaves WHERE employee_id = ? ORDER BY id DESC LIMIT 1',
            [employee_id]
        );
        return rows[0] || null;
    },

    // Returns all leave entries for an employee in running-order
    getByEmployeeOrdered: async (employee_id) => {
        const [rows] = await pool.promise().query(
            'SELECT * FROM leaves WHERE employee_id = ? ORDER BY id ASC',
            [employee_id]
        );
        return rows;
    },

    // Returns the entry directly before the given id for the same employee (for update recalculation)
    getPreviousEntry: async (id, employee_id) => {
        const [rows] = await pool.promise().query(
            'SELECT * FROM leaves WHERE employee_id = ? AND id < ? ORDER BY id DESC LIMIT 1',
            [employee_id, id]
        );
        return rows[0] || null;
    },

    // Updates only computed balances during cascading recompute
    updateBalancesOnly: async (id, bal_vl, bal_sl) => {
        const [result] = await pool.promise().query(
            'UPDATE leaves SET bal_vl = ?, bal_sl = ? WHERE id = ?',
            [bal_vl, bal_sl, id]
        );
        return result;
    },

    // Checks if an entry for a given period already exists (prevents double monthly credits)
    hasEntryForPeriod: async (employee_id, period_of_leave) => {
        const [rows] = await pool.promise().query(
                        `SELECT id
                         FROM leaves
                         WHERE employee_id = ?
                             AND period_of_leave = ?
                             AND LOWER(COALESCE(particulars, '')) = 'monthly leave credit'
                         LIMIT 1`,
            [employee_id, period_of_leave]
        );
        return rows.length > 0;
    },

    // Returns all non-teaching employees for batch monthly crediting
    getAllNonTeachingEmployees: async () => {
        const [rows] = await pool.promise().query(
            "SELECT id, first_name, last_name FROM employees WHERE employee_type = 'non-teaching'"
        );
        return rows;
    },
};

module.exports = Leave;
