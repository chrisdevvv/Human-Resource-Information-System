const bcrypt = require("bcryptjs");
const pool = require("../../config/db");
const User = require("./userModel");
const Backlog = require("../backlog/backlogModel");
const {
  sendRoleChanged,
  sendPasswordChanged,
  sendAccountStatusChanged,
  sendAccountCreatedCredentials,
  sendUserDetailsUpdated,
} = require("../../utils/mailer");

const VALID_ROLES = ["SUPER_ADMIN", "ADMIN", "DATA_ENCODER"];
const SCHOOLS_DIVISION_OFFICE = "Schools Division Office";
const pad2 = (value) => String(value).padStart(2, "0");

const toDateOnlyString = (date) =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;

const normalizeBirthdate = (value) => {
  if (value === null || value === undefined || value === "") return null;

  if (typeof value === "string") {
    const trimmed = value.trim();
    const dateOnlyMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (dateOnlyMatch) {
      const year = Number(dateOnlyMatch[1]);
      const month = Number(dateOnlyMatch[2]);
      const day = Number(dateOnlyMatch[3]);
      const candidate = new Date(year, month - 1, day);

      if (
        candidate.getFullYear() === year &&
        candidate.getMonth() === month - 1 &&
        candidate.getDate() === day
      ) {
        return `${year}-${pad2(month)}-${pad2(day)}`;
      }
    }
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return toDateOnlyString(date);
};

const normalizeRole = (role) =>
  String(role || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_")
    .replace(/-/g, "_");

const toDbRole = (role) => {
  const normalized = normalizeRole(role);
  if (normalized === "SUPER_ADMIN") return "super_admin";
  if (normalized === "ADMIN") return "admin";
  if (normalized === "DATA_ENCODER") return "data_encoder";
  return role;
};

const normalizeEmail = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const formatDetailValue = (value) => {
  if (value === null || value === undefined) return "N/A";
  const normalized = String(value).trim();
  return normalized || "N/A";
};

const formatBirthdateValue = (value) => {
  if (!value) return "N/A";
  const normalized = String(value).trim();
  if (!normalized) return "N/A";
  return normalized.slice(0, 10);
};

const parseSchoolId = (value) => {
  if (value === null || value === "") return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return Number.NaN;
  return parsed;
};

const parseBooleanFlag = (value) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") {
    if (value === 1) return true;
    if (value === 0) return false;
  }

  const normalized = String(value || "")
    .trim()
    .toLowerCase();
  if (["1", "true"].includes(normalized)) return true;
  if (["0", "false", ""].includes(normalized)) return false;
  return null;
};

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

const resolveOrCreateSchoolsDivisionOfficeId = async () => {
  const school = await resolveSchoolSchemaInfo();
  const schoolCode = "SDO";
  const [insertResult] = await pool.promise().query(
    `INSERT INTO schools (${[
      school.name,
      school.code,
    ]
      .filter(Boolean)
      .map((column) => `\`${column}\``)
      .join(", ")})
     VALUES (${school.code ? "?, ?" : "?"})
     ON DUPLICATE KEY UPDATE \`${school.id}\` = LAST_INSERT_ID(\`${school.id}\`)`,
    school.code ? [SCHOOLS_DIVISION_OFFICE, schoolCode] : [SCHOOLS_DIVISION_OFFICE],
  );

  const schoolId = Number(insertResult?.insertId) || null;
  return schoolId;
};

const parseUserDetailPayload = (body, { allowSchool }) => {
  const payload = body || {};
  const normalized = {};
  let wantsSchoolsDivisionOffice = false;

  if (
    Object.prototype.hasOwnProperty.call(payload, "use_schools_division_office")
  ) {
    if (!allowSchool) {
      return { error: "Only SUPER_ADMIN users can update school" };
    }

    const parsedFlag = parseBooleanFlag(payload.use_schools_division_office);
    if (parsedFlag === null) {
      return {
        error: "use_schools_division_office must be a valid boolean",
      };
    }

    wantsSchoolsDivisionOffice = parsedFlag;
    if (parsedFlag) {
      normalized.use_schools_division_office = true;
    }
  }

  if (Object.prototype.hasOwnProperty.call(payload, "first_name")) {
    normalized.first_name = String(payload.first_name || "").trim();
  }

  if (Object.prototype.hasOwnProperty.call(payload, "middle_name")) {
    const middleName = String(payload.middle_name || "").trim();
    normalized.middle_name = middleName || null;
  }

  if (Object.prototype.hasOwnProperty.call(payload, "last_name")) {
    normalized.last_name = String(payload.last_name || "").trim();
  }

  if (Object.prototype.hasOwnProperty.call(payload, "email")) {
    normalized.email = normalizeEmail(payload.email);
  }

  if (Object.prototype.hasOwnProperty.call(payload, "birthdate")) {
    const normalizedBirthdate = normalizeBirthdate(payload.birthdate);
    if (!normalizedBirthdate) {
      return { error: "Valid birthdate is required" };
    }
    normalized.birthdate = normalizedBirthdate;
  }

  if (Object.prototype.hasOwnProperty.call(payload, "school_id")) {
    if (!allowSchool) {
      return { error: "Only SUPER_ADMIN users can update school" };
    }

    const schoolId = parseSchoolId(payload.school_id);
    if (Number.isNaN(schoolId)) {
      return { error: "school_id must be a valid positive number" };
    }

    normalized.school_id = schoolId;
  }

  if (
    wantsSchoolsDivisionOffice &&
    !Object.prototype.hasOwnProperty.call(normalized, "school_id")
  ) {
    normalized.school_id = null;
  }

  if (Object.keys(normalized).length === 0) {
    return { error: "At least one field is required" };
  }

  return { data: normalized };
};

