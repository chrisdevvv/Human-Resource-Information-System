const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { randomUUID } = require("crypto");
const pool = require("../../config/db");
const {
  sendRegistrationReceived,
  sendPasswordChanged,
  sendPasswordResetLink,
} = require("../../utils/mailer");
const { JWT_SECRET } = require("../../config/securityEnv");

const configuredFrontendBase = String(
  process.env.FRONTEND_URL || process.env.APP_URL || "",
)
  .trim()
  .replace(/\/+$/, "");
const RESET_TOKEN_TTL = process.env.RESET_PASSWORD_TOKEN_TTL || "2h";
const LOGIN_MAX_ATTEMPTS = Math.max(
  1,
  Number(process.env.LOGIN_MAX_ATTEMPTS || 3),
);
const LOGIN_LOCK_SECONDS = Math.max(
  1,
  Number(process.env.LOGIN_LOCK_SECONDS || 60),
);
const LOGIN_ATTEMPT_WINDOW_SECONDS = Math.max(
  LOGIN_LOCK_SECONDS,
  Number(process.env.LOGIN_ATTEMPT_WINDOW_SECONDS || LOGIN_LOCK_SECONDS),
);

const normalizeEmail = (email) =>
  String(email || "")
    .trim()
    .toLowerCase();
const toApiRole = (role) =>
  String(role || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_")
    .replace(/-/g, "_");
const normalizeBirthdate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
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

const getSourceIp = (req) => {
  const forwarded = req.headers["x-forwarded-for"];
  const rawIp =
    typeof forwarded === "string"
      ? forwarded.split(",")[0].trim()
      : req.ip || req.connection?.remoteAddress || "unknown";
  return String(rawIp).replace(/^::ffff:/, "");
};

const getFrontendBaseUrl = (req) => {
  if (configuredFrontendBase) {
    return configuredFrontendBase;
  }

  const originHeader = String(req.get("origin") || "").trim();
  if (/^https?:\/\//i.test(originHeader)) {
    return originHeader.replace(/\/+$/, "");
  }

  const host = String(req.get("host") || "").trim();
  if (!host) {
    return "";
  }

  const protocol = req.protocol || "http";
  return `${protocol}://${host}`.replace(/\/+$/, "");
};

const getLoginAttemptIdentifier = (email, ip) =>
  `${normalizeEmail(email)}|${ip}`;

const getActiveLoginAttempt = async (identifier) => {
  const [rows] = await pool
    .promise()
    .query(
      "SELECT failed_attempts, last_failed_at, locked_until FROM login_attempts WHERE identifier = ? LIMIT 1",
      [identifier],
    );
  return rows[0] || null;
};

const getRemainingLockSeconds = (lockedUntil) => {
  if (!lockedUntil) return 0;
  const remainingMs = new Date(lockedUntil).getTime() - Date.now();
  return remainingMs > 0 ? Math.ceil(remainingMs / 1000) : 0;
};

const clearLoginAttempts = async (identifier) => {
  await pool
    .promise()
    .query("DELETE FROM login_attempts WHERE identifier = ?", [identifier]);
};

const verifyPasswordResetToken = (token, passwordHash) => {
  try {
    return jwt.verify(token, JWT_SECRET + passwordHash, {
      maxAge: RESET_TOKEN_TTL,
      clockTolerance: 0,
    });
  } catch (error) {
    const isExpired =
      error?.name === "TokenExpiredError" ||
      error?.message?.toLowerCase().includes("maxage exceeded");

    const normalized = new Error(
      isExpired
        ? "Reset link has expired. Please request a new one."
        : "Reset link is invalid. Please request a new one.",
    );
    normalized.statusCode = 400;
    throw normalized;
  }
};

const recordFailedLoginAttempt = async ({ identifier, email, ip, current }) => {
  const now = Date.now();
  const windowMs = LOGIN_ATTEMPT_WINDOW_SECONDS * 1000;
  const previousFailedAt = current?.last_failed_at
    ? new Date(current.last_failed_at).getTime()
    : 0;
  const withinWindow =
    Number.isFinite(previousFailedAt) && now - previousFailedAt <= windowMs;
  const attempts = withinWindow ? Number(current?.failed_attempts || 0) + 1 : 1;
  const lockTriggered = attempts >= LOGIN_MAX_ATTEMPTS;
  const lockedUntil = lockTriggered
    ? new Date(now + LOGIN_LOCK_SECONDS * 1000)
    : null;

  await pool.promise().query(
    `INSERT INTO login_attempts (
       identifier, email, source_ip, failed_attempts, last_failed_at, locked_until
     ) VALUES (?, ?, ?, ?, NOW(), ?)
     ON DUPLICATE KEY UPDATE
       email = VALUES(email),
       source_ip = VALUES(source_ip),
       failed_attempts = VALUES(failed_attempts),
       last_failed_at = VALUES(last_failed_at),
       locked_until = VALUES(locked_until)`,
    [
      identifier,
      normalizeEmail(email),
      ip,
      lockTriggered ? 0 : attempts,
      lockedUntil,
    ],
  );

  return lockTriggered ? LOGIN_LOCK_SECONDS : 0;
};

const invalidateUserSessions = async (userId) => {
  if (!userId) {
    return;
  }

  await pool.promise().query(
    `INSERT INTO user_token_invalidations (user_id, invalid_after)
       VALUES (?, NOW())
       ON DUPLICATE KEY UPDATE invalid_after = NOW()`,
    [userId],
  );
};

const register = async (req, res) => {
  const {
    first_name,
    middle_name,
    last_name,
    email,
    password,
    school_name,
    requested_role,
    birthdate,
    suppress_pending_email,
  } = req.body;

  if (!first_name || !last_name || !email || !password || !school_name) {
    return res.status(400).json({
      message: "First name, last name, email, password and school are required",
    });
  }

  try {
    const school = await resolveSchoolSchemaInfo();
    const normalizedBirthdate = normalizeBirthdate(birthdate);
    if (!normalizedBirthdate) {
      return res.status(400).json({ message: "Valid birthdate is required" });
    }

    // Add school to schools table if it doesn't exist yet
    const [existingSchool] = await pool
      .promise()
      .query(
        `SELECT \`${school.id}\` AS school_id FROM schools WHERE \`${school.name}\` = ? LIMIT 1`,
        [school_name.trim()],
      );
    if (existingSchool.length === 0) {
      return res.status(400).json({
        message:
          "Selected school is not available. Please choose a valid school from the list.",
      });
    }

    // Block if a PENDING request already exists for this email
    const [pendingRows] = await pool
      .promise()
      .query(
        "SELECT id FROM registration_requests WHERE email = ? AND status = 'PENDING' LIMIT 1",
        [email],
      );
    if (pendingRows.length > 0) {
      return res.status(409).json({
        message:
          "A pending registration request already exists for this email.",
      });
    }

    // Block if the email is already an active user account
    const [userRows] = await pool
      .promise()
      .query("SELECT id FROM users WHERE email = ? LIMIT 1", [email]);
    if (userRows.length > 0) {
      return res.status(409).json({
        message: "An account with this email already exists.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [dbCheck] = await pool
      .promise()
      .query("SELECT DATABASE() AS db, @@hostname AS host, @@port AS port");

    console.log("REGISTER DB CHECK:", dbCheck);

    const [result] = await pool
      .promise()
      .query(
        "INSERT INTO registration_requests (first_name, middle_name, last_name, email, password_hash, school_name, requested_role, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [
          first_name,
          middle_name || null,
          last_name,
          email,
          hashedPassword,
          school_name.trim(),
          requested_role || null,
          normalizedBirthdate,
        ],
      );
    // Fire-and-forget — email failure must not block the registration response
    const shouldSuppressPendingEmail =
      suppress_pending_email === true || suppress_pending_email === "true";
    if (!shouldSuppressPendingEmail) {
      sendRegistrationReceived(email, first_name);
    }

    res.status(201).json({
      message:
        "Registration request submitted successfully. Please wait for admin approval.",
      requestId: result.insertId,
    });
  } catch (error) {
    console.error("REGISTER ERROR:", error);
    res.status(500).json({
      message: "Error submitting registration request",
      error: error.message,
    });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    const normalizedEmail = normalizeEmail(email);
    const sourceIp = getSourceIp(req);
    const loginAttemptId = getLoginAttemptIdentifier(normalizedEmail, sourceIp);
    const attempt = await getActiveLoginAttempt(loginAttemptId);
    const remainingLock = getRemainingLockSeconds(attempt?.locked_until);

    if (remainingLock > 0) {
      return res.status(429).json({
        message: `Too many failed login attempts. Please try again in ${remainingLock} second${remainingLock !== 1 ? "s" : ""}.`,
        retry_after_seconds: remainingLock,
      });
    }

    const [results] = await pool
      .promise()
      .query("SELECT * FROM users WHERE email = ?", [normalizedEmail]);
    const user = results[0];

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      const lockSeconds = await recordFailedLoginAttempt({
        identifier: loginAttemptId,
        email: normalizedEmail,
        ip: sourceIp,
        current: attempt,
      });
      if (lockSeconds > 0) {
        return res.status(429).json({
          message: `Too many failed login attempts. Please try again in ${lockSeconds} second${lockSeconds !== 1 ? "s" : ""}.`,
          retry_after_seconds: lockSeconds,
        });
      }
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (!user.is_active) {
      return res.status(403).json({ message: "Account is deactivated" });
    }

    await clearLoginAttempts(loginAttemptId);
    const apiRole = toApiRole(user.role);

    const jti = randomUUID();
    const token = jwt.sign(
      {
        id: user.id,
        jti,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        role: apiRole,
        school_id: user.school_id,
      },
      JWT_SECRET,
      { expiresIn: "1d" },
    );
    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        role: apiRole,
        school_id: user.school_id,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Error logging in", error: error.message });
  }
};

const logout = async (req, res) => {
  try {
    const decoded = req.user;
    if (!decoded || !decoded.jti) {
      return res.status(200).json({ message: "Logged out" });
    }

    const expiry = decoded.exp
      ? new Date(decoded.exp * 1000)
      : new Date(Date.now() + 24 * 60 * 60 * 1000);

    await pool.promise().query(
      `INSERT INTO revoked_tokens (jti, user_id, expires_at)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE expires_at = VALUES(expires_at)`,
      [decoded.jti, decoded.id || null, expiry],
    );

    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error logging out", error: error.message });
  }
};

const verifyPassword = async (req, res) => {
  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ message: "Password is required" });
  }

  try {
    const [results] = await pool
      .promise()
      .query("SELECT password_hash FROM users WHERE id = ? AND is_active = 1", [
        req.user.id,
      ]);
    const user = results[0];
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: "Incorrect password" });
    }

    res.status(200).json({ message: "Password verified" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error verifying password", error: error.message });
  }
};

