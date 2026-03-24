const pool = require("../../config/db");

const Backlog = {
  getAll: async () => {
    const [rows] = await pool.promise().query(`
            SELECT backlogs.*, users.first_name, users.last_name, users.role, users.email,
                   schools.school_name
            FROM backlogs
            LEFT JOIN users ON backlogs.user_id = users.id
            LEFT JOIN schools ON users.school_id = schools.id
            ORDER BY backlogs.created_at DESC
        `);
    return rows;
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
};

module.exports = Backlog;
