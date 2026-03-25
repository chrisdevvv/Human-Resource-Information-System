const pool = require("../../config/db");

const Backlog = {
  // Supports optional pagination and filtering. If pagination not provided, returns all rows (backwards compatible).
  getAll: async (pagination, options = {}) => {
    const includeArchived = options.includeArchived !== false; // Default to including archived
    const baseQuery = `FROM backlogs LEFT JOIN users ON backlogs.user_id = users.id LEFT JOIN schools ON users.school_id = schools.id`;
    const whereClause = includeArchived ? "" : "WHERE backlogs.is_archived = 0";

    if (!pagination || !pagination.page) {
      const [rows] = await pool
        .promise()
        .query(
          `SELECT backlogs.*, users.first_name, users.last_name, users.role, users.email, schools.school_name ${baseQuery} ${whereClause} ORDER BY backlogs.created_at DESC`,
        );
      return rows;
    }

    const page = Number(pagination.page) || 1;
    const pageSize = Math.min(Number(pagination.pageSize) || 25, 200);
    const offset = (page - 1) * pageSize;

    const [[{ total }]] = await pool
      .promise()
      .query(`SELECT COUNT(1) as total ${baseQuery} ${whereClause}`);

    const [rows] = await pool
      .promise()
      .query(
        `SELECT backlogs.*, users.first_name, users.last_name, users.role, users.email, schools.school_name ${baseQuery} ${whereClause} ORDER BY backlogs.created_at DESC LIMIT ? OFFSET ?`,
        [pageSize, offset],
      );

    return { data: rows, total: Number(total), page, pageSize };
  },

  getById: async (id) => {
    const [rows] = await pool.promise().query(
      `SELECT backlogs.*, users.first_name, users.last_name, users.role, users.email,
              schools.school_name
       FROM backlogs
       LEFT JOIN users ON backlogs.user_id = users.id
       LEFT JOIN schools ON users.school_id = schools.id
       WHERE backlogs.id = ?`,
      [id],
    );
    return rows[0];
  },

  create: async (data) => {
    const { user_id, school_id, employee_id, leave_id, action, details } = data;
    const [result] = await pool
      .promise()
      .query(
        "INSERT INTO backlogs (user_id, school_id, employee_id, leave_id, action, details) VALUES (?, ?, ?, ?, ?, ?)",
        [user_id, school_id, employee_id, leave_id, action, details],
      );
    return result;
  },

  record: async (data) => {
    if (!data || !data.action) {
      throw new Error("Backlog action is required");
    }

    return Backlog.create({
      user_id: data.user_id || null,
      school_id: data.school_id || null,
      employee_id: data.employee_id || null,
      leave_id: data.leave_id || null,
      action: String(data.action).trim(),
      details: data.details ? String(data.details).trim() : null,
    });
  },

  getByUser: async (user_id) => {
    const [rows] = await pool
      .promise()
      .query(
        "SELECT * FROM backlogs WHERE user_id = ? ORDER BY created_at DESC",
        [user_id],
      );
    return rows;
  },

  getBySchool: async (school_id) => {
    const [rows] = await pool
      .promise()
      .query(
        "SELECT * FROM backlogs WHERE school_id = ? ORDER BY created_at DESC",
        [school_id],
      );
    return rows;
  },

  getReport: async (filters = {}) => {
    const whereParts = [];
    const params = [];

    if (!filters.includeArchived) {
      whereParts.push("backlogs.is_archived = 0");
    }

    if (filters.from) {
      whereParts.push("backlogs.created_at >= ?");
      params.push(filters.from);
    }

    if (filters.to) {
      whereParts.push("backlogs.created_at <= ?");
      params.push(filters.to);
    }

    if (filters.action) {
      whereParts.push("backlogs.action = ?");
      params.push(filters.action);
    }

    if (filters.userId) {
      whereParts.push("backlogs.user_id = ?");
      params.push(filters.userId);
    }

    if (filters.schoolId) {
      whereParts.push("backlogs.school_id = ?");
      params.push(filters.schoolId);
    }

    if (filters.employeeId) {
      whereParts.push("backlogs.employee_id = ?");
      params.push(filters.employeeId);
    }

    if (filters.leaveId) {
      whereParts.push("backlogs.leave_id = ?");
      params.push(filters.leaveId);
    }

    const whereClause = whereParts.length
      ? `WHERE ${whereParts.join(" AND ")}`
      : "";

    const [rows] = await pool.promise().query(
      `SELECT
         backlogs.*,
         users.first_name,
         users.last_name,
         users.role,
         users.email,
         schools.school_name
       FROM backlogs
       LEFT JOIN users ON backlogs.user_id = users.id
       LEFT JOIN schools ON users.school_id = schools.id
       ${whereClause}
       ORDER BY backlogs.created_at DESC`,
      params,
    );

    return rows;
  },
};

module.exports = Backlog;
