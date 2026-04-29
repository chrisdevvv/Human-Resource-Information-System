const bcrypt = require("bcryptjs");
const Employee = require("./employeeModel");
const SalaryInformation = require("./salaryInformationModel");
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

const isSchoolScopedWriteRole = (role) => {
  const normalized = String(role || "").toUpperCase();
  return normalized === "ADMIN" || normalized === "DATA_ENCODER";
};

const getScopedSchoolId = (req) => {
  const schoolId = Number(req.user?.school_id);
  return Number.isFinite(schoolId) && schoolId > 0 ? schoolId : null;
};

const isSameSchool = (userSchoolId, targetSchoolId) =>
  Number(userSchoolId) > 0 && Number(userSchoolId) === Number(targetSchoolId);

const buildFullName = (firstName, middleName, lastName) =>
  [firstName, middleName, lastName].filter(Boolean).join(" ").trim();

const getEffectiveEmployeeType = (payload = {}) =>
  payload.resolved_employee_type ||
  payload.current_employee_type ||
  payload.employee_type ||
  null;

const resolveSchoolPrimaryKeyColumn = async () => {
  const [rows] = await pool.promise().query(
    `SELECT COLUMN_NAME AS column_name
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'schools'
       AND COLUMN_NAME IN ('schoolId', 'id')
     ORDER BY CASE COLUMN_NAME WHEN 'schoolId' THEN 0 ELSE 1 END
     LIMIT 1`,
  );

  return rows?.[0]?.column_name || "schoolId";
};

