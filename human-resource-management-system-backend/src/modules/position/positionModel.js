const pool = require("../../config/db");

const Position = {
  getAll: async () => {
    const [rows] = await pool
      .promise()
      .query("SELECT id, position_name FROM positions ORDER BY position_name ASC");
    return rows;
  },

  getById: async (id) => {
    const [rows] = await pool
      .promise()
      .query("SELECT id, position_name FROM positions WHERE id = ?", [id]);
    return rows[0];
  },

  getByName: async (name) => {
    const [rows] = await pool
      .promise()
      .query("SELECT id, position_name FROM positions WHERE position_name = ?", [
        name,
      ]);
    return rows[0];
  },

  create: async (positionName) => {
    const [result] = await pool
      .promise()
      .query("INSERT INTO positions (position_name) VALUES (?)", [positionName]);
    return result;
  },

  bulkCreate: async (positionNames) => {
    if (!positionNames || positionNames.length === 0) {
      return { affectedRows: 0 };
    }

    const placeholders = positionNames.map(() => "(?)").join(",");
    const [result] = await pool
      .promise()
      .query(`INSERT IGNORE INTO positions (position_name) VALUES ${placeholders}`, positionNames);
    return result;
  },

  delete: async (id) => {
    const [result] = await pool
      .promise()
      .query("DELETE FROM positions WHERE id = ?", [id]);
    return result;
  },
};

module.exports = Position;