const buildUserDetailChanges = (before, after) => {
  const changes = [];

  const pushChange = (label, previousValue, nextValue) => {
    const previousText = formatDetailValue(previousValue);
    const nextText = formatDetailValue(nextValue);
    if (previousText !== nextText) {
      changes.push({
        label,
        from: previousText,
        to: nextText,
      });
    }
  };

  pushChange("First Name", before.first_name, after.first_name);
  pushChange("Middle Name", before.middle_name, after.middle_name);
  pushChange("Last Name", before.last_name, after.last_name);
  pushChange("Email", before.email, after.email);
  pushChange("Birthdate", before.birthdate, after.birthdate);
  pushChange("School", before.school_name, after.school_name);

  return changes;
};

const getScopedSchoolId = async (user) => {
  if (!user?.id) return null;
  const userRow = await User.getById(user.id);
  return Number(userRow?.school_id) || null;
};

const getAllUsers = async (req, res) => {
  try {
    const {
      search,
      role,
      is_active,
      school_id,
      letter,
      sortOrder,
      page,
      pageSize,
    } = req.query;
    const requesterRole = normalizeRole(req.user?.role);

    const requestedSchoolId = school_id ? Number(school_id) : null;
    const scopeSchoolId =
      requesterRole === "SUPER_ADMIN"
        ? requestedSchoolId
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
      letter: letter || null,
      sortOrder: sortOrder || null,
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

const getMyProfile = async (req, res) => {
  try {
    const user = await User.getById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ data: user });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Error retrieving profile", error: err.message });
  }
};

const updateMyProfile = async (req, res) => {
  try {
    const requester = await User.getById(req.user.id);
    if (!requester) {
      return res.status(404).json({ message: "User not found" });
    }

    const requesterRole = normalizeRole(requester.role || req.user?.role);
    const parsed = parseUserDetailPayload(req.body, {
      allowSchool: requesterRole === "SUPER_ADMIN",
    });

    if (parsed.error) {
      const statusCode = parsed.error.includes("Only SUPER_ADMIN") ? 403 : 400;
      return res.status(statusCode).json({ message: parsed.error });
    }

    const updates = parsed.data;

    if (updates.use_schools_division_office === true) {
      const schoolsDivisionOfficeId =
        await resolveOrCreateSchoolsDivisionOfficeId();
      if (!schoolsDivisionOfficeId) {
        return res.status(500).json({
          message: "Unable to resolve Schools Division Office at this time.",
        });
      }

      updates.school_id = schoolsDivisionOfficeId;
    }
    delete updates.use_schools_division_office;

    if (
      Object.prototype.hasOwnProperty.call(updates, "email") &&
      updates.email !== normalizeEmail(requester.email)
    ) {
      const existing = await User.getByEmail(updates.email);
      if (existing && Number(existing.id) !== Number(requester.id)) {
        return res
          .status(409)
          .json({ message: "An account with this email already exists." });
      }
    }

    if (
      Object.prototype.hasOwnProperty.call(updates, "school_id") &&
      updates.school_id !== null
    ) {
      const [schoolRows] = await pool
        .promise()
        .query("SELECT schoolId FROM schools WHERE schoolId = ? LIMIT 1", [
          updates.school_id,
        ]);
      if (schoolRows.length === 0) {
        return res.status(400).json({ message: "Selected school not found" });
      }
    }

    await User.updateDetails(requester.id, updates);
    const updatedUser = await User.getById(requester.id);
    const changes = buildUserDetailChanges(requester, updatedUser);

    if (changes.length > 0) {
      await Backlog.record({
        user_id: req.user.id,
        school_id: Number(updatedUser.school_id) || null,
        employee_id: null,
        leave_id: null,
        action: "PROFILE_UPDATED",
        details: `Updated fields: ${changes.map((change) => change.label).join(", ")}`,
      });
    }

    return res.status(200).json({
      message: "Profile updated successfully",
      data: updatedUser,
    });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Error updating profile", error: err.message });
  }
};

