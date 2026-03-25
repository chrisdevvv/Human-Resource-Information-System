const bcrypt = require("bcryptjs");
const Employee = require("./employeeModel");
const Backlog = require("../backlog/backlogModel");
const pool = require("../../config/db");

const toBoolean = (value) => {
  if (value === true || value === 1 || value === "1") return true;
  if (typeof value === "string") return value.trim().toLowerCase() === "true";
  return false;
};

const isAdminLevel = (role) => {
  const normalized = String(role || "").toUpperCase();
  return normalized === "ADMIN" || normalized === "SUPER_ADMIN";
};

const getAllEmployees = async (req, res) => {
  try {
    const { page, pageSize, include_archived, on_leave } = req.query;
    const includeArchivedRequested = toBoolean(include_archived);
    const includeArchived =
      includeArchivedRequested && isAdminLevel(req.user?.role);

    const onLeave =
      on_leave === undefined || on_leave === null || on_leave === ""
        ? undefined
        : toBoolean(on_leave);

    const filters = {
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
      includeArchived,
      onLeave,
    };
    const results = await Employee.getAll(filters);

    if (!filters.page) return res.status(200).json({ data: results });
    return res.status(200).json({
      data: results.data,
      total: results.total,
      page: results.page,
      pageSize: results.pageSize,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error retrieving employees", error: err.message });
  }
};

const getEmployeeById = async (req, res) => {
  try {
    const result = await Employee.getById(req.params.id);
    if (!result) return res.status(404).json({ message: "Employee not found" });
    res.status(200).json({ data: result });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error retrieving employee", error: err.message });
  }
};

const getEmployeesBySchool = async (req, res) => {
  try {
    const includeArchived =
      toBoolean(req.query?.include_archived) && isAdminLevel(req.user?.role);
    const onLeave =
      req.query?.on_leave === undefined ||
      req.query?.on_leave === null ||
      req.query?.on_leave === ""
        ? undefined
        : toBoolean(req.query?.on_leave);

    const results = await Employee.getBySchool(req.params.school_id, {
      includeArchived,
      onLeave,
    });
    res.status(200).json({ data: results });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error retrieving employees", error: err.message });
  }
};

const getEmployeeStatusCounts = async (req, res) => {
  try {
    const includeArchivedRequested = toBoolean(req.query?.include_archived);
    const includeArchived =
      includeArchivedRequested && isAdminLevel(req.user?.role);
    const schoolId = req.query?.school_id ? Number(req.query.school_id) : null;

    const counts = await Employee.getStatusCounts({ schoolId });
    const totalAll = Number(counts.total_all || 0);
    const archived = Number(counts.archived || 0);
    const activeTotal = Number(counts.active_total || 0);
    const onLeave = Number(counts.on_leave || 0);
    const available = Number(counts.available || 0);

    return res.status(200).json({
      data: {
        total: includeArchived ? totalAll : activeTotal,
        active_total: activeTotal,
        on_leave: onLeave,
        available,
        archived: includeArchived ? archived : 0,
        include_archived: includeArchived,
        school_id: schoolId,
      },
    });
  } catch (err) {
    return res.status(500).json({
      message: "Error retrieving employee status counts",
      error: err.message,
    });
  }
};

const createEmployee = async (req, res) => {
  try {
    const result = await Employee.create(req.body);
    const { first_name, last_name, employee_type, school_id } = req.body;
    await Backlog.record({
      user_id: req.user.id,
      school_id: school_id || null,
      employee_id: result.insertId,
      leave_id: null,
      action: "EMPLOYEE_CREATED",
      details: `${first_name} ${last_name} (${employee_type})`,
    });
    res
      .status(201)
      .json({ message: "Employee created successfully", data: result });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error creating employee", error: err.message });
  }
};

const updateEmployee = async (req, res) => {
  try {
    const result = await Employee.update(req.params.id, req.body);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Employee not found" });
    }
    const { first_name, last_name, employee_type, school_id } = req.body;
    await Backlog.record({
      user_id: req.user.id,
      school_id: school_id || null,
      employee_id: Number(req.params.id),
      leave_id: null,
      action: "EMPLOYEE_UPDATED",
      details: `${first_name} ${last_name} (${employee_type})`,
    });
    res
      .status(200)
      .json({ message: "Employee updated successfully", data: result });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error updating employee", error: err.message });
  }
};

const deleteEmployee = async (req, res) => {
  try {
    const employee = await Employee.getById(req.params.id, {
      includeArchived: true,
    });
    if (!employee)
      return res.status(404).json({ message: "Employee not found" });
    const result = await Employee.delete(req.params.id);
    await Backlog.record({
      user_id: req.user.id,
      school_id: employee.school_id || null,
      employee_id: Number(req.params.id),
      leave_id: null,
      action: "EMPLOYEE_DELETED",
      details: `${employee.first_name} ${employee.last_name} (${employee.employee_type})`,
    });
    res
      .status(200)
      .json({ message: "Employee deleted successfully", data: result });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error deleting employee", error: err.message });
  }
};

const archiveEmployee = async (req, res) => {
  try {
    const { password } = req.body;

    // Require password for archiving
    if (!password) {
      return res
        .status(400)
        .json({ message: "Password is required to archive employee" });
    }

    const employee = await Employee.getById(req.params.id, {
      includeArchived: true,
    });
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    if (employee.is_archived) {
      return res.status(409).json({ message: "Employee is already archived" });
    }

    // Verify the user's password before allowing the archive
    const [userRows] = await pool
      .promise()
      .query("SELECT password_hash FROM users WHERE id = ? AND is_active = 1", [
        req.user.id,
      ]);
    if (!userRows[0]) {
      return res.status(404).json({ message: "User account not found" });
    }

    const passwordMatch = await bcrypt.compare(
      password,
      userRows[0].password_hash,
    );
    if (!passwordMatch) {
      return res.status(401).json({ message: "Password is incorrect" });
    }

    const result = await Employee.archive(req.params.id, req.user.id);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Employee not found" });
    }

    await Backlog.record({
      user_id: req.user.id,
      school_id: employee.school_id || null,
      employee_id: Number(req.params.id),
      leave_id: null,
      action: "EMPLOYEE_ARCHIVED",
      details: `${employee.first_name} ${employee.last_name} (${employee.employee_type})`,
    });

    return res.status(200).json({ message: "Employee archived successfully" });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Error archiving employee", error: err.message });
  }
};

