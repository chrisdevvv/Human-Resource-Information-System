const pool = require("../../config/db");

const EMPLOYEE_SELECT_WITH_AGE =
  "employees.*, schools.school_name, COALESCE(employees.age, TIMESTAMPDIFF(YEAR, employees.birthdate, CURDATE())) AS age";

const Employee = {
  // Supports optional pagination: if `pagination` omitted, returns full rows for compatibility.
  getAll: async (filters = {}) => {
    const page = Number(filters.page) || null;
    const pageSize = Math.min(Number(filters.pageSize) || 25, 200);
    const includeArchived = Boolean(filters.includeArchived);
    const whereParts = [];

    if (!includeArchived) {
      whereParts.push("employees.is_archived = 0");
    }

    if (filters.onLeave === true) {
      whereParts.push("employees.on_leave = 1");
    } else if (filters.onLeave === false) {
      whereParts.push("employees.on_leave = 0");
    }

    if (filters.schoolId) {
      whereParts.push("employees.school_id = ?");
    }

    const params = [];
    if (filters.schoolId) {
      params.push(filters.schoolId);
    }

    const whereClause =
      whereParts.length > 0 ? `WHERE ${whereParts.join(" AND ")}` : "";
    const baseQuery = `FROM employees JOIN schools ON employees.school_id = schools.id ${whereClause}`;

    if (!page) {
      const [rows] = await pool
        .promise()
        .query(
          `SELECT ${EMPLOYEE_SELECT_WITH_AGE} ${baseQuery} ORDER BY employees.id ASC`,
          params,
        );
      return rows;
    }

    const offset = (page - 1) * pageSize;

    const [[{ total }]] = await pool
      .promise()
      .query(`SELECT COUNT(1) as total ${baseQuery}`, params);

    const [rows] = await pool
      .promise()
      .query(
        `SELECT ${EMPLOYEE_SELECT_WITH_AGE} ${baseQuery} ORDER BY employees.id ASC LIMIT ? OFFSET ?`,
        [...params, pageSize, offset],
      );

    return { data: rows, total: Number(total), page, pageSize };
  },

  getById: async (id, options = {}) => {
    const includeArchived = Boolean(options.includeArchived);
    const archivedFilter = includeArchived
      ? ""
      : "AND employees.is_archived = 0";
    const [rows] = await pool.promise().query(
      `
            SELECT ${EMPLOYEE_SELECT_WITH_AGE}
            FROM employees
            JOIN schools ON employees.school_id = schools.id
            WHERE employees.id = ?
            ${archivedFilter}
        `,
      [id],
    );
    return rows[0];
  },

  getBySchool: async (school_id, options = {}) => {
    const includeArchived = Boolean(options.includeArchived);
    const whereParts = ["employees.school_id = ?"];

    if (!includeArchived) {
      whereParts.push("employees.is_archived = 0");
    }

    if (options.onLeave === true) {
      whereParts.push("employees.on_leave = 1");
    } else if (options.onLeave === false) {
      whereParts.push("employees.on_leave = 0");
    }

    const whereClause = whereParts.join(" AND ");
    const [rows] = await pool.promise().query(
      `SELECT ${EMPLOYEE_SELECT_WITH_AGE}
       FROM employees
       JOIN schools ON employees.school_id = schools.id
       WHERE ${whereClause}`,
      [school_id],
    );
    return rows;
  },

  create: async (data) => {
    const {
      first_name,
      middle_name,
      last_name,
      email,
      personal_email,
      middle_initial,
      mobile_number,
      home_address,
      employee_type,
      school_id,
      employee_no,
      work_email,
      district,
      work_district,
      position,
      plantilla_no,
      age,
      birthdate,
    } = data;
    const personalEmail = personal_email || email || null;
    const middleInitial =
      middle_initial || (middle_name ? String(middle_name).trim().charAt(0) : null);
    const resolvedDistrict = district || work_district || null;
    const [result] = await pool
      .promise()
      .query(
        "INSERT INTO employees (first_name, middle_name, last_name, middle_initial, email, mobile_number, home_address, employee_type, school_id, employee_no, work_email, district, `position`, plantilla_no, age, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          first_name,
          middle_name || null,
          last_name,
          middleInitial || null,
          personalEmail,
          mobile_number || null,
          home_address || null,
          employee_type,
          school_id,
          employee_no || null,
          work_email || null,
          resolvedDistrict,
          position || null,
          plantilla_no || null,
          age || null,
          birthdate,
        ],
      );
    return result;
  },

  update: async (id, data) => {
    const {
      first_name,
      middle_name,
      last_name,
      email,
      personal_email,
      middle_initial,
      mobile_number,
      home_address,
      employee_type,
      school_id,
      employee_no,
      work_email,
      district,
      work_district,
      position,
      plantilla_no,
      age,
      birthdate,
    } = data;
    const personalEmail = personal_email || email || null;
    const middleInitial =
      middle_initial || (middle_name ? String(middle_name).trim().charAt(0) : null);
    const resolvedDistrict = district || work_district || null;
    const [result] = await pool
      .promise()
      .query(
        "UPDATE employees SET first_name = ?, middle_name = ?, last_name = ?, middle_initial = ?, email = ?, mobile_number = ?, home_address = ?, employee_type = ?, school_id = ?, employee_no = ?, work_email = ?, district = ?, `position` = ?, plantilla_no = ?, age = ?, birthdate = ? WHERE id = ? AND is_archived = 0",
        [
          first_name,
          middle_name || null,
          last_name,
          middleInitial || null,
          personalEmail,
          mobile_number || null,
          home_address || null,
          employee_type,
          school_id,
          employee_no || null,
          work_email || null,
          resolvedDistrict,
          position || null,
          plantilla_no || null,
          age || null,
          birthdate || null,
          id,
        ],
      );
    return result;
  },

  archive: async (id, archivedBy) => {
    const [result] = await pool.promise().query(
      `UPDATE employees
       SET is_archived = 1, archived_at = NOW(), archived_by = ?
       WHERE id = ? AND is_archived = 0`,
      [archivedBy || null, id],
    );
    return result;
  },

  unarchive: async (id) => {
    const [result] = await pool.promise().query(
      `UPDATE employees
       SET is_archived = 0, archived_at = NULL, archived_by = NULL
       WHERE id = ? AND is_archived = 1`,
      [id],
    );
    return result;
  },

  markOnLeave: async (id, data = {}) => {
    const { on_leave_from, on_leave_until, reason } = data;
    const [result] = await pool.promise().query(
      `UPDATE employees
       SET on_leave = 1,
           on_leave_from = ?,
           on_leave_until = ?,
           on_leave_reason = ?,
           leave_status_updated_at = NOW()
       WHERE id = ? AND is_archived = 0`,
      [on_leave_from || null, on_leave_until || null, reason || null, id],
    );
    return result;
  },

  markAvailable: async (id) => {
    const [result] = await pool.promise().query(
      `UPDATE employees
       SET on_leave = 0,
           on_leave_from = NULL,
           on_leave_until = NULL,
           on_leave_reason = NULL,
           leave_status_updated_at = NOW()
       WHERE id = ? AND is_archived = 0`,
      [id],
    );
    return result;
  },

  getStatusCounts: async (filters = {}) => {
    const params = [];
    let whereClause = "";

    if (filters.schoolId) {
      whereClause = "WHERE school_id = ?";
      params.push(filters.schoolId);
    }

    const [rows] = await pool.promise().query(
      `SELECT
         COUNT(1) AS total_all,
         SUM(CASE WHEN is_archived = 1 THEN 1 ELSE 0 END) AS archived,
         SUM(CASE WHEN is_archived = 0 THEN 1 ELSE 0 END) AS active_total,
         SUM(CASE WHEN is_archived = 0 AND on_leave = 1 THEN 1 ELSE 0 END) AS on_leave,
         SUM(CASE WHEN is_archived = 0 AND on_leave = 0 THEN 1 ELSE 0 END) AS available
       FROM employees
       ${whereClause}`,
      params,
    );

    return (
      rows[0] || {
        total_all: 0,
        archived: 0,
        active_total: 0,
        on_leave: 0,
        available: 0,
      }
    );
  },

  delete: async (id) => {
    const [result] = await pool
      .promise()
      .query("DELETE FROM employees WHERE id = ?", [id]);
    return result;
  },
};

module.exports = Employee;
