const pool = require('../../config/db');

const Registration = {
    getAll: async (status = null) => {
        let query = `
            SELECT rr.id, rr.first_name, rr.last_name, rr.email, rr.school_name, rr.requested_role,
                   rr.approved_role, rr.status, rr.rejection_reason,
                   rr.reviewed_by, rr.reviewed_at, rr.created_at,
                   u.username AS reviewed_by_username
            FROM registration_requests rr
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
            'SELECT * FROM registration_requests WHERE id = ?',
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
            const baseUsername = `${request.first_name.trim().toLowerCase()}.${request.last_name.trim().toLowerCase()}`;

            // Find a unique username by appending a number if needed
            let username = baseUsername;
            let counter = 2;
            while (true) {
                const [existing] = await conn.query('SELECT id FROM users WHERE username = ?', [username]);
                if (existing.length === 0) break;
                username = `${baseUsername}${counter}`;
                counter++;
            }

            // Look up school by name; create it if it doesn't exist yet
            let school_id;
            const [schoolRows] = await conn.query(
                'SELECT id FROM schools WHERE school_name = ? LIMIT 1',
                [request.school_name.trim()]
            );
            if (schoolRows.length > 0) {
                school_id = schoolRows[0].id;
            } else {
                const school_code = request.school_name.trim()
                    .split(/\s+/)
                    .map(word => word[0].toUpperCase())
                    .join('');
                const [newSchool] = await conn.query(
                    'INSERT INTO schools (school_name, school_code) VALUES (?, ?)',
                    [request.school_name.trim(), school_code]
                );
                school_id = newSchool.insertId;
            }

            await conn.query(
                'INSERT INTO users (username, email, password_hash, role, school_id, is_active) VALUES (?, ?, ?, ?, ?, 1)',
                [username, request.email, request.password_hash, role, school_id]
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
