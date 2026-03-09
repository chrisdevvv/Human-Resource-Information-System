const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../../config/db');

const register = async (req, res) => {
    const { username, email, password, role, school_id } = req.body;

    if (!username || !email || !password || !role) {
        return res.status(400).json({ message: 'Username, email, password and role are required' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await pool.promise().query(
            'INSERT INTO users (username, email, password_hash, role, school_id) VALUES (?, ?, ?, ?, ?)',
            [username, email, hashedPassword, role, school_id || null]
        );
        res.status(201).json({ message: 'User registered successfully', userId: result.insertId });
    } catch (error) {
        res.status(500).json({ message: 'Error registering user', error: error.message });
    }
};

const login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    try {
        const [results] = await pool.promise().query(
            'SELECT * FROM users WHERE email = ? AND is_active = 1', [email]
        );
        const user = results[0];

        if (!user || !(await bcrypt.compare(password, user.password_hash))) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user.id, username: user.username, email: user.email, role: user.role, school_id: user.school_id },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );
        res.status(200).json({ message: 'Login successful', token, role: user.role });
    } catch (error) {
        res.status(500).json({ message: 'Error logging in', error: error.message });
    }
};

module.exports = { register, login };
