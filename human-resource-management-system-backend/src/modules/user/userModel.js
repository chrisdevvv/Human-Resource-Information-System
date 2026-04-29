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

const toDbRole = (role) => {
  const normalized = String(role || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_")
    .replace(/-/g, "_");

  if (normalized === "SUPER_ADMIN") return "super_admin";
  if (normalized === "ADMIN") return "admin";
  if (normalized === "DATA_ENCODER") return "data_encoder";
  return role;
};

const User = {
  // Supports optional filters and pagination. If `pagination` is omitted, returns full rows array for backwards compatibility.
  getAll: async (
    { search, role, is_active, school_id, letter, sortOrder } = {},
    pagination,
  ) => {
    const school = await resolveSchoolSchemaInfo();
    let baseQuery = `
            FROM users u
          LEFT JOIN schools s ON u.school_id = s.${school.id}
            WHERE 1=1
        `;
    const params = [];
    const normalizedLetter =
      typeof letter === "string" ? letter.trim().toUpperCase() : "";
    const orderDirection =
      String(sortOrder || "asc").toLowerCase() === "desc" ? "DESC" : "ASC";

    if (search) {
      baseQuery += ` AND (u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ? OR s.${school.name} LIKE ?)`;
      const like = `%${search}%`;
      params.push(like, like, like, like);
    }

    if (role) {
      baseQuery += ` AND u.role = ?`;
      params.push(toDbRole(role));
    }

    if (is_active !== undefined && is_active !== null) {
      baseQuery += ` AND u.is_active = ?`;
      params.push(is_active);
    }

    if (school_id !== undefined && school_id !== null) {
      baseQuery += ` AND u.school_id = ?`;
      params.push(Number(school_id));
    }

    if (normalizedLetter) {
      baseQuery += ` AND UPPER(LEFT(COALESCE(u.first_name, ''), 1)) = ?`;
      params.push(normalizedLetter);
    }

    const orderClause = ` ORDER BY u.first_name ${orderDirection}, u.last_name ${orderDirection}, u.id ASC`;

    // If pagination not requested, return full rows (preserve existing behavior)
    if (!pagination || !pagination.page) {
      const [rows] = await pool.promise().query(
        `SELECT u.id, u.first_name, u.middle_name, u.last_name, u.email, UPPER(u.role) AS role,
                       DATE_FORMAT(u.birthdate, '%Y-%m-%d') AS birthdate,
                       u.school_id,
                       u.is_active, u.created_at, u.updated_at,
                       s.${school.name} AS school_name,
                       ${school.code ? `s.${school.code} AS school_code` : "NULL AS school_code"}
                 ${baseQuery} ${orderClause}`,
        params,
      );
      return rows;
    }

    const page = Number(pagination.page) || 1;
    const pageSize = Math.min(Number(pagination.pageSize) || 25, 200);
    const offset = (page - 1) * pageSize;

    // Get total count for pagination
    const [[{ total }]] = await pool
      .promise()
      .query(`SELECT COUNT(1) as total ${baseQuery}`, params);

    const [rows] = await pool.promise().query(
      `SELECT u.id, u.first_name, u.middle_name, u.last_name, u.email, UPPER(u.role) AS role,
                       DATE_FORMAT(u.birthdate, '%Y-%m-%d') AS birthdate,
                       u.school_id,
                       u.is_active, u.created_at, u.updated_at,
                       s.${school.name} AS school_name,
                       ${school.code ? `s.${school.code} AS school_code` : "NULL AS school_code"}
             ${baseQuery} ${orderClause} LIMIT ? OFFSET ?`,
      [...params, pageSize, offset],
    );

    return { data: rows, total: Number(total), page, pageSize };
  },

  getById: async (id) => {
    const school = await resolveSchoolSchemaInfo();
    const [rows] = await pool.promise().query(
      `SELECT u.id, u.first_name, u.middle_name, u.last_name, u.email, UPPER(u.role) AS role,
                    DATE_FORMAT(u.birthdate, '%Y-%m-%d') AS birthdate,
                    u.is_active, u.created_at, u.updated_at,
                    u.school_id,
                    s.${school.name} AS school_name,
                    ${school.code ? `s.${school.code} AS school_code` : "NULL AS school_code"}
             FROM users u
             LEFT JOIN schools s ON u.school_id = s.${school.id}
             WHERE u.id = ?`,
      [id],
    );
    return rows[0];
  },

  updateRole: async (id, role) => {
    const [result] = await pool
      .promise()
      .query(`UPDATE users SET role = ? WHERE id = ?`, [toDbRole(role), id]);
    return result;
  },

  updateStatus: async (id, is_active) => {
    // Always write strict 1 or 0 to the tinyint column
    const value = is_active === true || is_active === 1 ? 1 : 0;
    const [result] = await pool
      .promise()
      .query(`UPDATE users SET is_active = ? WHERE id = ?`, [value, id]);
    return result;
  },

  getByEmail: async (email) => {
    const [rows] = await pool
      .promise()
      .query(`SELECT id, email FROM users WHERE email = ? LIMIT 1`, [email]);
    return rows[0];
  },

  updateDetails: async (id, details = {}) => {
    const assignments = [];
    const params = [];

    if (Object.prototype.hasOwnProperty.call(details, "first_name")) {
      assignments.push("first_name = ?");
      params.push(details.first_name);
    }

    if (Object.prototype.hasOwnProperty.call(details, "middle_name")) {
      assignments.push("middle_name = ?");
      params.push(details.middle_name);
    }

    if (Object.prototype.hasOwnProperty.call(details, "last_name")) {
      assignments.push("last_name = ?");
      params.push(details.last_name);
    }

    if (Object.prototype.hasOwnProperty.call(details, "email")) {
      assignments.push("email = ?");
      params.push(details.email);
    }

    if (Object.prototype.hasOwnProperty.call(details, "birthdate")) {
      assignments.push("birthdate = ?");
      params.push(details.birthdate);
    }

    if (Object.prototype.hasOwnProperty.call(details, "school_id")) {
      assignments.push("school_id = ?");
      params.push(details.school_id);
    }

    if (assignments.length === 0) {
      return { affectedRows: 0, changedRows: 0 };
    }

    assignments.push("updated_at = NOW()");

    const [result] = await pool
      .promise()
      .query(`UPDATE users SET ${assignments.join(", ")} WHERE id = ?`, [
        ...params,
        id,
      ]);

    return result;
  },

  deleteUser: async (id) => {
    const [result] = await pool
      .promise()
      .query(`DELETE FROM users WHERE id = ?`, [id]);
    return result;
  },
};

module.exports = User;
