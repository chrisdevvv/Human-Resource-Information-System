const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../../config/db");

const register = async (req, res) => {
  const {
    username,
    firstName,
    lastName,
    email,
    password,
    school_id,
    school,
    requested_role,
  } = req.body;

  const normalizedEmail =
    typeof email === "string" ? email.trim().toLowerCase() : "";
  const fallbackUsername = normalizedEmail ? normalizedEmail.split("@")[0] : "";
  const rawNameBasedUsername = `${(firstName || "").trim()}.${(lastName || "").trim()}`;
  const nameBasedUsername = rawNameBasedUsername
    .replace(/\s+/g, ".")
    .replace(/^\.+|\.+$/g, "");
  const normalizedUsername = String(
    username || nameBasedUsername || fallbackUsername,
  )
    .trim()
    .toLowerCase();

  if (
    !normalizedUsername ||
    !normalizedEmail ||
    !password ||
    (!school_id && !school)
  ) {
    return res
      .status(400)
      .json({ message: "Username, email, password and school are required" });
  }

  try {
    let resolvedSchoolId = Number(school_id);
    const normalizedSchoolName =
      typeof school === "string" ? school.trim() : "";

    if (!Number.isInteger(resolvedSchoolId) || resolvedSchoolId <= 0) {
      resolvedSchoolId = null;
    }

    if (!resolvedSchoolId && !normalizedSchoolName) {
      return res.status(400).json({ message: "School is required" });
    }

    if (!resolvedSchoolId) {
      const [existingSchool] = await pool
        .promise()
        .query("SELECT id FROM schools WHERE school_name = ? LIMIT 1", [
          normalizedSchoolName,
        ]);

      if (existingSchool[0]) {
        resolvedSchoolId = existingSchool[0].id;
      } else {
        const [newSchool] = await pool
          .promise()
          .query(
            "INSERT INTO schools (school_name, school_code) VALUES (?, ?)",
            [normalizedSchoolName, null],
          );
        resolvedSchoolId = newSchool.insertId;
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await pool
      .promise()
      .query(
        "INSERT INTO registration_requests (username, email, password_hash, school_id, requested_role) VALUES (?, ?, ?, ?, ?)",
        [
          normalizedUsername,
          normalizedEmail,
          hashedPassword,
          resolvedSchoolId,
          requested_role || null,
        ],
      );
    res.status(201).json({
      message:
        "Registration request submitted successfully. Please wait for admin approval.",
      requestId: result.insertId,
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res
        .status(409)
        .json({ message: "Username or email is already taken" });
    }
    res
      .status(500)
      .json({
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
      .query("SELECT * FROM users WHERE email = ? AND is_active = 1", [email]);
    const user = results[0];

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
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
        username: user.username,
        email: user.email,
        role: user.role,
        school_id: user.school_id,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Error logging in", error: error.message });
  }
};

module.exports = { register, login };
