const pool = require("../../config/db");

const School = {
  getAll: async (options = {}) => {
    const whereParts = [];
    const params = [];

    const search =
      typeof options.search === "string" ? options.search.trim() : "";

    if (search) {
      whereParts.push("school_name LIKE ?");
      params.push(`%${search}%`);
    }

    const sortOrder =
      String(options.sortOrder || "a-z").toLowerCase() === "z-a"
        ? "DESC"
        : "ASC";

    const whereClause = whereParts.length
      ? ` WHERE ${whereParts.join(" AND ")}`
      : "";

    const [rows] = await pool.promise().query(
      `SELECT id, school_name, school_code FROM schools${whereClause} ORDER BY school_name ${sortOrder}, id ASC`,
      params
    );

    return rows;
  },

  getById: async (id) => {
    const [rows] = await pool
      .promise()
      .query("SELECT * FROM schools WHERE id = ?", [id]);
    return rows[0];
  },

  countAssignedEmployees: async (id) => {
    const [rows] = await pool
      .promise()
      .query("SELECT COUNT(*) AS total FROM employees WHERE school_id = ?", [
        id,
      ]);
    return Number(rows[0]?.total || 0);
  },

  create: async (data) => {
    const { school_name, school_code } = data;
    const [result] = await pool
      .promise()
      .query("INSERT INTO schools (school_name, school_code) VALUES (?, ?)", [
        school_name,
        school_code,
      ]);
    return result;
  },

  update: async (id, data) => {
    const { school_name, school_code } = data;
    const [result] = await pool
      .promise()
      .query(
        "UPDATE schools SET school_name = ?, school_code = ? WHERE id = ?",
        [school_name, school_code, id],
      );
    return result;
  },

  delete: async (id) => {
    const [result] = await pool
      .promise()
      .query("DELETE FROM schools WHERE id = ?", [id]);
    return result;
  },
};

module.exports = School;
