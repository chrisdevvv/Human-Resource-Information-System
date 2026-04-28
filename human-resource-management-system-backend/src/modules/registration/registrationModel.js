const pool = require("../../config/db");

const toDbRole = (role) => {
  const normalized = String(role || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_")
    .replace(/-/g, "_");

  if (normalized === "SUPER_ADMIN") return "super_admin";
  if (normalized === "ADMIN") return "admin";
  if (normalized === "DATA_ENCODER") return "data_encoder";
  return "data_encoder";
};

const Registration = {
  getAll: async (filters = {}, options = {}, pagination) => {
    const {
      status = null,
      search = null,
      letter = null,
      sortOrder = "asc",
      dateSortOrder = "newest",
    } = filters;
    const baseQuery = `
                 SELECT rr.id, rr.first_name, rr.middle_name, rr.last_name, rr.email, rr.school_name, rr.requested_role,
                   rr.birthdate,
                   rr.approved_role, rr.status, rr.rejection_reason,
                   rr.reviewed_by, rr.reviewed_at, rr.created_at,
                   u.first_name AS reviewed_by_first_name,
                   u.last_name AS reviewed_by_last_name
            FROM registration_requests rr
            LEFT JOIN users u ON rr.reviewed_by = u.id
        `;

    const params = [];
    const whereParts = [];

    if (status) {
      whereParts.push("rr.status = ?");
      params.push(status);
    }

    if (search) {
      whereParts.push(
        "(rr.first_name LIKE ? OR rr.middle_name LIKE ? OR rr.last_name LIKE ? OR rr.email LIKE ? OR rr.school_name LIKE ?)",
      );
      const keyword = `%${String(search).trim()}%`;
      params.push(keyword, keyword, keyword, keyword, keyword);
    }

    const normalizedLetter =
      typeof letter === "string" ? letter.trim().toUpperCase() : "";
    if (normalizedLetter) {
      whereParts.push("UPPER(LEFT(COALESCE(rr.first_name, ''), 1)) = ?");
      params.push(normalizedLetter);
    }

    if (options.schoolName) {
      whereParts.push("LOWER(TRIM(rr.school_name)) = LOWER(TRIM(?))");
      params.push(options.schoolName);
    }

    const whereClause =
      whereParts.length > 0 ? ` WHERE ${whereParts.join(" AND ")}` : "";
    const createdDirection =
      String(dateSortOrder).toLowerCase() === "oldest" ? "ASC" : "DESC";
    const nameDirection =
      String(sortOrder).toLowerCase() === "desc" ? "DESC" : "ASC";
    const orderClause = ` ORDER BY rr.created_at ${createdDirection}, rr.first_name ${nameDirection}, rr.last_name ${nameDirection}, rr.id ASC`;

    if (!pagination || !pagination.page) {
      const [rows] = await pool
        .promise()
        .query(`${baseQuery}${whereClause}${orderClause}`, params);
      return rows;
    }

    const page = Number(pagination.page) || 1;
    const pageSize = Math.min(Number(pagination.pageSize) || 25, 200);
    const offset = (page - 1) * pageSize;

    const countQuery = `
      SELECT COUNT(1) AS total
      FROM registration_requests rr
      ${whereClause}
    `;

    const [[{ total }]] = await pool.promise().query(countQuery, params);

    const [rows] = await pool
      .promise()
      .query(`${baseQuery}${whereClause}${orderClause} LIMIT ? OFFSET ?`, [
        ...params,
        pageSize,
        offset,
      ]);

    return { data: rows, total: Number(total), page, pageSize };
  },

  getById: async (id, options = {}) => {
    let query = "SELECT * FROM registration_requests WHERE id = ?";
    const params = [id];

    if (options.schoolName) {
      query += " AND LOWER(TRIM(school_name)) = LOWER(TRIM(?))";
      params.push(options.schoolName);
    }

    const [rows] = await pool.promise().query(query, params);
    return rows[0];
  },

  getSchoolNameById: async (school_id) => {
    const [rows] = await pool
      .promise()
      .query("SELECT school_name FROM schools WHERE schoolId = ? LIMIT 1", [
        school_id,
      ]);
    return rows[0]?.school_name || null;
  },

  getReviewerScopeById: async (user_id) => {
    const [rows] = await pool.promise().query(
      `SELECT u.id, u.role, u.school_id, s.school_name
       FROM users u
        LEFT JOIN schools s ON u.school_id = s.schoolId
       WHERE u.id = ?
       LIMIT 1`,
      [user_id],
    );
    return rows[0] || null;
  },

  approve: async (
    id,
    approved_role,
    reviewed_by,
    temporary_password = null,
  ) => {
    const conn = await pool.promise().getConnection();
    try {
      await conn.beginTransaction();

      const [rows] = await conn.query(
        "SELECT * FROM registration_requests WHERE id = ? AND status = ?",
        [id, "PENDING"],
      );
      if (!rows[0])
        throw new Error("Registration request not found or already processed");

      const request = rows[0];
      const role = approved_role || request.requested_role || "DATA_ENCODER";
      const dbRole = toDbRole(role);

      // Look up school by name; create it if it doesn't exist yet
      let school_id;
      const [schoolRows] = await conn.query(
        "SELECT schoolId FROM schools WHERE school_name = ? LIMIT 1",
        [request.school_name.trim()],
      );
      if (schoolRows.length > 0) {
        school_id = schoolRows[0].schoolId;
      } else {
        const school_code = request.school_name
          .trim()
          .split(/\s+/)
          .map((word) => word[0].toUpperCase())
          .join("");
        const [newSchool] = await conn.query(
          "INSERT INTO schools (school_name, school_code) VALUES (?, ?)",
          [request.school_name.trim(), school_code],
        );
        school_id = newSchool.insertId;
      }

      // If admin supplied a temporary password, hash and use it; otherwise keep the original password_hash
      let password_hash_to_use = request.password_hash;
      if (temporary_password) {
        const bcrypt = require("bcryptjs");
        password_hash_to_use = await bcrypt.hash(
          String(temporary_password),
          10,
        );
      }

      await conn.query(
        "INSERT INTO users (first_name, middle_name, last_name, email, password_hash, role, school_id, birthdate, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)",
        [
          request.first_name,
          request.middle_name || null,
          request.last_name,
          request.email,
          password_hash_to_use,
          dbRole,
          school_id,
          request.birthdate || null,
        ],
      );

      await conn.query(
        "UPDATE registration_requests SET status = ?, approved_role = ?, reviewed_by = ?, reviewed_at = NOW() WHERE id = ?",
        ["APPROVED", role, reviewed_by, id],
      );

      await conn.commit();
      return { success: true };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  reject: async (id, rejection_reason, reviewed_by) => {
    const [result] = await pool
      .promise()
      .query(
        "UPDATE registration_requests SET status = ?, rejection_reason = ?, reviewed_by = ?, reviewed_at = NOW() WHERE id = ?",
        ["REJECTED", rejection_reason || null, reviewed_by, id],
      );
    return result;
  },
};

module.exports = Registration;
