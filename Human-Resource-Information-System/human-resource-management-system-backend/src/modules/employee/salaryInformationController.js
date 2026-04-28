const PDFDocument = require("pdfkit");
const Employee = require("./employeeModel");
const SalaryInformation = require("./salaryInformationModel");
const SalaryIncrementNotice = require("./salaryIncrementNoticeModel");
const Backlog = require("../backlog/backlogModel");

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

const buildSalaryInfoDetails = (record) => {
  if (!record) return null;

  const dateLabel = record.salary_date ? String(record.salary_date) : "";
  const plantilla = record.plantilla ? `Plantilla ${record.plantilla}` : null;
  const sg = record.sg ? `SG ${record.sg}` : null;
  const step = record.step ? `Step ${record.step}` : null;
  const salary = record.salary !== undefined && record.salary !== null
    ? `Salary ${record.salary}`
    : null;
  const increment =
    record.increment_amount !== undefined && record.increment_amount !== null
      ? `Increment ${record.increment_amount}`
      : null;
  const remarks = record.remarks ? `Remarks: ${record.remarks}` : null;

  return [dateLabel, plantilla, sg, step, salary, increment, remarks]
    .filter(Boolean)
    .join(" | ");
};

const toPhpMoneyLabel = (value) => {
  const numeric = Number(value);
  const safe = Number.isFinite(numeric) ? numeric : 0;
  return `PHP ${safe.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const toLongDateLabel = (value) => {
  const normalized = String(value || "").trim();
  if (!normalized) return "N/A";

  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) {
    return normalized;
  }

  return parsed.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const buildEmployeeFullName = (employee) =>
  [employee?.first_name, employee?.middle_name, employee?.last_name]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

const sanitizeFilename = (value, fallback) => {
  const normalized = String(value || "")
    .replace(/[\\/:*?"<>|]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return normalized || fallback;
};

const buildStepIncrementNoticePdfBuffer = ({
  employee,
  salaryRecord,
  notice,
}) =>
  new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", margin: 48 });
      const chunks = [];

      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const employeeName = buildEmployeeFullName(employee) ||
        `Employee ${employee?.id || ""}`.trim();

      doc.font("Helvetica-Bold").fontSize(18).text("Salary Step Increment Notice", {
        align: "center",
      });
      doc.moveDown(0.4);
      doc
        .font("Helvetica")
        .fontSize(10)
        .fillColor("#555555")
        .text(`Reference No: ${notice.notice_reference}`, { align: "center" })
        .text(`Generated: ${toLongDateLabel(notice.updated_at || notice.created_at)}`, {
          align: "center",
        })
        .fillColor("#000000");

      doc.moveDown(1.2);
      doc.font("Helvetica-Bold").fontSize(12).text("Employee Details");
      doc.moveDown(0.2);
      doc.font("Helvetica").fontSize(11);
      doc.text(`Name: ${employeeName}`);
      doc.text(`Employee No: ${employee.employee_no || "N/A"}`);
      doc.text(`School: ${employee.school_name || "N/A"}`);

      doc.moveDown(0.9);
      doc.font("Helvetica-Bold").fontSize(12).text("Increment Details");
      doc.moveDown(0.2);
      doc.font("Helvetica").fontSize(11);
      doc.text(
        `Effective Date: ${toLongDateLabel(notice.effective_date || salaryRecord.salary_date)}`,
      );
      doc.text(`Plantilla: ${salaryRecord.plantilla || "N/A"}`);
      doc.text(`SG/Step: ${salaryRecord.sg || "N/A"} / ${salaryRecord.step || "N/A"}`);
      doc.text(`Previous Salary: ${toPhpMoneyLabel(notice.previous_salary)}`);
      doc.text(`New Salary: ${toPhpMoneyLabel(notice.new_salary)}`);
      doc.text(`Increment Amount: ${toPhpMoneyLabel(notice.increment_amount)}`);
      doc.text(`Remarks: ${notice.remarks || salaryRecord.remarks || "Step Increment"}`);

      doc.moveDown(1.2);
      doc
        .font("Helvetica-Oblique")
        .fontSize(10)
        .fillColor("#444444")
        .text(
          "This notice is system-generated from the employee salary history and can be re-generated any time.",
          { align: "left" },
        )
        .fillColor("#000000");

      doc.end();
    } catch (error) {
      reject(error);
    }
  });

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

const getStepIncrementNoticePdf = async (req, res) => {
  try {
    const employeeId = Number(req.params.employee_id);
    const salaryInfoId = Number(req.params.id);

    const employee = await getValidatedEmployee(employeeId, req.user);
    const salaryRecord = await SalaryInformation.getById(employeeId, salaryInfoId);
    if (!salaryRecord) {
      return res.status(404).json({ message: "Salary information not found" });
    }

    const notice = await SalaryIncrementNotice.upsertFromSalaryInformation(
      employeeId,
      salaryInfoId,
      req.user?.id,
    );

    if (!notice) {
      return res.status(409).json({
        message:
          "A step increment notice is only available for remarks 'Step Increment' or 'Step Increment Increase'",
      });
    }

    const pdfBuffer = await buildStepIncrementNoticePdfBuffer({
      employee,
      salaryRecord,
      notice,
    });

    const employeeName = sanitizeFilename(
      buildEmployeeFullName(employee),
      `Employee-${employeeId}`,
    );
    const effectiveDate = String(
      notice.effective_date || salaryRecord.salary_date || "unknown-date",
    ).replace(/[^0-9-]/g, "");

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${employeeName} - Step Increment Notice - ${effectiveDate}.pdf"`,
    );
    return res.status(200).send(pdfBuffer);
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      message: "Error generating step increment notice PDF",
      error: err.message,
    });
  }
};

const createSalaryInformation = async (req, res) => {
  try {
    const employeeId = Number(req.params.employee_id);
    const employee = await getValidatedEmployee(employeeId, req.user);

    const created = await SalaryInformation.create(employeeId, req.body, {
      actorUserId: req.user?.id,
    });

    await Backlog.record({
      user_id: req.user.id,
      school_id: employee.school_id || null,
      employee_id: employeeId,
      leave_id: null,
      action: "SALARY_INFORMATION_CREATED",
      details: buildSalaryInfoDetails(created),
    });

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

    const employee = await getValidatedEmployee(employeeId, req.user);

    const updated = await SalaryInformation.update(
      employeeId,
      salaryInfoId,
      req.body,
      { actorUserId: req.user?.id },
    );

    if (!updated) {
      return res.status(404).json({ message: "Salary information not found" });
    }

    await Backlog.record({
      user_id: req.user.id,
      school_id: employee.school_id || null,
      employee_id: employeeId,
      leave_id: null,
      action: "SALARY_INFORMATION_UPDATED",
      details: buildSalaryInfoDetails(updated),
    });

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

    const employee = await getValidatedEmployee(employeeId, req.user);

    const existing = await SalaryInformation.getById(employeeId, salaryInfoId);
    if (!existing) {
      return res.status(404).json({ message: "Salary information not found" });
    }

    const result = await SalaryInformation.delete(employeeId, salaryInfoId);
    if (!result.affectedRows) {
      return res.status(404).json({ message: "Salary information not found" });
    }

    await Backlog.record({
      user_id: req.user.id,
      school_id: employee.school_id || null,
      employee_id: employeeId,
      leave_id: null,
      action: "SALARY_INFORMATION_DELETED",
      details: buildSalaryInfoDetails(existing),
    });

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
  getStepIncrementNoticePdf,
  createSalaryInformation,
  updateSalaryInformation,
  deleteSalaryInformation,
};
