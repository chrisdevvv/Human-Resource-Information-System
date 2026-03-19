const pool = require("../../config/db");

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
    const [rows] = await pool.promise().query(
      `
            SELECT leaves.*,
                   CONCAT(employees.first_name, ' ', employees.last_name) AS full_name,
                   employees.employee_type
            FROM leaves
            JOIN employees ON leaves.employee_id = employees.id
            WHERE leaves.id = ?
        `,
      [id],
    );
    return rows[0];
  },

  getByEmployeeId: async (employee_id) => {
    const [rows] = await pool
      .promise()
      .query(
        "SELECT * FROM leaves WHERE employee_id = ? ORDER BY COALESCE(date_of_action, created_at) ASC, id ASC",
        [employee_id],
      );
    return rows;
  },

  create: async (data) => {
    const {
      employee_id,
      period_of_leave,
      entry_kind,
      particulars,
      earned_vl,
      abs_with_pay_vl,
      abs_without_pay_vl,
      bal_vl,
      earned_sl,
      abs_with_pay_sl,
      abs_without_pay_sl,
      bal_sl,
      date_of_action,
    } = data;
    const [result] = await pool.promise().query(
      `INSERT INTO leaves (
                employee_id, period_of_leave, entry_kind, particulars,
                earned_vl, abs_with_pay_vl, abs_without_pay_vl, bal_vl,
                earned_sl, abs_with_pay_sl, abs_without_pay_sl, bal_sl,
                date_of_action
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        employee_id,
        period_of_leave,
        entry_kind,
        particulars,
        earned_vl,
        abs_with_pay_vl,
        abs_without_pay_vl,
        bal_vl,
        earned_sl,
        abs_with_pay_sl,
        abs_without_pay_sl,
        bal_sl,
        date_of_action,
      ],
    );
    return result;
  },

  update: async (id, data) => {
    const {
      period_of_leave,
      entry_kind,
      particulars,
      earned_vl,
      abs_with_pay_vl,
      abs_without_pay_vl,
      bal_vl,
      earned_sl,
      abs_with_pay_sl,
      abs_without_pay_sl,
      bal_sl,
      date_of_action,
    } = data;
    const [result] = await pool.promise().query(
      `UPDATE leaves SET
                period_of_leave = ?, entry_kind = ?, particulars = ?,
                earned_vl = ?, abs_with_pay_vl = ?, abs_without_pay_vl = ?, bal_vl = ?,
                earned_sl = ?, abs_with_pay_sl = ?, abs_without_pay_sl = ?, bal_sl = ?,
                date_of_action = ?
            WHERE id = ?`,
      [
        period_of_leave,
        entry_kind,
        particulars,
        earned_vl,
        abs_with_pay_vl,
        abs_without_pay_vl,
        bal_vl,
        earned_sl,
        abs_with_pay_sl,
        abs_without_pay_sl,
        bal_sl,
        date_of_action,
        id,
      ],
    );
    return result;
  },

  delete: async (id) => {
    const [result] = await pool
      .promise()
      .query("DELETE FROM leaves WHERE id = ?", [id]);
    return result;
  },

  // Returns the most recent leave entry for an employee (for balance carry-forward)
  getLatestByEmployee: async (employee_id) => {
    const [rows] = await pool
      .promise()
      .query(
        "SELECT * FROM leaves WHERE employee_id = ? ORDER BY COALESCE(date_of_action, created_at) DESC, id DESC LIMIT 1",
        [employee_id],
      );
    return rows[0] || null;
  },

  // Returns all leave entries for an employee in running-order
  getByEmployeeOrdered: async (employee_id) => {
    const [rows] = await pool
      .promise()
      .query(
        "SELECT * FROM leaves WHERE employee_id = ? ORDER BY COALESCE(date_of_action, created_at) ASC, id ASC",
        [employee_id],
      );
    return rows;
  },

  // Returns the entry directly before the given id for the same employee (for update recalculation)
  getPreviousEntry: async (id, employee_id) => {
    const [rows] = await pool
      .promise()
      .query(
        "SELECT * FROM leaves WHERE employee_id = ? AND id < ? ORDER BY COALESCE(date_of_action, created_at) DESC, id DESC LIMIT 1",
        [employee_id, id],
      );
    return rows[0] || null;
  },

  // Updates only computed balances during cascading recompute
  updateBalancesOnly: async (id, bal_vl, bal_sl) => {
    const [result] = await pool
      .promise()
      .query("UPDATE leaves SET bal_vl = ?, bal_sl = ? WHERE id = ?", [
        bal_vl,
        bal_sl,
        id,
      ]);
    return result;
  },

  // Updates normalized numeric leave values plus computed balances.
  updateComputedLeaveFields: async (id, data) => {
    const {
      earned_vl,
      abs_with_pay_vl,
      abs_without_pay_vl,
      bal_vl,
      earned_sl,
      abs_with_pay_sl,
      abs_without_pay_sl,
      bal_sl,
    } = data;

    const [result] = await pool.promise().query(
      `UPDATE leaves SET
                earned_vl = ?, abs_with_pay_vl = ?, abs_without_pay_vl = ?, bal_vl = ?,
                earned_sl = ?, abs_with_pay_sl = ?, abs_without_pay_sl = ?, bal_sl = ?
             WHERE id = ?`,
      [
        earned_vl,
        abs_with_pay_vl,
        abs_without_pay_vl,
        bal_vl,
        earned_sl,
        abs_with_pay_sl,
        abs_without_pay_sl,
        bal_sl,
        id,
      ],
    );
    return result;
  },

  // Checks if an entry for a given period already exists (prevents double monthly credits)
  hasEntryForPeriod: async (
    employee_id,
    period_of_leave,
    entry_kind = "MONTHLY_CREDIT",
    earned_vl = 1.25,
    earned_sl = 1.25,
  ) => {
    const [rows] = await pool.promise().query(
      `SELECT id
             FROM leaves
             WHERE employee_id = ?
               AND period_of_leave = ?
               AND (
                    entry_kind = ?
                    OR (
                        entry_kind IS NULL
                        AND earned_vl = ?
                        AND earned_sl = ?
                        AND abs_with_pay_vl = 0
                        AND abs_without_pay_vl = 0
                        AND abs_with_pay_sl = 0
                        AND abs_without_pay_sl = 0
                    )
               )
             LIMIT 1`,
      [employee_id, period_of_leave, entry_kind, earned_vl, earned_sl],
    );
    return rows.length > 0;
  },

  // Returns all non-teaching employees for batch monthly crediting
  getAllNonTeachingEmployees: async () => {
    const [rows] = await pool.promise().query(
      `SELECT id, first_name, last_name, employee_type
             FROM employees
             WHERE LOWER(REPLACE(employee_type, '_', '-')) = 'non-teaching'`,
    );
    return rows;
  },

  getEmployeeTypeById: async (employee_id) => {
    const [rows] = await pool
      .promise()
      .query("SELECT employee_type FROM employees WHERE id = ? LIMIT 1", [
        employee_id,
      ]);
    return rows[0]?.employee_type || null;
  },
};

module.exports = Leave;
