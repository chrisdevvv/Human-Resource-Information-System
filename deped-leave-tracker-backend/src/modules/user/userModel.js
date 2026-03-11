const pool = require('../../config/db');

const User = {
    getAll: async ({ search, role, is_active } = {}) => {
        let query = `
            SELECT u.id, u.first_name, u.last_name, u.email, u.role,
                   u.is_active, u.created_at, u.updated_at,
                   s.school_name, s.school_code
            FROM users u
            LEFT JOIN schools s ON u.school_id = s.id
            WHERE 1=1
        `;
        const params = [];

        if (search) {
            query += ` AND (u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ? OR s.school_name LIKE ?)`;
            const like = `%${search}%`;
            params.push(like, like, like, like);
        }

        if (role) {
            query += ` AND u.role = ?`;
            params.push(role);
        }

        if (is_active !== undefined && is_active !== null) {
            query += ` AND u.is_active = ?`;
            params.push(is_active);
        }

        query += ` ORDER BY u.first_name ASC, u.last_name ASC`;

        const [rows] = await pool.promise().query(query, params);
        return rows;
    },

    getById: async (id) => {
        const [rows] = await pool.promise().query(
            `SELECT u.id, u.first_name, u.last_name, u.email, u.role,
                    u.is_active, u.created_at, u.updated_at,
                    u.school_id, s.school_name, s.school_code
             FROM users u
             LEFT JOIN schools s ON u.school_id = s.id
             WHERE u.id = ?`,
            [id]
        );
        return rows[0];
    },

    updateRole: async (id, role) => {
        const [result] = await pool.promise().query(
            `UPDATE users SET role = ? WHERE id = ?`,
            [role, id]
        );
        return result;
    },

    updateStatus: async (id, is_active) => {
        const [result] = await pool.promise().query(
            `UPDATE users SET is_active = ? WHERE id = ?`,
            [is_active ? 1 : 0, id]
        );
        return result;
    },

    deleteUser: async (id) => {
        const [result] = await pool.promise().query(
            `DELETE FROM users WHERE id = ?`,
            [id]
        );
        return result;
    },
};

module.exports = User;
