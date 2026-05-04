const School = require("./schoolModel");
const Backlog = require("../backlog/backlogModel");
const pool = require("../../config/db");

const getAllSchools = async (req, res) => {
  try {
    const results = await School.getAll({
      search: req.query.search || null,
      sortOrder: req.query.sortOrder || null,
    });

    res.status(200).json({ data: results });
  } catch (err) {
    console.error("getAllSchools error:", err);

    res.status(500).json({
      message: "Error retrieving schools",
      error: err.message,
    });
  }
};

const getSchoolById = async (req, res) => {
  try {
    const result = await School.getById(req.params.id);
    if (!result) return res.status(404).json({ message: "School not found" });
    res.status(200).json({ data: result });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error retrieving school", error: err.message });
  }
};

const createSchool = async (req, res) => {
  try {
    const districtId = Number(req.body?.district_id);
    if (!Number.isInteger(districtId) || districtId <= 0) {
      return res.status(400).json({ message: "district_id is required" });
    }

    const [[districtRow]] = await pool
      .promise()
      .query(
        "SELECT districtId AS id FROM districts WHERE districtId = ? LIMIT 1",
        [districtId],
      );
    if (!districtRow) {
      return res.status(400).json({ message: "District not found" });
    }

    const result = await School.create(req.body);
    await Backlog.record({
      user_id: req.user?.id || null,
      school_id: result.insertId,
      employee_id: null,
      leave_id: null,
      action: "SCHOOL_CREATED",
      details: `${req.body.school_name} (${req.body.school_code}) - district ${districtId}`,
    });
    res
      .status(201)
      .json({ message: "School created successfully", data: result });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error creating school", error: err.message });
  }
};

const updateSchool = async (req, res) => {
  try {
    const existingSchool = await School.getById(req.params.id);
    if (!existingSchool) {
      return res.status(404).json({ message: "School not found" });
    }

    const result = await School.update(req.params.id, req.body);
    await Backlog.record({
      user_id: req.user?.id || null,
      school_id: Number(req.params.id),
      employee_id: null,
      leave_id: null,
      action: "SCHOOL_UPDATED",
      details: `${existingSchool.school_name} (${existingSchool.school_code}) -> ${req.body.school_name} (${req.body.school_code})`,
    });
    res
      .status(200)
      .json({ message: "School updated successfully", data: result });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error updating school", error: err.message });
  }
};

const deleteSchool = async (req, res) => {
  try {
    const existingSchool = await School.getById(req.params.id);
    if (!existingSchool) {
      return res.status(404).json({ message: "School not found" });
    }

    const schoolId = Number(req.params.id);

    const countIfTableExists = async (tableName) => {
      const [[tableRow]] = await pool.promise().query(
        `SELECT COUNT(*) AS total
         FROM INFORMATION_SCHEMA.TABLES
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = ?`,
        [tableName],
      );

      if (!Number(tableRow?.total || 0)) {
        return 0;
      }

      const [[countRow]] = await pool
        .promise()
        .query(
          `SELECT COUNT(*) AS total FROM ${tableName} WHERE school_id = ?`,
          [schoolId],
        );

      return Number(countRow?.total || 0);
    };

    // Check referencing records in multiple tables to provide a clear error message
    const assignedEmployees = await School.countAssignedEmployees(schoolId);
    const usersTotal = await countIfTableExists("users");
    const backlogsTotal = await countIfTableExists("backlogs");

    const refCounts = {
      employees: Number(assignedEmployees || 0),
      users: Number(usersTotal || 0),
      backlogs: Number(backlogsTotal || 0),
    };

    const nonZero = Object.entries(refCounts).filter(([, v]) => Number(v) > 0);
    if (nonZero.length > 0) {
      const details = nonZero.map(([k, v]) => `${k}: ${v}`).join(", ");
      return res.status(409).json({
        message:
          "Cannot delete school because related records still reference it.",
        data: { counts: refCounts, details },
      });
    }

    // Write audit trail before deletion so school_id still exists for FK checks.
    // If logging fails, do not fail the delete request itself.
    try {
      await Backlog.record({
        user_id: req.user?.id || null,
        school_id: Number(req.params.id),
        employee_id: null,
        leave_id: null,
        action: "SCHOOL_DELETED",
        details: `${existingSchool.school_name} (${existingSchool.school_code})`,
      });
    } catch (logErr) {
      console.error("Failed to log SCHOOL_DELETED backlog:", logErr.message);
    }

    const result = await School.delete(req.params.id);
    res
      .status(200)
      .json({ message: "School deleted successfully", data: result });
  } catch (err) {
    if (err?.code === "ER_ROW_IS_REFERENCED_2" || err?.errno === 1451) {
      return res.status(409).json({
        message:
          "Cannot delete school because related records still reference it.",
      });
    }
    // Log full error for debugging (includes SQL errors and stack trace)
    console.error("deleteSchool error:", err);
    res
      .status(500)
      .json({ message: "Error deleting school", error: err.message });
  }
};

module.exports = {
  getAllSchools,
  getSchoolById,
  createSchool,
  updateSchool,
  deleteSchool,
};
