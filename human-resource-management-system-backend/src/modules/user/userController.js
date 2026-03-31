const bcrypt = require("bcryptjs");
const pool = require("../../config/db");
const User = require("./userModel");
const Backlog = require("../backlog/backlogModel");
const {
  sendRoleChanged,
  sendPasswordChanged,
  sendAccountCreatedCredentials,
} = require("../../utils/mailer");

const VALID_ROLES = ["SUPER_ADMIN", "ADMIN", "DATA_ENCODER"];
const normalizeRole = (role) =>
  String(role || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_")
    .replace(/-/g, "_");

const getScopedSchoolId = async (user) => {
  const tokenSchoolId = Number(user?.school_id) || null;
  if (tokenSchoolId) return tokenSchoolId;

  if (!user?.id) return null;
  const userRow = await User.getById(user.id);
  return Number(userRow?.school_id) || null;
};

const getAllUsers = async (req, res) => {
  try {
    const { search, role, is_active, page, pageSize } = req.query;
    const requesterRole = normalizeRole(req.user?.role);

    const scopeSchoolId =
      requesterRole === "SUPER_ADMIN"
        ? null
        : await getScopedSchoolId(req.user);

    if (requesterRole !== "SUPER_ADMIN" && !scopeSchoolId) {
      return res
        .status(403)
        .json({ message: "Your account has no assigned school" });
    }

    const filters = {
      search: search || null,
      role: role || null,
      is_active: is_active !== undefined ? Number(is_active) : null,
      school_id: scopeSchoolId,
    };

    const pagination = page
      ? { page: Number(page), pageSize: Number(pageSize || 25) }
      : undefined;

    const results = await User.getAll(filters, pagination);

    // Preserve existing response shape when no pagination requested
    if (!pagination) {
      return res.status(200).json({ data: results });
    }

    res.status(200).json({
      data: results.data,
      total: results.total,
      page: results.page,
      pageSize: results.pageSize,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error retrieving users", error: err.message });
  }
};

const getUserById = async (req, res) => {
  try {
    const requesterRole = normalizeRole(req.user?.role);
    const scopeSchoolId =
      requesterRole === "SUPER_ADMIN"
        ? null
        : await getScopedSchoolId(req.user);

    if (requesterRole !== "SUPER_ADMIN" && !scopeSchoolId) {
      return res
        .status(403)
        .json({ message: "Your account has no assigned school" });
    }

    const user = await User.getById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (requesterRole !== "SUPER_ADMIN") {
      if (Number(user.school_id) !== Number(scopeSchoolId)) {
        return res.status(403).json({
          message: "You can only view users from your assigned school",
        });
      }
    }

    res.status(200).json({ data: user });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error retrieving user", error: err.message });
  }
};

const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!role || !VALID_ROLES.includes(role)) {
      return res
        .status(400)
        .json({ message: `Role must be one of: ${VALID_ROLES.join(", ")}` });
    }

    // Only SUPER_ADMIN can update user roles
    if (req.user.role !== "SUPER_ADMIN") {
      return res
        .status(403)
        .json({ message: "Only SUPER_ADMIN users can assign roles" });
    }

    const user = await User.getById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Prevent super admin from demoting themselves
    if (
      String(req.user.id) === String(req.params.id) &&
      role !== "SUPER_ADMIN"
    ) {
      return res
        .status(403)
        .json({ message: "You cannot change your own role" });
    }

    const previousRole = user.role;
    await User.updateRole(req.params.id, role);

    // Fire-and-forget — email failure must not block the response
    if (previousRole !== role) {
      sendRoleChanged(user.email, user.first_name, previousRole, role);
    }

    await Backlog.record({
      user_id: req.user.id,
      school_id: null,
      employee_id: null,
      leave_id: null,
      action: "USER_ROLE_UPDATED",
      details: `${user.first_name} ${user.last_name}: ${previousRole} → ${role}`,
    });

    res.status(200).json({ message: "User role updated successfully" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error updating user role", error: err.message });
  }
};

const updateUserStatus = async (req, res) => {
  try {
    const rawValue = req.body.is_active;
    if (rawValue === undefined || rawValue === null) {
      return res
        .status(400)
        .json({ message: "is_active (true/false) is required" });
    }

    // Normalize to strict boolean regardless of whether frontend sends boolean or 0/1
    const is_active =
      rawValue === true ||
      rawValue === 1 ||
      rawValue === "1" ||
      rawValue === "true";

    // Only SUPER_ADMIN can change account status
    if (req.user.role !== "SUPER_ADMIN") {
      return res
        .status(403)
        .json({ message: "Only SUPER_ADMIN users can change account status" });
    }

    const user = await User.getById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Prevent self-deactivation
    if (String(req.user.id) === String(req.params.id) && !is_active) {
      return res
        .status(403)
        .json({ message: "You cannot deactivate your own account" });
    }

    await User.updateStatus(req.params.id, is_active);
    await Backlog.record({
      user_id: req.user.id,
      school_id: null,
      employee_id: null,
      leave_id: null,
      action: "USER_STATUS_UPDATED",
      details: `${user.first_name} ${user.last_name}: ${is_active ? "Activated" : "Deactivated"}`,
    });
    res.status(200).json({
      message: `User ${is_active ? "activated" : "deactivated"} successfully`,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error updating user status", error: err.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    // Prevent self-deletion
    if (String(req.user.id) === String(req.params.id)) {
      return res
        .status(403)
        .json({ message: "You cannot delete your own account" });
    }

    const user = await User.getById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    await User.deleteUser(req.params.id);
    await Backlog.record({
      user_id: req.user.id,
      school_id: null,
      employee_id: null,
      leave_id: null,
      action: "USER_DELETED",
      details: `${user.first_name} ${user.last_name} (${user.email})`,
    });
    res.status(200).json({ message: "User deleted successfully" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error deleting user", error: err.message });
  }
};

const adminResetPassword = async (req, res) => {
  try {
    // Only SUPER_ADMIN can force-reset another user's password
    if (req.user.role !== "SUPER_ADMIN") {
      return res
        .status(403)
        .json({ message: "Only SUPER_ADMIN users can reset passwords" });
    }

    // Prevent resetting own password through this endpoint (use change-password instead)
    if (String(req.user.id) === String(req.params.id)) {
      return res.status(403).json({
        message: "Use the change-password endpoint to update your own password",
      });
    }

    const { new_password, admin_password } = req.body;

    if (!new_password || !admin_password) {
      return res
        .status(400)
        .json({ message: "new_password and admin_password are required" });
    }

    if (new_password.length < 8) {
      return res
        .status(400)
        .json({ message: "New password must be at least 8 characters" });
    }

    // Verify the super admin's own password before allowing the reset
    const [adminRows] = await pool
      .promise()
      .query("SELECT password_hash FROM users WHERE id = ? AND is_active = 1", [
        req.user.id,
      ]);
    if (!adminRows[0]) {
      return res.status(404).json({ message: "Admin account not found" });
    }
    const adminMatch = await bcrypt.compare(
      admin_password,
      adminRows[0].password_hash,
    );
    if (!adminMatch) {
      return res.status(401).json({ message: "Admin password is incorrect" });
    }

    // Fetch the target user
    const user = await User.getById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const hashedPassword = await bcrypt.hash(new_password, 10);
    await pool
      .promise()
      .query("UPDATE users SET password_hash = ? WHERE id = ?", [
        hashedPassword,
        user.id,
      ]);

    await pool.promise().query(
      `INSERT INTO user_token_invalidations (user_id, invalid_after)
         VALUES (?, NOW())
         ON DUPLICATE KEY UPDATE invalid_after = NOW()`,
      [user.id],
    );

    // Fire-and-forget
    sendPasswordChanged(user.email, user.first_name);
    await Backlog.record({
      user_id: req.user.id,
      school_id: null,
      employee_id: null,
      leave_id: null,
      action: "USER_PASSWORD_RESET",
      details: `Password reset for ${user.first_name} ${user.last_name}`,
    });

    res.status(200).json({ message: "Password reset successfully" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error resetting password", error: err.message });
  }
};

const createDataEncoderByAdmin = async (req, res) => {
  try {
    const requesterRole = normalizeRole(req.user?.role);

    if (!["ADMIN", "SUPER_ADMIN"].includes(requesterRole)) {
      return res.status(403).json({
        message:
          "Only ADMIN or SUPER_ADMIN users can add users via this endpoint",
      });
    }

    const { first_name, last_name, email, password, school_name } = req.body;

    if (!first_name || !last_name || !email || !password) {
      return res.status(400).json({
        message: "first_name, last_name, email, and password are required",
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const normalizedSchoolName = String(school_name || "").trim();

    const [existingUserRows] = await pool
      .promise()
      .query("SELECT id FROM users WHERE email = ? LIMIT 1", [normalizedEmail]);
    if (existingUserRows.length > 0) {
      return res
        .status(409)
        .json({ message: "An account with this email already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const conn = await pool.promise().getConnection();
    try {
      await conn.beginTransaction();

      let schoolId;
      if (requesterRole === "ADMIN") {
        const scopedSchoolId = await getScopedSchoolId(req.user);
        if (!scopedSchoolId) {
          return res
            .status(403)
            .json({ message: "Your account has no assigned school" });
        }
        schoolId = scopedSchoolId;
      } else {
        if (!normalizedSchoolName) {
          return res.status(400).json({ message: "school_name is required" });
        }

        const [schoolRows] = await conn.query(
          "SELECT id FROM schools WHERE school_name = ? LIMIT 1",
          [normalizedSchoolName],
        );

        if (schoolRows.length > 0) {
          schoolId = schoolRows[0].id;
        } else {
          const schoolCode = normalizedSchoolName
            .split(/\s+/)
            .filter(Boolean)
            .map((word) => word[0].toUpperCase())
            .join("");

          const [newSchoolResult] = await conn.query(
            "INSERT INTO schools (school_name, school_code) VALUES (?, ?)",
            [normalizedSchoolName, schoolCode || "SCH"],
          );
          schoolId = newSchoolResult.insertId;
        }
      }

      const [insertResult] = await conn.query(
        "INSERT INTO users (first_name, last_name, email, password_hash, role, school_id, is_active) VALUES (?, ?, ?, ?, ?, ?, 1)",
        [
          String(first_name).trim(),
          String(last_name).trim(),
          normalizedEmail,
          hashedPassword,
          "DATA_ENCODER",
          schoolId,
        ],
      );

      await conn.commit();

      await Backlog.record({
        user_id: req.user.id,
        school_id: schoolId,
        employee_id: null,
        leave_id: null,
        action: "USER_CREATED",
        details: `${String(first_name).trim()} ${String(last_name).trim()} as DATA_ENCODER`,
      });

      // Fire-and-forget credentials email.
      sendAccountCreatedCredentials(
        normalizedEmail,
        String(first_name).trim(),
        "DATA_ENCODER",
        normalizedEmail,
        password,
      );

      return res.status(201).json({
        message: "User created successfully",
        data: {
          id: insertResult.insertId,
          role: "DATA_ENCODER",
        },
      });
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Error creating user", error: err.message });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUserRole,
  updateUserStatus,
  deleteUser,
  adminResetPassword,
  createDataEncoderByAdmin,
};
