const School = require("./schoolModel");
const Backlog = require("../backlog/backlogModel");

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
    const result = await School.create(req.body);
    await Backlog.record({
      user_id: req.user?.id || null,
      school_id: result.insertId,
      employee_id: null,
      leave_id: null,
      action: "SCHOOL_CREATED",
      details: `${req.body.school_name} (${req.body.school_code})`,
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

    const assignedEmployees = await School.countAssignedEmployees(
      req.params.id,
    );
    if (assignedEmployees > 0) {
      return res.status(409).json({
        message: `Cannot delete school. ${assignedEmployees} employee record(s) are still assigned to it. Reassign employees first.`,
        data: { assignedEmployees },
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
