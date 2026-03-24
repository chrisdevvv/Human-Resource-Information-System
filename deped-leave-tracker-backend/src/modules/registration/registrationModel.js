const pool = require("../../config/db");

const Registration = {
  getAll: async (status = null) => {
    let query = `
            SELECT rr.id, rr.first_name, rr.last_name, rr.email, rr.school_name, rr.requested_role,
                   rr.approved_role, rr.status, rr.rejection_reason,
                   rr.reviewed_by, rr.reviewed_at, rr.created_at,
                   u.first_name AS reviewed_by_first_name,
                   u.last_name AS reviewed_by_last_name
            FROM registration_requests rr
            LEFT JOIN users u ON rr.reviewed_by = u.id
        `;
    const params = [];
    if (status) {
      query += " WHERE rr.status = ?";
      params.push(status);
    }
    query += " ORDER BY rr.created_at DESC";
    const [rows] = await pool.promise().query(query, params);
    return rows;
  },

  getById: async (id) => {
    const [rows] = await pool
      .promise()
      .query("SELECT * FROM registration_requests WHERE id = ?", [id]);
    return rows[0];
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

      // Look up school by name; create it if it doesn't exist yet
      let school_id;
      const [schoolRows] = await conn.query(
        "SELECT id FROM schools WHERE school_name = ? LIMIT 1",
        [request.school_name.trim()],
      );
      if (schoolRows.length > 0) {
        school_id = schoolRows[0].id;
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
        "INSERT INTO users (first_name, last_name, email, password_hash, role, school_id, is_active) VALUES (?, ?, ?, ?, ?, ?, 1)",
        [
          request.first_name,
          request.last_name,
          request.email,
          password_hash_to_use,
          role,
          school_id,
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
