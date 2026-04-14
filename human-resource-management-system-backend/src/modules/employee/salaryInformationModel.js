const pool = require("../../config/db");

const toNumberOrNull = (value) => {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const normalizeOptionalText = (value) => {
  if (value === undefined || value === null) return null;
  const normalized = String(value).trim();
  return normalized.length > 0 ? normalized : null;
};

const normalizeOptionalDate = (value) => {
  if (value === undefined || value === null || value === "") return null;
  const normalized = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return normalized;
  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10);
};

const SalaryInformation = {
  getByEmployeeId: async (employeeId, filters = {}) => {
    const page = Number(filters.page) || null;
    const pageSize = Math.min(Number(filters.pageSize) || 25, 200);
    const sortOrder =
      String(filters.sortOrder || "desc").toLowerCase() === "asc"
        ? "ASC"
        : "DESC";

    const baseFrom = "FROM salary_information WHERE employee_id = ?";
    const baseParams = [employeeId];

    if (!page) {
      const [rows] = await pool.promise().query(
        `SELECT id, employee_id, salary_date, plantilla, sg, step, salary, increment_amount, remarks, created_at, updated_at ${baseFrom} ORDER BY salary_date ${sortOrder}, id DESC`,
        baseParams,
      );
      return rows;
    }

    const offset = (page - 1) * pageSize;
    const [[{ total }]] = await pool
      .promise()
      .query(`SELECT COUNT(1) AS total ${baseFrom}`, baseParams);

    const [rows] = await pool.promise().query(
      `SELECT id, employee_id, salary_date, plantilla, sg, step, salary, increment_amount, remarks, created_at, updated_at ${baseFrom} ORDER BY salary_date ${sortOrder}, id DESC LIMIT ? OFFSET ?`,
      [...baseParams, pageSize, offset],
    );

    return { data: rows, total: Number(total), page, pageSize };
  },

  getById: async (employeeId, id) => {
    const [rows] = await pool.promise().query(
      `SELECT id, employee_id, salary_date, plantilla, sg, step, salary, increment_amount, remarks, created_at, updated_at
       FROM salary_information
       WHERE id = ? AND employee_id = ?
       LIMIT 1`,
      [id, employeeId],
    );
    return rows[0] || null;
  },

  create: async (employeeId, payload) => {
    const [result] = await pool.promise().query(
      `INSERT INTO salary_information
       (employee_id, salary_date, plantilla, sg, step, salary, increment_amount, remarks)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        employeeId,
        normalizeOptionalDate(payload.date),
        normalizeOptionalText(payload.plantilla),
        normalizeOptionalText(payload.sg),
        normalizeOptionalText(payload.step),
        toNumberOrNull(payload.salary) ?? 0,
        toNumberOrNull(payload.increment),
        normalizeOptionalText(payload.remarks),
      ],
    );

    return SalaryInformation.getById(employeeId, result.insertId);
  },

  update: async (employeeId, id, payload) => {
    const fields = [];
    const params = [];

    if (Object.prototype.hasOwnProperty.call(payload, "date")) {
      fields.push("salary_date = ?");
      params.push(normalizeOptionalDate(payload.date));
    }
    if (Object.prototype.hasOwnProperty.call(payload, "plantilla")) {
      fields.push("plantilla = ?");
      params.push(normalizeOptionalText(payload.plantilla));
    }
    if (Object.prototype.hasOwnProperty.call(payload, "sg")) {
      fields.push("sg = ?");
      params.push(normalizeOptionalText(payload.sg));
    }
    if (Object.prototype.hasOwnProperty.call(payload, "step")) {
      fields.push("step = ?");
      params.push(normalizeOptionalText(payload.step));
    }
    if (Object.prototype.hasOwnProperty.call(payload, "salary")) {
      fields.push("salary = ?");
      params.push(toNumberOrNull(payload.salary));
    }
    if (Object.prototype.hasOwnProperty.call(payload, "increment")) {
      fields.push("increment_amount = ?");
      params.push(toNumberOrNull(payload.increment));
    }
    if (Object.prototype.hasOwnProperty.call(payload, "remarks")) {
      fields.push("remarks = ?");
      params.push(normalizeOptionalText(payload.remarks));
    }

    if (fields.length === 0) {
      return SalaryInformation.getById(employeeId, id);
    }

    params.push(id, employeeId);

    const [result] = await pool.promise().query(
      `UPDATE salary_information
       SET ${fields.join(", ")}
       WHERE id = ? AND employee_id = ?`,
      params,
    );

    if (result.affectedRows === 0) {
      return null;
    }

    return SalaryInformation.getById(employeeId, id);
  },

  delete: async (employeeId, id) => {
    const [result] = await pool.promise().query(
      "DELETE FROM salary_information WHERE id = ? AND employee_id = ?",
      [id, employeeId],
    );
    return result;
  },
};

module.exports = SalaryInformation;
