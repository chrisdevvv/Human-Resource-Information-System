const Employee = require("./employeeModel");
const SalaryInformation = require("./salaryInformationModel");

const normalizeRoleKey = (role) =>
  String(role || "")
    .trim()
    .toLowerCase()
    .replace(/_/g, "-");

const isSchoolScopedRole = (role) => {
  const normalized = normalizeRoleKey(role);
  return normalized === "admin" || normalized === "data-encoder";
};

const isSameSchool = (userSchoolId, targetSchoolId) =>
  Number(userSchoolId) > 0 && Number(userSchoolId) === Number(targetSchoolId);

const getValidatedEmployee = async (employeeId, reqUser) => {
  const employee = await Employee.getById(employeeId, { includeArchived: true });
  if (!employee) {
    const error = new Error("Employee not found");
    error.statusCode = 404;
    throw error;
  }

  if (isSchoolScopedRole(reqUser?.role)) {
    if (!isSameSchool(reqUser?.school_id, employee.school_id)) {
      const error = new Error(
        "You can only access salary information for employees under your assigned school",
      );
      error.statusCode = 403;
      throw error;
    }
  }

  return employee;
};

const getSalaryInformationByEmployee = async (req, res) => {
  try {
    const employeeId = Number(req.params.employee_id);
    await getValidatedEmployee(employeeId, req.user);

    const filters = {
      page: req.query.page ? Number(req.query.page) : undefined,
      pageSize: req.query.pageSize ? Number(req.query.pageSize) : undefined,
      sortOrder: req.query.sortOrder || undefined,
    };

    const result = await SalaryInformation.getByEmployeeId(employeeId, filters);

    if (!filters.page) {
      return res.status(200).json({ data: result });
    }

    return res.status(200).json({
      data: result.data,
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      message: "Error retrieving salary information",
      error: err.message,
    });
  }
};

const getSalaryInformationById = async (req, res) => {
  try {
    const employeeId = Number(req.params.employee_id);
    const salaryInfoId = Number(req.params.id);

    await getValidatedEmployee(employeeId, req.user);

    const record = await SalaryInformation.getById(employeeId, salaryInfoId);
    if (!record) {
      return res.status(404).json({ message: "Salary information not found" });
    }

    return res.status(200).json({ data: record });
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      message: "Error retrieving salary information",
      error: err.message,
    });
  }
};

const createSalaryInformation = async (req, res) => {
  try {
    const employeeId = Number(req.params.employee_id);
    await getValidatedEmployee(employeeId, req.user);

    const created = await SalaryInformation.create(employeeId, req.body);
    return res.status(201).json({
      message: "Salary information created successfully",
      data: created,
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      message: "Error creating salary information",
      error: err.message,
    });
  }
};

const updateSalaryInformation = async (req, res) => {
  try {
    const employeeId = Number(req.params.employee_id);
    const salaryInfoId = Number(req.params.id);

    await getValidatedEmployee(employeeId, req.user);

    const updated = await SalaryInformation.update(
      employeeId,
      salaryInfoId,
      req.body,
    );

    if (!updated) {
      return res.status(404).json({ message: "Salary information not found" });
    }

    return res.status(200).json({
      message: "Salary information updated successfully",
      data: updated,
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      message: "Error updating salary information",
      error: err.message,
    });
  }
};

const deleteSalaryInformation = async (req, res) => {
  try {
    const employeeId = Number(req.params.employee_id);
    const salaryInfoId = Number(req.params.id);

    await getValidatedEmployee(employeeId, req.user);

    const result = await SalaryInformation.delete(employeeId, salaryInfoId);
    if (!result.affectedRows) {
      return res.status(404).json({ message: "Salary information not found" });
    }

    return res.status(200).json({
      message: "Salary information deleted successfully",
      data: { id: salaryInfoId, employee_id: employeeId },
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      message: "Error deleting salary information",
      error: err.message,
    });
  }
};

module.exports = {
  getSalaryInformationByEmployee,
  getSalaryInformationById,
  createSalaryInformation,
  updateSalaryInformation,
  deleteSalaryInformation,
};
