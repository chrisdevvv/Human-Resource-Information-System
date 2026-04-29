const pool = require("../../config/db");

const resolveSchoolSchemaInfo = async () => {
  const [rows] = await pool.promise().query(
    `SELECT COLUMN_NAME AS column_name
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'schools'
       AND COLUMN_NAME IN ('schoolId', 'id', 'schoolName', 'school_name', 'school_code')`,
  );

  const columns = new Set(rows.map((row) => row.column_name));

  return {
    id: columns.has("schoolId") ? "schoolId" : "id",
    name: columns.has("schoolName") ? "schoolName" : "school_name",
    code: columns.has("school_code") ? "school_code" : null,
  };
};

const School = {
  getAll: async (options = {}) => {
    const school = await resolveSchoolSchemaInfo();
    const whereParts = [];
    const params = [];
    const nameSelect = `schools.${school.name} AS school_name`;
    const codeSelect = school.code
      ? `schools.${school.code} AS school_code`
      : "NULL AS school_code";

    const search =
      typeof options.search === "string" ? options.search.trim() : "";

    if (search) {
      whereParts.push(`schools.${school.name} LIKE ?`);
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
      `SELECT schools.${school.id} AS id, ${nameSelect}, ${codeSelect}
       FROM schools${whereClause}
       ORDER BY schools.${school.name} ${sortOrder}, schools.${school.id} ASC`,
      params
    );

    return rows;
  },

  getById: async (id) => {
    const school = await resolveSchoolSchemaInfo();
    const [rows] = await pool
      .promise()
      .query(
        `SELECT schools.${school.id} AS id, schools.${school.name} AS school_name, ${
          school.code ? `schools.${school.code} AS school_code` : "NULL AS school_code"
        }
         FROM schools
         WHERE schools.${school.id} = ?`,
        [id],
      );
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
    const school = await resolveSchoolSchemaInfo();
    const { school_name, school_code } = data;
    const columns = [school.name];
    const values = [school_name];

    if (school.code) {
      columns.push(school.code);
      values.push(school_code);
    }

    const [result] = await pool
      .promise()
      .query(
        `INSERT INTO schools (${columns.map((column) => `\`${column}\``).join(", ")}) VALUES (${columns.map(() => "?").join(", ")})`,
        values,
      );
    return result;
  },

  update: async (id, data) => {
    const school = await resolveSchoolSchemaInfo();
    const { school_name, school_code } = data;
    const assignments = [`\`${school.name}\` = ?`];
    const values = [school_name];

    if (school.code) {
      assignments.push(`\`${school.code}\` = ?`);
      values.push(school_code);
    }

    values.push(id);
    const [result] = await pool
      .promise()
      .query(
        `UPDATE schools SET ${assignments.join(", ")} WHERE \`${school.id}\` = ?`,
        values,
      );
    return result;
  },

  delete: async (id) => {
    const school = await resolveSchoolSchemaInfo();
    const [result] = await pool
      .promise()
      .query(`DELETE FROM schools WHERE \`${school.id}\` = ?`, [id]);
    return result;
  },
};

module.exports = School;