const changePassword = async (req, res) => {
  const { current_password, new_password } = req.body;

  if (!current_password || !new_password) {
    return res
      .status(400)
      .json({ message: "current_password and new_password are required" });
  }

  if (new_password.length < 8) {
    return res
      .status(400)
      .json({ message: "New password must be at least 8 characters" });
  }

  try {
    const [results] = await pool
      .promise()
      .query(
        "SELECT id, first_name, email, password_hash FROM users WHERE id = ? AND is_active = 1",
        [req.user.id],
      );
    const user = results[0];
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(current_password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    if (await bcrypt.compare(new_password, user.password_hash)) {
      return res.status(400).json({
        message: "New password must be different from current password",
      });
    }

    const hashedPassword = await bcrypt.hash(new_password, 10);
    await pool
      .promise()
      .query("UPDATE users SET password_hash = ? WHERE id = ?", [
        hashedPassword,
        user.id,
      ]);

    await invalidateUserSessions(user.id);

    // Fire-and-forget
    sendPasswordChanged(user.email, user.first_name);

    res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error changing password", error: error.message });
  }
};

// ---------------------------------------------------------------------------
// POST /api/auth/forgot-password
// Public — accepts { email }, sends a reset link only for an existing active account.
// Returns a clear error when no matching user is found.
// ---------------------------------------------------------------------------
const forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  try {
    const normalizedEmail = normalizeEmail(email);
    const [results] = await pool
      .promise()
      .query(
        "SELECT id, first_name, email, password_hash FROM users WHERE email = ? AND is_active = 1",
        [normalizedEmail],
      );
    const user = results[0];

    if (!user) {
      return res.status(404).json({ message: "No user found with that email" });
    }

    // Sign reset token with JWT_SECRET + current password_hash so the token
    // is automatically invalidated the moment the password changes.
    const resetToken = jwt.sign(
      { id: user.id, purpose: "password-reset" },
      JWT_SECRET + user.password_hash,
      { expiresIn: RESET_TOKEN_TTL },
    );

    const frontendBaseUrl = getFrontendBaseUrl(req);
    if (!frontendBaseUrl) {
      return res.status(500).json({
        message:
          "Unable to generate reset link because frontend URL is not configured",
      });
    }

    const resetLink = `${frontendBaseUrl}/reset-password?token=${resetToken}`;

    // Fire-and-forget
    sendPasswordResetLink(user.email, user.first_name, resetLink);

    res.status(200).json({
      message:
        "Reset link has been sent to your email. Please check your inbox.",
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error processing request", error: error.message });
  }
};

// ---------------------------------------------------------------------------
// POST /api/auth/verify-old-password
// Protected (requires valid auth token stored in localStorage).
// Verifies that the supplied password matches the user's current password.
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// POST /api/auth/verify-old-password
// Public — accepts { token, password }.
// Uses the reset token (from the forgot-password email link) to identify the
// user without needing an active login session.
// ---------------------------------------------------------------------------
const verifyOldPassword = async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) {
    return res.status(400).json({ message: "token and password are required" });
  }

  try {
    // Decode without verifying first to extract the user id
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.id || decoded.purpose !== "password-reset") {
      return res
        .status(400)
        .json({ message: "Invalid or malformed reset token" });
    }

    const [results] = await pool
      .promise()
      .query(
        "SELECT id, password_hash FROM users WHERE id = ? AND is_active = 1",
        [decoded.id],
      );
    const user = results[0];
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Fully verify reset token with strict max age enforcement.
    try {
      verifyPasswordResetToken(token, user.password_hash);
    } catch (verifyError) {
      return res
        .status(verifyError.statusCode || 400)
        .json({ message: verifyError.message });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: "Incorrect password" });
    }

    res.status(200).json({ message: "Password verified" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error verifying password", error: error.message });
  }
};

