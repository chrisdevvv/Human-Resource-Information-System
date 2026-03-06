const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const register = async (req, res) => {
    const { username, email, password, role, school_id } = req.body;

    if (!username || !email || !password || !role) {
        return res.status(400).json({ message: 'username, email, password and role are required' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        db.query(
            'INSERT INTO users (username, email, password_hash, role, school_id) VALUES (?, ?, ?, ?, ?)',
            [username, email, hashedPassword, role, school_id || null],
            (err, result) => {
                if (err) return res.status(500).json({ message: 'Error registering user', error: err.message });
                res.status(201).json({ message: 'User registered successfully', userId: result.insertId });
            }
        );
    } catch (error) {
        res.status(500).json({ message: 'Error registering user', error: error.message });
    }
};

const login = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
    }

    try {
        db.query('SELECT * FROM users WHERE username = ? AND is_active = 1', [username], async (err, results) => {
            if (err) return res.status(500).json({ message: 'Error logging in', error: err.message });

            const user = results[0];
            if (!user || !(await bcrypt.compare(password, user.password_hash))) {
                return res.status(401).json({ message: 'Invalid credentials' });
            }

            const token = jwt.sign(
                { id: user.id, username: user.username, role: user.role, school_id: user.school_id },
                process.env.JWT_SECRET,
                { expiresIn: '1d' }
            );
            res.status(200).json({ message: 'Login successful', token, role: user.role });
        });
    } catch (error) {
        res.status(500).json({ message: 'Error logging in', error: error.message });
    }
};

module.exports = { register, login };
