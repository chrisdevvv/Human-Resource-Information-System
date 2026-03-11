const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../../config/db");
const { sendRegistrationReceived } = require("../../utils/mailer");

const register = async (req, res) => {
  const {
    first_name,
    last_name,
    email,
    password,
    school_name,
    requested_role,
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
    sendRegistrationReceived(email, first_name);

    res.status(201).json({
      message:
        "Registration request submitted successfully. Please wait for admin approval.",
      requestId: result.insertId,
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "Email is already registered" });
    }
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

    const token = jwt.sign(
      {
        id: user.id,
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

module.exports = { register, login, verifyPassword };