// ---------------------------------------------------------------------------
// POST /api/auth/reset-password
// Public — accepts { token, newPassword }.
// Verifies the reset token, updates the password, and sends confirmation.
// ---------------------------------------------------------------------------
const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res
      .status(400)
      .json({ message: "token and newPassword are required" });
  }

  if (newPassword.length < 8) {
    return res
      .status(400)
      .json({ message: "Password must be at least 8 characters" });
  }

  try {
    // Decode without verifying first to extract the user id
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.id || decoded.purpose !== "password-reset") {
      return res
        .status(400)
        .json({ message: "Invalid or malformed reset token" });
    }

    // Fetch the user — we need password_hash to complete verification
    const [results] = await pool
      .promise()
      .query(
        "SELECT id, first_name, email, password_hash FROM users WHERE id = ? AND is_active = 1",
        [decoded.id],
      );
    const user = results[0];
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify token fully with strict max age enforcement.
    try {
      verifyPasswordResetToken(token, user.password_hash);
    } catch (verifyError) {
      return res
        .status(verifyError.statusCode || 400)
        .json({ message: verifyError.message });
    }

    // Prevent reusing the same password
    if (await bcrypt.compare(newPassword, user.password_hash)) {
      return res.status(400).json({
        message: "New password must be different from your current password",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool
      .promise()
      .query("UPDATE users SET password_hash = ? WHERE id = ?", [
        hashedPassword,
        user.id,
      ]);

    await invalidateUserSessions(user.id);

    // Fire-and-forget
    sendPasswordChanged(user.email, user.first_name);

    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error resetting password", error: error.message });
  }
};

module.exports = {
  register,
  login,
  verifyPassword,
  changePassword,
  logout,
  forgotPassword,
  verifyOldPassword,
  resetPassword,
};
