const pool = require("../../config/db");

const normalizeEmployeeType = (employeeType) => {
  if (!employeeType) return employeeType;
  const value = String(employeeType).trim().toLowerCase();
  if (value === "teaching") return "teaching";
  if (value === "non-teaching" || value === "non_teaching")
    return "non-teaching";
  return employeeType;
};

const Employee = {
  getAll: async () => {
    const [rows] = await pool.promise().query(`
            SELECT employees.*, schools.school_name
            FROM employees
            JOIN schools ON employees.school_id = schools.id
        `);
    return rows;
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
    const normalizedEmployeeType = normalizeEmployeeType(employee_type);
    const [result] = await pool
      .promise()
      .query(
        "INSERT INTO employees (first_name, last_name, email, employee_type, school_id) VALUES (?, ?, ?, ?, ?)",
        [first_name, last_name, email, normalizedEmployeeType, school_id],
      );
    return result;
  },

  update: async (id, data) => {
    const { first_name, last_name, email, employee_type, school_id } = data;
    const normalizedEmployeeType = normalizeEmployeeType(employee_type);
    const [result] = await pool
      .promise()
      .query(
        "UPDATE employees SET first_name = ?, last_name = ?, email = ?, employee_type = ?, school_id = ? WHERE id = ?",
        [first_name, last_name, email, normalizedEmployeeType, school_id, id],
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
