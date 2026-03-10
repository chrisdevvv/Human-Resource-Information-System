const db = require("../config/db");

const getSchools = (req, res) => {
  db.query(
    "SELECT id, school_name, school_code FROM schools ORDER BY school_name ASC",
    (err, results) => {
      if (err) {
        return res
          .status(500)
          .json({ message: "Error retrieving schools", error: err.message });
      }
      return res.status(200).json({ data: results });
    },
  );
};

module.exports = { getSchools };
