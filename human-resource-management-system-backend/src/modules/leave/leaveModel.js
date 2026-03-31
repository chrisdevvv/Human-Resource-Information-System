const pool = require("../../config/db");

const SYSTEM_PARTICULARS = new Set([
  "Adoption Leave",
  "Balance Forwarded",
  "Brigada Eskwela",
  "Checking of Forms",
  "Compensatory Paid Leave",
  "Early Registration/Enrollment",
  "Election",
  "Forced Leave",
  "Forced Leave (Disapproved)",
  "Late/Undertime",
  "Leave Credit",
  "Maternity Leave",
  "Monetization",
  "Others",
  "Paternity Leave",
  "Rehabilitation Leave",
  "Remediation/Enrichment Classes/NLC",
  "Service Credit",
  "Sick Leave",
  "Solo Parent",
  "Special Emergency Leave",
  "Special Leave for Women",
  "Special Privilege Leave",
  "Study Leave",
  "Terminal Leave",
  "Training/Seminar",
  "VAWC Leave",
  "Vacation Leave",
  "Wellness Leave",
]);

const parseEnumValues = (columnType) => {
  if (!columnType || !/^enum\(/i.test(columnType)) return [];
  const inner = columnType.slice(
    columnType.indexOf("(") + 1,
    columnType.lastIndexOf(")"),
  );
  const matches = inner.match(/'((?:[^'\\]|\\.)*)'/g) || [];
  return matches.map((token) => token.slice(1, -1).replace(/\\'/g, "'"));
};

const toEnumSql = (values) =>
  values.map((v) => `'${String(v).replace(/'/g, "''")}'`).join(",");

const Leave = {
  // Supports optional filtering by employee_id and pagination. If pagination not provided, returns full rows for compatibility.
  getAll: async ({ employee_id } = {}, pagination) => {
    let baseQuery = `FROM leaves JOIN employees ON leaves.employee_id = employees.id WHERE 1=1`;
    const params = [];

    if (employee_id) {
      baseQuery += ` AND leaves.employee_id = ?`;
      params.push(employee_id);
    }

    const orderClause = ` ORDER BY leaves.employee_id ASC, leaves.id ASC`;

    if (!pagination || !pagination.page) {
      const [rows] = await pool
        .promise()
        .query(
          `SELECT leaves.*, CONCAT(employees.first_name, ' ', employees.last_name) AS full_name, employees.employee_type ${baseQuery} ${orderClause}`,
          params,
        );
      return rows;
    }

    const page = Number(pagination.page) || 1;
    const pageSize = Math.min(Number(pagination.pageSize) || 50, 500);
    const offset = (page - 1) * pageSize;

    const [[{ total }]] = await pool
      .promise()
      .query(`SELECT COUNT(1) as total ${baseQuery}`, params);

    const [rows] = await pool
      .promise()
      .query(
        `SELECT leaves.*, CONCAT(employees.first_name, ' ', employees.last_name) AS full_name, employees.employee_type ${baseQuery} ${orderClause} LIMIT ? OFFSET ?`,
        [...params, pageSize, offset],
      );

    return { data: rows, total: Number(total), page, pageSize };
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
      `SELECT id, first_name, last_name, employee_type, on_leave, on_leave_from, on_leave_until
             FROM employees
             WHERE is_archived = 0
               AND LOWER(REPLACE(employee_type, '_', '-')) = 'non-teaching'`,
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

  getParticulars: async () => {
    const [rows] = await pool.promise().query(
      `SELECT COLUMN_TYPE AS column_type
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'leaves'
         AND COLUMN_NAME = 'particulars'
       LIMIT 1`,
    );

    const columnType = rows[0]?.column_type || "";
    return parseEnumValues(columnType);
  },

  isParticularAllowed: async (particular) => {
    const options = await Leave.getParticulars();
    return options.includes(String(particular || "").trim());
  },

  addParticular: async (particular) => {
    const normalized = String(particular || "").trim();
    const current = await Leave.getParticulars();

    if (current.includes(normalized)) {
      return { created: false, options: current };
    }

    const next = [...current, normalized];
    const enumSql = toEnumSql(next);

    await pool.promise().query(
      `ALTER TABLE leaves
       MODIFY COLUMN particulars ENUM(${enumSql}) NULL`,
    );

    return { created: true, options: next };
  },

  updateParticular: async (oldParticular, newParticular) => {
    const oldValue = String(oldParticular || "").trim();
    const newValue = String(newParticular || "").trim();

    if (!oldValue || !newValue) {
      const err = new Error("old_particular and new_particular are required");
      err.statusCode = 400;
      throw err;
    }

    if (oldValue === newValue) {
      return { updated: false, reason: "same-value" };
    }

    if (SYSTEM_PARTICULARS.has(oldValue)) {
      const err = new Error("System particulars cannot be updated");
      err.statusCode = 403;
      throw err;
    }

    const current = await Leave.getParticulars();
    if (!current.includes(oldValue)) {
      const err = new Error("Particular not found");
      err.statusCode = 404;
      throw err;
    }

    if (current.includes(newValue)) {
      const err = new Error("The new particular already exists");
      err.statusCode = 409;
      throw err;
    }

    await pool.promise().query(
      `UPDATE leaves
       SET particulars = ?
       WHERE particulars = ?`,
      [newValue, oldValue],
    );

    const next = current.map((v) => (v === oldValue ? newValue : v));
    const enumSql = toEnumSql(next);
    await pool.promise().query(
      `ALTER TABLE leaves
       MODIFY COLUMN particulars ENUM(${enumSql}) NULL`,
    );

    return { updated: true, options: next };
  },

  deleteParticular: async (particular) => {
    const value = String(particular || "").trim();
    if (!value) {
      const err = new Error("particular is required");
      err.statusCode = 400;
      throw err;
    }

    if (SYSTEM_PARTICULARS.has(value)) {
      const err = new Error("System particulars cannot be deleted");
      err.statusCode = 403;
      throw err;
    }

    const current = await Leave.getParticulars();
    if (!current.includes(value)) {
      const err = new Error("Particular not found");
      err.statusCode = 404;
      throw err;
    }

    await pool.promise().query(
      `UPDATE leaves
       SET particulars = 'Others'
       WHERE particulars = ?`,
      [value],
    );

    const next = current.filter((v) => v !== value);
    const enumSql = toEnumSql(next);
    await pool.promise().query(
      `ALTER TABLE leaves
       MODIFY COLUMN particulars ENUM(${enumSql}) NULL`,
    );

    return { deleted: true, options: next };
  },
};

module.exports = Leave;
