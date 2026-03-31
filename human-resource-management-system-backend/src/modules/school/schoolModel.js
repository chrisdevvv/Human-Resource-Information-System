const pool = require('../../config/db');

const School = {
    getAll: async () => {
        const [rows] = await pool.promise().query('SELECT * FROM schools');
        return rows;
    },

    getById: async (id) => {
        const [rows] = await pool.promise().query('SELECT * FROM schools WHERE id = ?', [id]);
        return rows[0];
    },

    create: async (data) => {
        const { school_name, school_code } = data;
        const [result] = await pool.promise().query(
            'INSERT INTO schools (school_name, school_code) VALUES (?, ?)',
            [school_name, school_code]
        );
        return result;
    },

    update: async (id, data) => {
        const { school_name, school_code } = data;
        const [result] = await pool.promise().query(
            'UPDATE schools SET school_name = ?, school_code = ? WHERE id = ?',
            [school_name, school_code, id]
        );
        return result;
    },

    delete: async (id) => {
        const [result] = await pool.promise().query('DELETE FROM schools WHERE id = ?', [id]);
        return result;
    }
};

module.exports = School;