const updateUserDetails = async (req, res) => {
  try {
    if (normalizeRole(req.user?.role) !== "SUPER_ADMIN") {
      return res.status(403).json({
        message: "Only SUPER_ADMIN users can edit user details",
      });
    }

    const user = await User.getById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const parsed = parseUserDetailPayload(req.body, { allowSchool: true });
    if (parsed.error) {
      return res.status(400).json({ message: parsed.error });
    }

    const updates = parsed.data;

    if (updates.use_schools_division_office === true) {
      const schoolsDivisionOfficeId =
        await resolveOrCreateSchoolsDivisionOfficeId();
      if (!schoolsDivisionOfficeId) {
        return res.status(500).json({
          message: "Unable to resolve Schools Division Office at this time.",
        });
      }

      updates.school_id = schoolsDivisionOfficeId;
    }
    delete updates.use_schools_division_office;

    if (
      Object.prototype.hasOwnProperty.call(updates, "email") &&
      updates.email !== normalizeEmail(user.email)
    ) {
      const existing = await User.getByEmail(updates.email);
      if (existing && Number(existing.id) !== Number(user.id)) {
        return res
          .status(409)
          .json({ message: "An account with this email already exists." });
      }
    }

    if (
      Object.prototype.hasOwnProperty.call(updates, "school_id") &&
      updates.school_id !== null
    ) {
      const [schoolRows] = await pool
        .promise()
        .query("SELECT schoolId FROM schools WHERE schoolId = ? LIMIT 1", [
          updates.school_id,
        ]);
      if (schoolRows.length === 0) {
        return res.status(400).json({ message: "Selected school not found" });
      }
    }

    await User.updateDetails(user.id, updates);
    const updatedUser = await User.getById(user.id);
    const changes = buildUserDetailChanges(user, updatedUser);

    if (changes.length > 0) {
      const updatedByName =
        `${req.user.first_name || ""} ${req.user.last_name || ""}`
          .trim()
          .replace(/\s+/g, " ");

      sendUserDetailsUpdated(
        updatedUser.email,
        updatedUser.first_name || updatedUser.last_name || "User",
        changes,
        updatedByName || "a Super Admin",
      );

      await Backlog.record({
        user_id: req.user.id,
        school_id: Number(updatedUser.school_id) || null,
        employee_id: null,
        leave_id: null,
        action: "USER_DETAILS_UPDATED",
        details: `${updatedUser.first_name} ${updatedUser.last_name}: ${changes
          .map((change) => change.label)
          .join(", ")}`,
      });
    }

    return res.status(200).json({
      message: "User details updated successfully",
      data: updatedUser,
      changed_fields: changes.map((change) => ({
        label: change.label,
        from: change.from,
        to: change.to,
      })),
    });
  } catch (err) {
    return res.status(500).json({
      message: "Error updating user details",
      error: err.message,
    });
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
    if (normalizeRole(req.user?.role) !== "SUPER_ADMIN") {
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
    await User.updateRole(req.params.id, toDbRole(role));

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
    if (normalizeRole(req.user?.role) !== "SUPER_ADMIN") {
      return res
        .status(403)
        .json({ message: "Only SUPER_ADMIN users can change account status" });
    }

    const user = await User.getById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    const previousIsActive =
      user.is_active === true ||
      user.is_active === 1 ||
      user.is_active === "1" ||
      user.is_active === "true";

    // Prevent self-deactivation
    if (String(req.user.id) === String(req.params.id) && !is_active) {
      return res
        .status(403)
        .json({ message: "You cannot deactivate your own account" });
    }

    await User.updateStatus(req.params.id, is_active);

    // Fire-and-forget — email failure must not block the response
    if (previousIsActive !== is_active) {
      sendAccountStatusChanged(user.email, user.first_name, is_active);
    }

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
    if (normalizeRole(req.user?.role) !== "SUPER_ADMIN") {
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

    const { first_name, last_name, email, password, school_name, birthdate } =
      req.body;

    if (!first_name || !last_name || !email || !password) {
      return res.status(400).json({
        message: "first_name, last_name, email, and password are required",
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const normalizedBirthdate = normalizeBirthdate(birthdate);
    if (!normalizedBirthdate) {
      return res.status(400).json({ message: "Valid birthdate is required" });
    }
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
          "SELECT schoolId FROM schools WHERE school_name = ? LIMIT 1",
          [normalizedSchoolName],
        );

        if (schoolRows.length > 0) {
          schoolId = schoolRows[0].schoolId;
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
        "INSERT INTO users (first_name, last_name, email, password_hash, role, school_id, birthdate, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, 1)",
        [
          String(first_name).trim(),
          String(last_name).trim(),
          normalizedEmail,
          hashedPassword,
          "data_encoder",
          schoolId,
          normalizedBirthdate,
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
  getMyProfile,
  updateMyProfile,
  updateUserDetails,
  updateUserRole,
  updateUserStatus,
  deleteUser,
  adminResetPassword,
  createDataEncoderByAdmin,
};