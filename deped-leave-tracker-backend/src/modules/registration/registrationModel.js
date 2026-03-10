const pool = require('../../config/db');

const Registration = {
    getAll: async (status = null) => {
        let query = `
            SELECT rr.id, rr.first_name, rr.last_name, rr.email, rr.school_id, rr.requested_role,
                   rr.approved_role, rr.status, rr.rejection_reason,
                   rr.reviewed_by, rr.reviewed_at, rr.created_at,
                   s.school_name, u.username AS reviewed_by_username
            FROM registration_requests rr
            JOIN schools s ON rr.school_id = s.id
            LEFT JOIN users u ON rr.reviewed_by = u.id
        `;
        const params = [];
        if (status) {
            query += ' WHERE rr.status = ?';
            params.push(status);
        }
        query += ' ORDER BY rr.created_at DESC';
        const [rows] = await pool.promise().query(query, params);
        return rows;
    },

    getById: async (id) => {
        const [rows] = await pool.promise().query(
            `SELECT rr.*, s.school_name
             FROM registration_requests rr
             JOIN schools s ON rr.school_id = s.id
             WHERE rr.id = ?`,
            [id]
        );
        return rows[0];
    },

    approve: async (id, approved_role, reviewed_by) => {
        const conn = await pool.promise().getConnection();
        try {
            await conn.beginTransaction();

            const [rows] = await conn.query(
                'SELECT * FROM registration_requests WHERE id = ? AND status = ?',
                [id, 'PENDING']
            );
            if (!rows[0]) throw new Error('Registration request not found or already processed');

            const request = rows[0];
            const role = approved_role || request.requested_role || 'DATA_ENCODER';
            const username = `${request.first_name.trim().toLowerCase()}.${request.last_name.trim().toLowerCase()}`;

            await conn.query(
                'INSERT INTO users (username, email, password_hash, role, school_id, is_active) VALUES (?, ?, ?, ?, ?, 1)',
                [username, request.email, request.password_hash, role, request.school_id]
            );

            await conn.query(
                'UPDATE registration_requests SET status = ?, approved_role = ?, reviewed_by = ?, reviewed_at = NOW() WHERE id = ?',
                ['APPROVED', role, reviewed_by, id]
            );

            await conn.commit();
            return { success: true };
        } catch (err) {
            await conn.rollback();
            throw err;
        } finally {
            conn.release();
        }
    },

    reject: async (id, rejection_reason, reviewed_by) => {
        const [result] = await pool.promise().query(
            'UPDATE registration_requests SET status = ?, rejection_reason = ?, reviewed_by = ?, reviewed_at = NOW() WHERE id = ?',
            ['REJECTED', rejection_reason || null, reviewed_by, id]
        );
        return result;
    }
};

module.exports = Registration;
