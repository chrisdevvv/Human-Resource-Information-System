const pool = require("../../config/db");

const STEP_INCREMENT_NOTICE_REMARKS = new Set([
  "Step Increment",
  "Step Increment Increase",
]);

const toMoney = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Number(parsed.toFixed(2));
};

const normalizeOptionalDate = (value) => {
  if (value === undefined || value === null || value === "") return null;
  const normalized = String(value).trim();
  if (!normalized) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    return normalized;
  }

  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10);
};

const normalizeRemark = (value) => {
  const normalized = String(value || "").trim();
  return normalized || null;
};

const normalizeOptionalUserId = (value) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const buildNoticeReference = ({ employeeId, salaryInformationId, effectiveDate }) => {
  const compactDate = String(effectiveDate || "").replace(/-/g, "");
  return `SI-${employeeId}-${compactDate || "NA"}-${salaryInformationId}`;
};

const isNoticeEligibleRemark = (remark) =>
  STEP_INCREMENT_NOTICE_REMARKS.has(String(remark || "").trim());

const SalaryIncrementNotice = {
  isNoticeEligibleRemark,

  getBySalaryInformationId: async (employeeId, salaryInformationId) => {
    const [rows] = await pool.promise().query(
      `SELECT
         id,
         employee_id,
         salary_information_id,
         notice_reference,
         DATE_FORMAT(effective_date, '%Y-%m-%d') AS effective_date,
         previous_salary,
         new_salary,
         increment_amount,
         remarks,
         generated_by_user_id,
         created_at,
         updated_at
       FROM salary_increment_notices
       WHERE employee_id = ? AND salary_information_id = ?
       LIMIT 1`,
      [employeeId, salaryInformationId],
    );

    return rows[0] || null;
  },

  deleteBySalaryInformationId: async (employeeId, salaryInformationId) => {
    const [result] = await pool.promise().query(
      `DELETE FROM salary_increment_notices
       WHERE employee_id = ? AND salary_information_id = ?`,
      [employeeId, salaryInformationId],
    );

    return result;
  },

  upsertFromSalaryInformation: async (
    employeeId,
    salaryInformationId,
    generatedByUserId = null,
  ) => {
    const [salaryRows] = await pool.promise().query(
      `SELECT
         id,
         employee_id,
         DATE_FORMAT(salary_date, '%Y-%m-%d') AS salary_date,
         salary,
         increment_amount,
         remarks
       FROM salary_information
       WHERE id = ? AND employee_id = ?
       LIMIT 1`,
      [salaryInformationId, employeeId],
    );

    const salaryRow = salaryRows[0] || null;
    if (!salaryRow) {
      return null;
    }

    const normalizedRemark = normalizeRemark(salaryRow.remarks);
    if (!isNoticeEligibleRemark(normalizedRemark)) {
      await SalaryIncrementNotice.deleteBySalaryInformationId(
        employeeId,
        salaryInformationId,
      );
      return null;
    }

    const [previousRows] = await pool.promise().query(
      `SELECT salary
       FROM salary_information
       WHERE employee_id = ?
         AND (salary_date < ? OR (salary_date = ? AND id < ?))
       ORDER BY salary_date DESC, id DESC
       LIMIT 1`,
      [
        employeeId,
        salaryRow.salary_date,
        salaryRow.salary_date,
        salaryInformationId,
      ],
    );

    const previousSalary = toMoney(previousRows[0]?.salary);
    const newSalary = toMoney(salaryRow.salary);
    const computedIncrement = toMoney(newSalary - previousSalary);
    const storedIncrement = Number(salaryRow.increment_amount);
    const incrementAmount = Number.isFinite(storedIncrement)
      ? toMoney(storedIncrement)
      : computedIncrement;

    const effectiveDate = normalizeOptionalDate(salaryRow.salary_date);
    const noticeReference = buildNoticeReference({
      employeeId,
      salaryInformationId,
      effectiveDate,
    });
    const normalizedGeneratedBy = normalizeOptionalUserId(generatedByUserId);

    await pool.promise().query(
      `INSERT INTO salary_increment_notices
       (
         employee_id,
         salary_information_id,
         notice_reference,
         effective_date,
         previous_salary,
         new_salary,
         increment_amount,
         remarks,
         generated_by_user_id
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         notice_reference = VALUES(notice_reference),
         effective_date = VALUES(effective_date),
         previous_salary = VALUES(previous_salary),
         new_salary = VALUES(new_salary),
         increment_amount = VALUES(increment_amount),
         remarks = VALUES(remarks),
         generated_by_user_id = IFNULL(?, generated_by_user_id)`,
      [
        employeeId,
        salaryInformationId,
        noticeReference,
        effectiveDate,
        previousSalary,
        newSalary,
        incrementAmount,
        normalizedRemark,
        normalizedGeneratedBy,
        normalizedGeneratedBy,
      ],
    );

    return SalaryIncrementNotice.getBySalaryInformationId(
      employeeId,
      salaryInformationId,
    );
  },
};

module.exports = SalaryIncrementNotice;
