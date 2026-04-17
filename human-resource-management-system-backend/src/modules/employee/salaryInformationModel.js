const pool = require("../../config/db");

const THREE_YEAR_INTERVAL = 3;
const DEFAULT_AUTO_REMARK = "Step Increment";
const INCREMENT_MODE_AUTO = "AUTO";
const INCREMENT_MODE_MANUAL = "MANUAL";
const hasOwn = (obj, key) =>
  Object.prototype.hasOwnProperty.call(obj || {}, key);
const hasProvidedIncrement = (payload = {}) =>
  hasOwn(payload, "increment") || hasOwn(payload, "increment_amount");
const getProvidedIncrementValue = (payload = {}) => {
  if (hasOwn(payload, "increment") && payload.increment !== undefined) {
    return payload.increment;
  }
  if (hasOwn(payload, "increment_amount")) {
    return payload.increment_amount;
  }
  if (hasOwn(payload, "increment")) {
    return payload.increment;
  }
  return undefined;
};

const toNumberOrNull = (value) => {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const toMoney = (value) => {
  const parsed = toNumberOrNull(value);
  const safe = parsed === null ? 0 : parsed;
  return Number(safe.toFixed(2));
};

const toNonNegativeMoneyDelta = (value) => Number(Math.max(0, value).toFixed(2));

const normalizeOptionalText = (value) => {
  if (value === undefined || value === null) return null;
  const normalized = String(value).trim();
  return normalized.length > 0 ? normalized : null;
};

const normalizeOptionalDate = (value) => {
  if (value === undefined || value === null || value === "") return null;

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  const normalized = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return normalized;
  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10);
};

const addYearsToIsoDate = (isoDate, years) => {
  const base = normalizeOptionalDate(isoDate);
  if (!base) return null;

  const [year, month, day] = base.split("-").map(Number);
  if (!year || !month || !day) return null;

  // Keep month/day stable when possible, clamp for leap-year edge cases.
  const next = new Date(Date.UTC(year + years, month - 1, day));
  if (next.getUTCMonth() !== month - 1) {
    next.setUTCDate(0);
  }

  return next.toISOString().slice(0, 10);
};