const getAllEmployees = async (req, res) => {
  try {
    const {
      search,
      employee_type,
      school_id,
      letter,
      retirement,
      sortOrder,
      page,
      pageSize,
      include_archived,
      on_leave,
    } = req.query;
    const includeArchivedRequested = toBoolean(include_archived);
    const includeArchived =
      includeArchivedRequested && isAdminLevel(req.user?.role);

    const onLeave =
      on_leave === undefined || on_leave === null || on_leave === ""
        ? undefined
        : toBoolean(on_leave);

    const requestedSchoolId = school_id ? Number(school_id) : null;
    const scopedSchoolId = isSchoolScopedWriteRole(req.user?.role)
      ? getScopedSchoolId(req)
      : requestedSchoolId;

    if (isSchoolScopedWriteRole(req.user?.role) && !scopedSchoolId) {
      return res.status(403).json({
        message: "Your account is not assigned to a valid school",
      });
    }

    const filters = {
      search: search || null,
      employeeType: employee_type || null,
      letter: letter || null,
      retirement: retirement || null,
      sortOrder: sortOrder || null,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
      includeArchived,
      onLeave,
      schoolId: scopedSchoolId,
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
    const result = await Employee.getById(req.params.id, {
      includeArchived: true,
    });
    if (!result) return res.status(404).json({ message: "Employee not found" });

    if (result.is_archived && result.archived_by) {
      const [archiverRows] = await pool
        .promise()
        .query(
          "SELECT id, first_name, last_name, email FROM users WHERE id = ? LIMIT 1",
          [result.archived_by],
        );

      if (archiverRows[0]) {
        result.archived_by_name = [
          archiverRows[0].first_name,
          archiverRows[0].last_name,
        ]
          .filter(Boolean)
          .join(" ")
          .trim();
        result.archived_by_email = archiverRows[0].email || null;
      }
    }

    if (isSchoolScopedWriteRole(req.user?.role)) {
      if (!isSameSchool(req.user?.school_id, result.school_id)) {
        return res.status(403).json({
          message:
            "You can only view employee records under your assigned school",
        });
      }
    }

    res.status(200).json({ data: result });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error retrieving employee", error: err.message });
  }
};

const getEmployeesBySchool = async (req, res) => {
  try {
    const requestedSchoolId = Number(req.params.school_id);
    if (
      isSchoolScopedWriteRole(req.user?.role) &&
      !isSameSchool(req.user?.school_id, requestedSchoolId)
    ) {
      return res.status(403).json({
        message:
          "You can only view employee records under your assigned school",
      });
    }

    const includeArchived =
      toBoolean(req.query?.include_archived) && isAdminLevel(req.user?.role);
    const onLeave =
      req.query?.on_leave === undefined ||
      req.query?.on_leave === null ||
      req.query?.on_leave === ""
        ? undefined
        : toBoolean(req.query?.on_leave);

    const filters = {
      search: req.query?.search || null,
      employeeType: req.query?.employee_type || null,
      letter: req.query?.letter || null,
      retirement: req.query?.retirement || null,
      sortOrder: req.query?.sortOrder || null,
      includeArchived,
      onLeave,
    };

    const results = await Employee.getBySchool(requestedSchoolId, filters);
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
    const requestedSchoolId = req.query?.school_id
      ? Number(req.query.school_id)
      : null;
    const schoolId = isSchoolScopedWriteRole(req.user?.role)
      ? getScopedSchoolId(req)
      : requestedSchoolId;

    if (isSchoolScopedWriteRole(req.user?.role) && !schoolId) {
      return res.status(403).json({
        message: "Your account is not assigned to a valid school",
      });
    }

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
    const requestedSchoolId = Number(req.body?.school_id);
    if (!Number.isFinite(requestedSchoolId) || requestedSchoolId <= 0) {
      return res.status(400).json({
        message: "A valid school is required to create an employee record.",
      });
    }

    if (isSchoolScopedWriteRole(req.user?.role)) {
      if (!isSameSchool(req.user?.school_id, req.body?.school_id)) {
        return res.status(403).json({
          message:
            "You can only create employee records under your assigned school",
        });
      }

      req.body.school_id = Number(req.user?.school_id);
    } else {
      req.body.school_id = requestedSchoolId;
    }

    const schoolPkColumn = await resolveSchoolPrimaryKeyColumn();
    const [schoolRows] = await pool
      .promise()
      .query(`SELECT 1 FROM schools WHERE ${schoolPkColumn} = ? LIMIT 1`, [
        req.body.school_id,
      ]);

    if (!schoolRows.length) {
      return res.status(400).json({
        message: "Selected school does not exist.",
      });
    }

    const result = await Employee.create(req.body);
    const { first_name, middle_name, last_name, school_id } = req.body;
    const effectiveEmployeeType = getEffectiveEmployeeType(req.body);

    await Backlog.record({
      user_id: req.user.id,
      school_id: school_id || null,
      employee_id: result.insertId,
      leave_id: null,
      action: "EMPLOYEE_CREATED",
      details: `${buildFullName(first_name, middle_name, last_name)} (${effectiveEmployeeType || "N/A"})`,
    });

    res
      .status(201)
      .json({ message: "Employee created successfully", data: result });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ message: err.message });
    }

    if (err.code === "ER_DUP_ENTRY" || /Duplicate entry/i.test(err.message)) {
      return res.status(409).json({
        message:
          "An employee record with one of the provided unique values already exists.",
      });
    }

    if (err.code === "ER_NO_REFERENCED_ROW_2") {
      return res.status(400).json({
        message:
          "One of the selected values (school, position, civil status, or sex) is no longer valid. Please refresh and try again.",
      });
    }

    if (err.code === "ER_DATA_TOO_LONG") {
      const columnMatch = String(err.message || "").match(
        /for column '([^']+)'/i,
      );
      const columnName = columnMatch?.[1]
        ? columnMatch[1].replace(/_/g, " ")
        : "One of the fields";

      return res.status(400).json({
        message: `${columnName} exceeds the allowed length.`,
      });
    }

    if (err.code === "ER_BAD_NULL_ERROR") {
      return res.status(400).json({
        message: "A required employee field is missing.",
      });
    }

    res.status(500).json({
      message: err.message || "Error creating employee",
      error: err.message,
    });
  }
};

