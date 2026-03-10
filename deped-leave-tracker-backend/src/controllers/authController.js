const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/db");

const ALLOWED_REQUESTED_ROLES = new Set(["ADMIN", "DATA_ENCODER"]);

function buildUsername(firstName, lastName, email) {
  const fromName = `${firstName || ""}.${lastName || ""}`
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/\.+/g, ".")
    .replace(/^\.|\.$/g, "");
  const fallback = String(email || "")
    .split("@")[0]
    .toLowerCase()
    .replace(/\s+/g, "");
  const base = fromName || fallback || "user";
  return base.slice(0, 50);
}

const register = async (req, res) => {
  const { firstName, lastName, email, password, school_id, requested_role } =
    req.body;

  if (!email || !password || !school_id || !requested_role) {
    return res.status(400).json({
      message: "Email, password, school_id, and requested_role are required",
    });
  }

  try {
    const role = String(requested_role).toUpperCase();
    if (!ALLOWED_REQUESTED_ROLES.has(role)) {
      return res.status(400).json({ message: "Invalid requested role" });
    }

    const username = buildUsername(firstName, lastName, email);
    const pool = db.promise();

    const [existing] = await pool.query(
      `
        SELECT id FROM registration_requests WHERE email = ? OR username = ?
        UNION
        SELECT id FROM users WHERE email = ? OR username = ?
        LIMIT 1
      `,
      [email, username, email, username],
    );

    if (existing.length > 0) {
      return res.status(409).json({
        message: "An account or pending request with this email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      "INSERT INTO registration_requests (username, email, password_hash, school_id, requested_role, status) VALUES (?, ?, ?, ?, ?, 'PENDING')",
      [username, email, hashedPassword, Number(school_id), role],
    );

    return res.status(201).json({
      message: "Registration request submitted successfully",
      requestId: result.insertId,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error submitting registration request", error: error.message });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    const pool = db.promise();
    const [results] = await pool.query(
      "SELECT id, username, email, password_hash, role, school_id, is_active FROM users WHERE email = ? LIMIT 1",
      [email],
    );

    const user = results[0];
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (!user.is_active) {
      return res.status(403).json({ message: "Account is inactive" });
    }

    const isValidPassword = await bcrypt.compare(
      password,
      user.password_hash || "",
    );
    if (!isValidPassword) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || "deped_leave_tracker_local_secret",
      { expiresIn: "1d" },
    );

    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        school_id: user.school_id,
      },
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error logging in", error: error.message });
  }
};

module.exports = { register, login };
