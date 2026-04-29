const pool = require("../../config/dbcsjdm").promise();

const normalizeOptionalText = (value) => {
  if (value === undefined || value === null) return null;
  const normalized = String(value).trim();
  return normalized.length > 0 ? normalized : null;
};

const normalizeOptionalEmail = (value) => {
  if (value === undefined || value === null) return null;
  const normalized = String(value).trim().toLowerCase();
  return normalized.length > 0 ? normalized : null;
};

const normalizeEmployeeType = (value) => {
  if (value === undefined || value === null) return null;
  const normalized = String(value)
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, "-");
  return normalized.length > 0 ? normalized : null;
};

const normalizeDateForStorage = (value) => {
  if (value === undefined || value === null) return null;

  const normalized = String(value).trim();
  if (!normalized) return null;

  const isoMatch = normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    const [, yyyy, mm, dd] = isoMatch;
    return `${mm}/${dd}/${yyyy}`;
  }

  const slashMatch = normalized.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (slashMatch) {
    return normalized;
  }

  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) return null;

  const mm = String(parsed.getMonth() + 1).padStart(2, "0");
  const dd = String(parsed.getDate()).padStart(2, "0");
  const yyyy = parsed.getFullYear();

  return `${mm}/${dd}/${yyyy}`;
};