const SalaryInformation = {
  getByEmployeeId: async (employeeId, filters = {}) => {
    const page = Number(filters.page) || null;
    const pageSize = Math.min(Number(filters.pageSize) || 25, 200);
    const sortOrder =
      String(filters.sortOrder || "asc").toLowerCase() === "desc"
        ? "DESC"
        : "ASC";

    const baseFrom = "FROM salary_information WHERE employee_id = ?";
    const baseParams = [employeeId];

    if (!page) {
      const [rows] = await pool.promise().query(
        `SELECT id, employee_id, DATE_FORMAT(salary_date, '%Y-%m-%d') AS salary_date, plantilla, sg, step, salary, increment_amount, increment_mode, remarks, created_at, updated_at ${baseFrom} ORDER BY salary_date ${sortOrder}, id ${sortOrder}`,
        baseParams,
      );
      return rows;
    }

    const offset = (page - 1) * pageSize;
    const [[{ total }]] = await pool
      .promise()
      .query(`SELECT COUNT(1) AS total ${baseFrom}`, baseParams);

    const [rows] = await pool.promise().query(
      `SELECT id, employee_id, DATE_FORMAT(salary_date, '%Y-%m-%d') AS salary_date, plantilla, sg, step, salary, increment_amount, increment_mode, remarks, created_at, updated_at ${baseFrom} ORDER BY salary_date ${sortOrder}, id ${sortOrder} LIMIT ? OFFSET ?`,
      [...baseParams, pageSize, offset],
    );

    return { data: rows, total: Number(total), page, pageSize };
  },

  getById: async (employeeId, id) => {
    const [rows] = await pool.promise().query(
      `SELECT id, employee_id, DATE_FORMAT(salary_date, '%Y-%m-%d') AS salary_date, plantilla, sg, step, salary, increment_amount, increment_mode, remarks, created_at, updated_at
       FROM salary_information
       WHERE id = ? AND employee_id = ?
       LIMIT 1`,
      [id, employeeId],
    );
    return rows[0] || null;
  },

  create: async (employeeId, payload) => {
    const normalizedSalaryDate = normalizeOptionalDate(payload.date);
    const normalizedSalary = toMoney(payload.salary);
    const providedIncrement = getProvidedIncrementValue(payload);
    const hasManualIncrement =
      providedIncrement !== undefined &&
      providedIncrement !== null &&
      providedIncrement !== "";
    const normalizedIncrement = hasManualIncrement ? toMoney(providedIncrement) : 0;
    const incrementMode = hasManualIncrement
      ? INCREMENT_MODE_MANUAL
      : INCREMENT_MODE_AUTO;

    const [result] = await pool.promise().query(
      `INSERT INTO salary_information
       (employee_id, salary_date, plantilla, sg, step, salary, increment_amount, increment_mode, remarks)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        employeeId,
        normalizedSalaryDate,
        normalizeOptionalText(payload.plantilla),
        normalizeOptionalText(payload.sg),
        normalizeOptionalText(payload.step),
        normalizedSalary,
        normalizedIncrement,
        incrementMode,
        normalizeOptionalText(payload.remarks),
      ],
    );

    await SalaryInformation.recomputeEmployeeIncrements(employeeId);

    return SalaryInformation.getById(employeeId, result.insertId);
  },

  update: async (employeeId, id, payload) => {
    const existing = await SalaryInformation.getById(employeeId, id);
    if (!existing) {
      return null;
    }

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
      params.push(toMoney(payload.salary));
    }
    if (hasProvidedIncrement(payload)) {
      const normalizedIncrement = toNumberOrNull(getProvidedIncrementValue(payload));

      if (normalizedIncrement === null) {
        fields.push("increment_amount = ?");
        params.push(0);
        fields.push("increment_mode = ?");
        params.push(INCREMENT_MODE_AUTO);
      } else {
        fields.push("increment_amount = ?");
        params.push(toMoney(normalizedIncrement));
        fields.push("increment_mode = ?");
        params.push(INCREMENT_MODE_MANUAL);
      }
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

    await SalaryInformation.recomputeEmployeeIncrements(employeeId);

    return SalaryInformation.getById(employeeId, id);
  },

  delete: async (employeeId, id) => {
    const [result] = await pool.promise().query(
      "DELETE FROM salary_information WHERE id = ? AND employee_id = ?",
      [id, employeeId],
    );

    if (result.affectedRows > 0) {
      await SalaryInformation.recomputeEmployeeIncrements(employeeId);
    }

    return result;
  },

  recomputeEmployeeIncrements: async (employeeId) => {
    const [rows] = await pool.promise().query(
      `SELECT id, salary, increment_amount, increment_mode
       FROM salary_information
       WHERE employee_id = ?
       ORDER BY salary_date ASC, id ASC`,
      [employeeId],
    );

    let previousSalary = null;
    let updated = 0;

    for (const row of rows) {
      const currentSalary = toMoney(row.salary);
      const computedIncrement =
        previousSalary === null
          ? 0
          : toNonNegativeMoneyDelta(currentSalary - previousSalary);
      const isManualMode =
        String(row.increment_mode || INCREMENT_MODE_AUTO).toUpperCase() ===
        INCREMENT_MODE_MANUAL;

      if (isManualMode) {
        previousSalary = currentSalary;
        continue;
      }

      const storedIncrement = toNumberOrNull(row.increment_amount);
      const needsUpdate =
        storedIncrement === null ||
        Math.abs(Number(storedIncrement) - Number(computedIncrement)) > 0.0001;

      if (needsUpdate) {
        await pool
          .promise()
          .query("UPDATE salary_information SET increment_amount = ? WHERE id = ?", [
            computedIncrement,
            row.id,
          ]);
        updated += 1;
      }

      previousSalary = currentSalary;
    }

    return { employeeId: Number(employeeId), total: rows.length, updated };
  },

  syncThreeYearSalaryDateEntries: async (options = {}) => {
    const todayIso =
      normalizeOptionalDate(options.today) || new Date().toISOString().slice(0, 10);

    const [latestPerEmployeeRows] = await pool.promise().query(
      `SELECT
         si.employee_id,
        DATE_FORMAT(si.salary_date, '%Y-%m-%d') AS salary_date,
         si.plantilla,
         si.sg,
         si.step,
         si.salary,
         si.increment_amount
       FROM salary_information si
       JOIN employees e ON e.id = si.employee_id
       WHERE COALESCE(e.is_archived, 0) = 0
         AND si.id = (
           SELECT si2.id
           FROM salary_information si2
           WHERE si2.employee_id = si.employee_id
           ORDER BY si2.salary_date DESC, si2.id DESC
           LIMIT 1
         )`,
    );

    let generated = 0;
    const touchedEmployeeIds = new Set();

    for (const row of latestPerEmployeeRows) {
      let cursorDate = normalizeOptionalDate(row.salary_date);
      if (!cursorDate) continue;

      while (true) {
        const nextDate = addYearsToIsoDate(cursorDate, THREE_YEAR_INTERVAL);
        if (!nextDate || nextDate > todayIso) {
          break;
        }

        const [existingRows] = await pool.promise().query(
          `SELECT id
           FROM salary_information
           WHERE employee_id = ? AND salary_date = ?
           LIMIT 1`,
          [row.employee_id, nextDate],
        );

        if (existingRows.length > 0) {
          cursorDate = nextDate;
          continue;
        }

        await pool.promise().query(
          `INSERT INTO salary_information
           (employee_id, salary_date, plantilla, sg, step, salary, increment_amount, increment_mode, remarks)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            row.employee_id,
            nextDate,
            normalizeOptionalText(row.plantilla),
            normalizeOptionalText(row.sg),
            normalizeOptionalText(row.step),
            toMoney(row.salary),
            0,
            INCREMENT_MODE_AUTO,
            DEFAULT_AUTO_REMARK,
          ],
        );

        generated += 1;
        touchedEmployeeIds.add(Number(row.employee_id));
        cursorDate = nextDate;
      }
    }

    for (const employeeId of touchedEmployeeIds) {
      await SalaryInformation.recomputeEmployeeIncrements(employeeId);
    }

    return {
      employeesChecked: latestPerEmployeeRows.length,
      generated,
      asOfDate: todayIso,
    };
  },
};

module.exports = SalaryInformation;
