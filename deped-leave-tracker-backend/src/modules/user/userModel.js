const pool = require("../../config/db");

const User = {
  // Supports optional filters and pagination. If `pagination` is omitted, returns full rows array for backwards compatibility.
  getAll: async ({ search, role, is_active, school_id } = {}, pagination) => {
    let baseQuery = `
            FROM users u
            LEFT JOIN schools s ON u.school_id = s.id
            WHERE 1=1
        `;
    const params = [];

    if (search) {
      baseQuery += ` AND (u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ? OR s.school_name LIKE ?)`;
      const like = `%${search}%`;
      params.push(like, like, like, like);
    }

    if (role) {
      baseQuery += ` AND u.role = ?`;
      params.push(role);
    }

    if (is_active !== undefined && is_active !== null) {
      baseQuery += ` AND u.is_active = ?`;
      params.push(is_active);
    }

    const orderClause = ` ORDER BY u.first_name ASC, u.last_name ASC`;

    // If pagination not requested, return full rows (preserve existing behavior)
    if (!pagination || !pagination.page) {
      const [rows] = await pool.promise().query(
        `SELECT u.id, u.first_name, u.last_name, u.email, u.role,
                       u.school_id,
                       u.is_active, u.created_at, u.updated_at,
                       s.school_name, s.school_code
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
      `SELECT u.id, u.first_name, u.last_name, u.email, u.role,
                       u.school_id,
                       u.is_active, u.created_at, u.updated_at,
                       s.school_name, s.school_code
             ${baseQuery} ${orderClause} LIMIT ? OFFSET ?`,
      [...params, pageSize, offset],
    );

    return { data: rows, total: Number(total), page, pageSize };
  },

  getById: async (id) => {
    const [rows] = await pool.promise().query(
      `SELECT u.id, u.first_name, u.last_name, u.email, u.role,
                    u.is_active, u.created_at, u.updated_at,
                    u.school_id, s.school_name, s.school_code
             FROM users u
             LEFT JOIN schools s ON u.school_id = s.id
             WHERE u.id = ?`,
      [id],
    );
    return rows[0];
  },

  updateRole: async (id, role) => {
    const [result] = await pool
      .promise()
      .query(`UPDATE users SET role = ? WHERE id = ?`, [role, id]);
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

  deleteUser: async (id) => {
    const [result] = await pool
      .promise()
      .query(`DELETE FROM users WHERE id = ?`, [id]);
    return result;
  },
};

module.exports = User;