const unarchiveEmployee = async (req, res) => {
  try {
    const employee = await Employee.getById(req.params.id, {
      includeArchived: true,
    });
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    if (!employee.is_archived) {
      return res.status(409).json({ message: "Employee is not archived" });
    }

    // Verify password before allowing unarchive
    const { password } = req.body;
    if (!password) {
      return res
        .status(400)
        .json({ message: "Password is required to restore employee" });
    }

    const [userRows] = await pool
      .promise()
      .query("SELECT password_hash FROM users WHERE id = ? AND is_active = 1", [
        req.user.id,
      ]);
    if (!userRows[0]) {
      return res.status(404).json({ message: "User account not found" });
    }

    const passwordMatch = await bcrypt.compare(
      password,
      userRows[0].password_hash,
    );
    if (!passwordMatch) {
      return res.status(401).json({ message: "Password is incorrect" });
    }

    const result = await Employee.unarchive(req.params.id);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Employee not found" });
    }

    await Backlog.record({
      user_id: req.user.id,
      school_id: employee.school_id || null,
      employee_id: Number(req.params.id),
      leave_id: null,
      action: "EMPLOYEE_UNARCHIVED",
      details: `${employee.first_name} ${employee.last_name} (${employee.employee_type})`,
    });

    return res.status(200).json({ message: "Employee restored successfully" });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Error restoring employee", error: err.message });
  }
};

const markEmployeeOnLeave = async (req, res) => {
  try {
    const employee = await Employee.getById(req.params.id, {
      includeArchived: true,
    });
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    if (employee.is_archived) {
      return res
        .status(409)
        .json({ message: "Archived employees cannot be marked on leave" });
    }

    if (employee.on_leave) {
      return res
        .status(409)
        .json({ message: "Employee is already marked on leave" });
    }

    const { on_leave_from, on_leave_until, reason } = req.body || {};
    const result = await Employee.markOnLeave(req.params.id, {
      on_leave_from,
      on_leave_until,
      reason,
    });

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Employee not found" });
    }

    await Backlog.record({
      user_id: req.user.id,
      school_id: employee.school_id || null,
      employee_id: Number(req.params.id),
      leave_id: null,
      action: "EMPLOYEE_MARKED_ON_LEAVE",
      details: `${employee.first_name} ${employee.last_name}${reason ? `: ${reason}` : ""}`,
    });

    return res.status(200).json({ message: "Employee marked as on leave" });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Error marking employee on leave", error: err.message });
  }
};

const markEmployeeAvailable = async (req, res) => {
  try {
    const employee = await Employee.getById(req.params.id, {
      includeArchived: true,
    });
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    if (employee.is_archived) {
      return res
        .status(409)
        .json({ message: "Archived employees cannot be marked available" });
    }

    if (!employee.on_leave) {
      return res.status(409).json({ message: "Employee is already available" });
    }

    const result = await Employee.markAvailable(req.params.id);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Employee not found" });
    }

    await Backlog.record({
      user_id: req.user.id,
      school_id: employee.school_id || null,
      employee_id: Number(req.params.id),
      leave_id: null,
      action: "EMPLOYEE_MARKED_AVAILABLE",
      details: `${employee.first_name} ${employee.last_name}`,
    });

    return res.status(200).json({ message: "Employee marked as available" });
  } catch (err) {
    return res.status(500).json({
      message: "Error marking employee available",
      error: err.message,
    });
  }
};

module.exports = {
  getAllEmployees,
  getEmployeeById,
  getEmployeesBySchool,
  getEmployeeStatusCounts,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  archiveEmployee,
  unarchiveEmployee,
  markEmployeeOnLeave,
  markEmployeeAvailable,
};