const EService = {
  getAll: async (filters = {}) => {
    const page = Number(filters.page) || 1;
    const pageSize = Math.min(Number(filters.pageSize) || 10, 200);
    const offset = (page - 1) * pageSize;

    const search =
      typeof filters.search === "string" ? filters.search.trim() : "";
    const district =
      typeof filters.district === "string" ? filters.district.trim() : "";
    const school =
      typeof filters.school === "string" ? filters.school.trim() : "";
    const civilStatus =
      typeof filters.civilStatus === "string" ? filters.civilStatus.trim() : "";
    const sex = typeof filters.sex === "string" ? filters.sex.trim() : "";
    const employeeType =
      typeof filters.employeeType === "string"
        ? normalizeEmployeeType(filters.employeeType)
        : "";
    const retirementStatus =
      typeof filters.retirementStatus === "string"
        ? filters.retirementStatus.trim().toLowerCase()
        : "";
    const letter =
      typeof filters.letter === "string" ? filters.letter.trim() : "";
    const sortOrder =
      String(filters.sortOrder || "DESC").toUpperCase() === "ASC"
        ? "ASC"
        : "DESC";

    const whereParts = [];
    const params = [];

    // Employee Profile tab should only show active records.
    whereParts.push("COALESCE(e.is_archived, 0) = 0");

    if (search) {
      const like = `%${search}%`;
      whereParts.push(`
        (
          e.firstName LIKE ? OR
          e.lastName LIKE ? OR
          e.middleName LIKE ? OR
          e.middle_initial LIKE ? OR
          e.email LIKE ? OR
          e.district LIKE ? OR
          e.school LIKE ? OR
          e.place LIKE ? OR
          e.civilStatus LIKE ? OR
          e.gender LIKE ? OR
          e.teacher_status LIKE ? OR
          COALESCE(wi.current_employee_type, wi.employee_type) LIKE ?
        )
      `);
      params.push(
        like,
        like,
        like,
        like,
        like,
        like,
        like,
        like,
        like,
        like,
        like,
        like,
      );
    }

    if (district) {
      whereParts.push("e.district = ?");
      params.push(district);
    }

    if (school) {
      whereParts.push("e.school = ?");
      params.push(school);
    }

    if (civilStatus) {
      whereParts.push("e.civilStatus = ?");
      params.push(civilStatus);
    }

    if (sex) {
      whereParts.push("e.gender = ?");
      params.push(sex);
    }

    if (employeeType) {
      whereParts.push(
        "LOWER(REPLACE(REPLACE(COALESCE(wi.current_employee_type, wi.employee_type), '_', '-'), ' ', '-')) = ?",
      );
      params.push(employeeType);
    }

    if (retirementStatus) {
      const ageExpression =
        "TIMESTAMPDIFF(YEAR, STR_TO_DATE(e.dateOfBirth, '%m/%d/%Y'), CURDATE())";

      if (retirementStatus === "retirable") {
        whereParts.push(`(${ageExpression} >= 55 AND ${ageExpression} < 61)`);
      } else if (retirementStatus === "mandatory") {
        whereParts.push(`(${ageExpression} >= 61)`);
      }
    }

    if (letter) {
      whereParts.push("e.firstName LIKE ?");
      params.push(`${letter}%`);
    }

    const whereClause =
      whereParts.length > 0 ? `WHERE ${whereParts.join(" AND ")}` : "";

    const [[{ total }]] = await pool.query(
      `
      SELECT COUNT(*) AS total
      FROM emppersonalinfo e
      LEFT JOIN work_information wi ON wi.employee_id = e.id
      ${whereClause}
      `,
      params,
    );

    const [rows] = await pool.query(
      `
      SELECT
        e.id,
        e.firstName,
        e.lastName,
        e.middleName,
        e.middle_initial,
        e.MISR,
        e.email,
        e.dateOfBirth,
        e.place,
        e.district,
        e.school,
        e.gender,
        e.civilStatus,
        e.teacher_status,
        COALESCE(wi.current_employee_type, wi.employee_type) AS employee_type
      FROM emppersonalinfo e
      LEFT JOIN work_information wi ON wi.employee_id = e.id
      ${whereClause}
      ORDER BY e.firstName ${sortOrder}
      LIMIT ? OFFSET ?
      `,
      [...params, pageSize, offset],
    );

    return {
      data: rows,
      total: Number(total),
      page,
      pageSize,
    };
  },

  getRetirementCounts: async () => {
    const [[{ retirable, mandatory }]] = await pool.query(
      `SELECT
        SUM(CASE WHEN age >= 55 AND age < 61 THEN 1 ELSE 0 END) AS retirable,
        SUM(CASE WHEN age >= 61 THEN 1 ELSE 0 END) AS mandatory
       FROM (
         SELECT
           TIMESTAMPDIFF(YEAR,
             STR_TO_DATE(dateOfBirth, '%m/%d/%Y'),
             CURDATE()
           ) AS age
         FROM emppersonalinfo
         WHERE dateOfBirth IS NOT NULL AND TRIM(dateOfBirth) <> ''
       ) AS ages`,
    );
    return {
      retirable: Number(retirable || 0),
      mandatory: Number(mandatory || 0),
    };
  },

  getCount: async () => {
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM emppersonalinfo`,
    );
    return Number(total);
  },

  getById: async (id) => {
    const [rows] = await pool.query(
      `
      SELECT
        e.id,
        e.firstName,
        e.lastName,
        e.middleName,
        e.middle_initial,
        e.MISR,
        e.email,
        e.dateOfBirth,
        e.place,
        e.district,
        e.school,
        e.gender,
        e.civilStatus,
        e.teacher_status,
        COALESCE(wi.current_employee_type, wi.employee_type) AS employee_type
      FROM emppersonalinfo e
      LEFT JOIN work_information wi ON wi.employee_id = e.id
      WHERE e.id = ?
      LIMIT 1
      `,
      [id],
    );

    return rows[0];
  },

  create: async (data) => {
    const firstName = normalizeOptionalText(data.firstName);
    const lastName = normalizeOptionalText(data.lastName);
    const middleName = normalizeOptionalText(data.middleName);
    const middle_initial = normalizeOptionalText(data.middle_initial);
    const MISR = normalizeOptionalText(data.MISR);
    const email = normalizeOptionalEmail(data.email);
    const dateOfBirth = normalizeDateForStorage(data.dateOfBirth);
    const place = normalizeOptionalText(data.place);
    const district = normalizeOptionalText(data.district);
    const school = normalizeOptionalText(data.school);
    const gender = normalizeOptionalText(data.gender);
    const civilStatus = normalizeOptionalText(data.civilStatus);
    const teacher_status =
      normalizeOptionalText(data.teacher_status) || "Active";

    const [result] = await pool.query(
      `
      INSERT INTO emppersonalinfo (
        firstName,
        lastName,
        middleName,
        middle_initial,
        MISR,
        email,
        dateOfBirth,
        place,
        district,
        school,
        gender,
        civilStatus,
        teacher_status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        firstName,
        lastName,
        middleName,
        middle_initial,
        MISR,
        email,
        dateOfBirth,
        place,
        district,
        school,
        gender,
        civilStatus,
        teacher_status,
      ],
    );

    return result;
  },

  update: async (id, data) => {
    const firstName = normalizeOptionalText(data.firstName);
    const lastName = normalizeOptionalText(data.lastName);
    const middleName = normalizeOptionalText(data.middleName);
    const middle_initial = normalizeOptionalText(data.middle_initial);
    const MISR = normalizeOptionalText(data.MISR);
    const email = normalizeOptionalEmail(data.email);
    const dateOfBirth = normalizeDateForStorage(data.dateOfBirth);
    const place = normalizeOptionalText(data.place);
    const district = normalizeOptionalText(data.district);
    const school = normalizeOptionalText(data.school);
    const gender = normalizeOptionalText(data.gender);
    const civilStatus = normalizeOptionalText(data.civilStatus);
    const teacher_status =
      normalizeOptionalText(data.teacher_status) || "Active";

    const [result] = await pool.query(
      `
      UPDATE emppersonalinfo SET
        firstName = ?,
        lastName = ?,
        middleName = ?,
        middle_initial = ?,
        MISR = ?,
        email = ?,
        dateOfBirth = ?,
        place = ?,
        district = ?,
        school = ?,
        gender = ?,
        civilStatus = ?,
        teacher_status = ?
      WHERE id = ?
      `,
      [
        firstName,
        lastName,
        middleName,
        middle_initial,
        MISR,
        email,
        dateOfBirth,
        place,
        district,
        school,
        gender,
        civilStatus,
        teacher_status,
        id,
      ],
    );

    return result;
  },

  delete: async (id) => {
    const [result] = await pool.query(
      `DELETE FROM emppersonalinfo WHERE id = ?`,
      [id],
    );
    return result;
  },

  getDistricts: async () => {
    const [rows] = await pool.query(`
            SELECT
            districtId,
            districtName,
            status
            FROM districts
            WHERE status != 0
            ORDER BY districtName ASC
        `);

    return rows;
  },

  getSchools: async (district = null) => {
    const normalizedDistrict = normalizeOptionalText(district);

    if (normalizedDistrict) {
      const [rows] = await pool.query(
        `
        SELECT DISTINCT
          school AS name,
          district
        FROM emppersonalinfo
        WHERE school IS NOT NULL
          AND TRIM(school) <> ''
          AND district = ?
        ORDER BY school ASC
        `,
        [normalizedDistrict],
      );

      return rows.map((row, index) => ({
        id: index + 1,
        name: row.name,
        district: row.district,
      }));
    }

    const [rows] = await pool.query(
      `
      SELECT DISTINCT
        school AS name,
        district
      FROM emppersonalinfo
      WHERE school IS NOT NULL
        AND TRIM(school) <> ''
      ORDER BY school ASC
      `,
    );

    return rows.map((row, index) => ({
      id: index + 1,
      name: row.name,
      district: row.district,
    }));
  },
};

module.exports = EService;
