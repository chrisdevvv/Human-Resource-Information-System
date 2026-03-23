const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { randomUUID } = require("crypto");
const pool = require("../../config/db");
const {
  sendRegistrationReceived,
  sendPasswordChanged,
  sendPasswordResetLink,
} = require("../../utils/mailer");

const FRONTEND_URL =
  process.env.FRONTEND_URL || process.env.APP_URL || "http://localhost:3001";

const register = async (req, res) => {
  const {
    first_name,
    last_name,
    email,
    password,
    school_name,
    requested_role,
    suppress_pending_email,
  } = req.body;

  if (!first_name || !last_name || !email || !password || !school_name) {
    return res.status(400).json({
      message: "First name, last name, email, password and school are required",
    });
  }

  try {
    // Add school to schools table if it doesn't exist yet
    const [existingSchool] = await pool
      .promise()
      .query("SELECT id FROM schools WHERE school_name = ? LIMIT 1", [
        school_name.trim(),
      ]);
    if (existingSchool.length === 0) {
      const school_code = school_name
        .trim()
        .split(/\s+/)
        .map((word) => word[0].toUpperCase())
        .join("");
      await pool
        .promise()
        .query("INSERT INTO schools (school_name, school_code) VALUES (?, ?)", [
          school_name.trim(),
          school_code,
        ]);
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
        message: "A pending registration request already exists for this email.",
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
    const [result] = await pool
      .promise()
      .query(
        "INSERT INTO registration_requests (first_name, last_name, email, password_hash, school_name, requested_role) VALUES (?, ?, ?, ?, ?, ?)",
        [
          first_name,
          last_name,
          email,
          hashedPassword,
          school_name.trim(),
          requested_role || null,
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
    const [results] = await pool
      .promise()
      .query("SELECT * FROM users WHERE email = ?", [email]);
    const user = results[0];

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (!user.is_active) {
      return res.status(403).json({ message: "Account is deactivated" });
    }

    const jti = randomUUID();
    const token = jwt.sign(
      {
        id: user.id,
        jti,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        role: user.role,
        school_id: user.school_id,
      },
      process.env.JWT_SECRET,
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
        role: user.role,
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

    await pool
      .promise()
      .query(
        `INSERT INTO revoked_tokens (jti, user_id, expires_at)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE expires_at = VALUES(expires_at)`,
        [decoded.jti, decoded.id || null, expiry],
      );

    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error logging out", error: error.message });
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
      return res
        .status(400)
        .json({
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
// Public — accepts { email }, sends a reset link if the account exists.
// Always returns success to avoid leaking whether an email is registered.
// ---------------------------------------------------------------------------
const forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  try {
    const [results] = await pool
      .promise()
      .query(
        "SELECT id, first_name, email, password_hash FROM users WHERE email = ? AND is_active = 1",
        [email],
      );
    const user = results[0];

    // Always respond with success — never reveal if the email exists or not
    if (user) {
      // Sign reset token with JWT_SECRET + current password_hash so the token
      // is automatically invalidated the moment the password changes.
      const resetToken = jwt.sign(
        { id: user.id, purpose: "password-reset" },
        process.env.JWT_SECRET + user.password_hash,
        { expiresIn: "2h" },
      );

      const resetLink = `${FRONTEND_URL}/reset-password?token=${resetToken}`;

      // Fire-and-forget
      sendPasswordResetLink(user.email, user.first_name, resetLink);
    }

    res.status(200).json({
      message:
        "If an account with that email exists, a reset link has been sent.",
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

    // Fully verify the reset token is still valid and not expired
    try {
      jwt.verify(token, process.env.JWT_SECRET + user.password_hash);
    } catch {
      return res
        .status(400)
        .json({
          message:
            "Reset link is invalid or has expired. Please request a new one.",
        });
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

    // Verify the token fully — secret includes password_hash so it's one-time-use
    try {
      jwt.verify(token, process.env.JWT_SECRET + user.password_hash);
    } catch {
      return res
        .status(400)
        .json({
          message:
            "Reset link is invalid or has expired. Please request a new one.",
        });
    }

    // Prevent reusing the same password
    if (await bcrypt.compare(newPassword, user.password_hash)) {
      return res
        .status(400)
        .json({
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
