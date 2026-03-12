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
