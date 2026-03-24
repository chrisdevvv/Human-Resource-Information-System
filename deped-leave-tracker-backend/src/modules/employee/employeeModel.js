const pool = require("../../config/db");

const Employee = {
  // Supports optional pagination: if `pagination` omitted, returns full rows for compatibility.
  getAll: async (pagination) => {
    const baseQuery = `FROM employees JOIN schools ON employees.school_id = schools.id`;

    if (!pagination || !pagination.page) {
      const [rows] = await pool
        .promise()
        .query(`SELECT employees.*, schools.school_name ${baseQuery}`);
      return rows;
    }

    const page = Number(pagination.page) || 1;
    const pageSize = Math.min(Number(pagination.pageSize) || 25, 200);
    const offset = (page - 1) * pageSize;

    const [[{ total }]] = await pool
      .promise()
      .query(`SELECT COUNT(1) as total ${baseQuery}`);

    const [rows] = await pool
      .promise()
      .query(
        `SELECT employees.*, schools.school_name ${baseQuery} ORDER BY employees.id ASC LIMIT ? OFFSET ?`,
        [pageSize, offset],
      );

    return { data: rows, total: Number(total), page, pageSize };
  },

  getById: async (id) => {
    const [rows] = await pool.promise().query(
      `
            SELECT employees.*, schools.school_name
            FROM employees
            JOIN schools ON employees.school_id = schools.id
            WHERE employees.id = ?
        `,
      [id],
    );
    return rows[0];
  },

  getBySchool: async (school_id) => {
    const [rows] = await pool
      .promise()
      .query("SELECT * FROM employees WHERE school_id = ?", [school_id]);
    return rows;
  },

  create: async (data) => {
    const { first_name, last_name, email, employee_type, school_id } = data;
    const [result] = await pool
      .promise()
      .query(
        "INSERT INTO employees (first_name, last_name, email, employee_type, school_id) VALUES (?, ?, ?, ?, ?)",
        [first_name, last_name, email, employee_type, school_id],
      );
    return result;
  },

  update: async (id, data) => {
    const { first_name, last_name, email, employee_type, school_id } = data;
    const [result] = await pool
      .promise()
      .query(
        "UPDATE employees SET first_name = ?, last_name = ?, email = ?, employee_type = ?, school_id = ? WHERE id = ?",
        [first_name, last_name, email, employee_type, school_id, id],
      );
    return result;
  },

  delete: async (id) => {
    const [result] = await pool
      .promise()
      .query("DELETE FROM employees WHERE id = ?", [id]);
    return result;
  },
};

module.exports = Employee;