const updateEmployee = async (req, res) => {
  try {
    const existing = await Employee.getById(req.params.id, {
      includeArchived: true,
    });
    if (!existing) {
      return res.status(404).json({ message: "Employee not found" });
    }

    const hasExplicitSchoolId =
      req.body?.school_id !== undefined &&
      req.body?.school_id !== null &&
      req.body?.school_id !== "";
    const resolvedSchoolId = hasExplicitSchoolId
      ? Number(req.body.school_id)
      : Number(existing.school_id);

    if (!Number.isFinite(resolvedSchoolId) || resolvedSchoolId <= 0) {
      return res.status(400).json({
        message: "A valid school is required to update an employee record.",
      });
    }

    if (isSchoolScopedWriteRole(req.user?.role)) {
      if (!isSameSchool(req.user?.school_id, existing.school_id)) {
        return res.status(403).json({
          message:
            "You can only edit employee records under your assigned school",
        });
      }

      if (!isSameSchool(req.user?.school_id, resolvedSchoolId)) {
        return res.status(403).json({
          message:
            "You can only assign employee records to your assigned school",
        });
      }

      req.body.school_id = Number(req.user?.school_id);
    } else {
      req.body.school_id = resolvedSchoolId;
    }

    const resolvedDistrictInput =
      req.body?.district ?? req.body?.work_district ?? existing.district ?? "";

    const requestedDistrict = String(resolvedDistrictInput).trim();

    if (!requestedDistrict) {
      return res.status(400).json({
        message: "A valid district is required to update an employee record.",
      });
    }

    const [districtRows] = await pool
      .promise()
      .query(
        "SELECT districtName AS district_name FROM districts WHERE LOWER(TRIM(districtName)) = LOWER(TRIM(?)) LIMIT 1",
        [requestedDistrict],
      );

    if (!districtRows.length) {
      return res.status(400).json({
        message:
          "Selected district does not exist. Please choose a district from the configured list.",
      });
    }

    const normalizedDistrict = districtRows[0].district_name;

    const mergedBody = {
      first_name: req.body.first_name ?? existing.first_name,
      middle_name: req.body.middle_name ?? existing.middle_name,
      last_name: req.body.last_name ?? existing.last_name,
      middle_initial: req.body.middle_initial ?? existing.middle_initial,
      personal_email: req.body.personal_email ?? existing.email,
      email: req.body.email ?? existing.email,
      mobile_number: req.body.mobile_number ?? existing.mobile_number,
      home_address: req.body.home_address ?? existing.home_address,
      place_of_birth: req.body.place_of_birth ?? existing.place_of_birth,
      civil_status: req.body.civil_status ?? existing.civil_status,
      civil_status_id: req.body.civil_status_id ?? existing.civil_status_id,
      sex: req.body.sex ?? existing.sex,
      sex_id: req.body.sex_id ?? existing.sex_id,
      employee_type: req.body.employee_type ?? existing.employee_type,
      school_id: req.body.school_id ?? existing.school_id,
      employee_no: req.body.employee_no ?? existing.employee_no,
      work_email: req.body.work_email ?? existing.work_email,
      district: normalizedDistrict,
      work_district: normalizedDistrict,
      position: req.body.position ?? existing.position,
      position_id: req.body.position_id ?? existing.position_id,
      plantilla_no: req.body.plantilla_no ?? existing.plantilla_no,
      sg: req.body.sg ?? existing.sg,
      current_employee_type:
        req.body.current_employee_type ?? existing.current_employee_type,
      current_position: req.body.current_position ?? existing.current_position,
      current_plantilla_no:
        req.body.current_plantilla_no ?? existing.current_plantilla_no,
      current_appointment_date:
        req.body.current_appointment_date ?? existing.current_appointment_date,
      current_sg: req.body.current_sg ?? existing.current_sg,
      prc_license_no: req.body.prc_license_no ?? existing.prc_license_no,
      tin: req.body.tin ?? existing.tin,
      gsis_bp_no: req.body.gsis_bp_no ?? existing.gsis_bp_no,
      gsis_crn_no: req.body.gsis_crn_no ?? existing.gsis_crn_no,
      pagibig_no: req.body.pagibig_no ?? existing.pagibig_no,
      philhealth_no: req.body.philhealth_no ?? existing.philhealth_no,
      age: req.body.age ?? existing.age,
      birthdate: req.body.birthdate ?? existing.birthdate,
      date_of_first_appointment:
        req.body.date_of_first_appointment ??
        existing.date_of_first_appointment,
    };

    const hasRequestedSgUpdate =
      Object.prototype.hasOwnProperty.call(req.body, "sg") ||
      Object.prototype.hasOwnProperty.call(req.body, "current_sg");

    const result = await Employee.update(req.params.id, mergedBody);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Employee not found" });
    }

    if (hasRequestedSgUpdate) {
      const employeeId = Number(req.params.id);
      const latestSalaryInfo =
        await SalaryInformation.getLatestByEmployeeId(employeeId);

      if (latestSalaryInfo?.id) {
        const effectiveSgValue = mergedBody.current_sg ?? mergedBody.sg ?? null;
        const normalizedSg =
          effectiveSgValue === undefined || effectiveSgValue === null
            ? null
            : String(effectiveSgValue).trim();

        await SalaryInformation.update(
          employeeId,
          Number(latestSalaryInfo.id),
          { sg: normalizedSg || null },
          { actorUserId: req.user?.id },
        );
      }
    }

    const effectiveEmployeeType = getEffectiveEmployeeType(mergedBody);

    await Backlog.record({
      user_id: req.user.id,
      school_id: mergedBody.school_id || null,
      employee_id: Number(req.params.id),
      leave_id: null,
      action: "EMPLOYEE_UPDATED",
      details: `${buildFullName(
        mergedBody.first_name,
        mergedBody.middle_name,
        mergedBody.last_name,
      )} (${effectiveEmployeeType || "N/A"})`,
    });

    res
      .status(200)
      .json({ message: "Employee updated successfully", data: result });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ message: err.message });
    }

    if (err.code === "ER_DUP_ENTRY" || /Duplicate entry/i.test(err.message)) {
      return res.status(409).json({
        message:
          "An employee record with one of the provided unique values already exists.",
      });
    }

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

    if (isSchoolScopedWriteRole(req.user?.role)) {
      if (!isSameSchool(req.user?.school_id, employee.school_id)) {
        return res.status(403).json({
          message:
            "You can only delete employee records under your assigned school",
        });
      }
    }

    const result = await Employee.delete(req.params.id);
    const effectiveEmployeeType = getEffectiveEmployeeType(employee);

    await Backlog.record({
      user_id: req.user.id,
      school_id: employee.school_id || null,
      employee_id: Number(req.params.id),
      leave_id: null,
      action: "EMPLOYEE_DELETED",
      details: `${employee.first_name} ${employee.last_name} (${effectiveEmployeeType || "N/A"})`,
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
    const { password, archive_reason } = req.body;

    if (!password) {
      return res
        .status(400)
        .json({ message: "Password is required to archive employee" });
    }

    const archiveReason = String(archive_reason || "").trim();
    if (!archiveReason) {
      return res.status(400).json({ message: "Archive reason is required" });
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

    const result = await Employee.archive(
      req.params.id,
      req.user.id,
      archiveReason,
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Employee not found" });
    }

    const effectiveEmployeeType = getEffectiveEmployeeType(employee);

    await Backlog.record({
      user_id: req.user.id,
      school_id: employee.school_id || null,
      employee_id: Number(req.params.id),
      leave_id: null,
      action: "EMPLOYEE_ARCHIVED",
      details: `${employee.first_name} ${employee.last_name} (${effectiveEmployeeType || "N/A"}) — Reason: ${archiveReason}`,
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

    const effectiveEmployeeType = getEffectiveEmployeeType(employee);

    await Backlog.record({
      user_id: req.user.id,
      school_id: employee.school_id || null,
      employee_id: Number(req.params.id),
      leave_id: null,
      action: "EMPLOYEE_UNARCHIVED",
      details: `${employee.first_name} ${employee.last_name} (${effectiveEmployeeType || "N/A"})`,
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
