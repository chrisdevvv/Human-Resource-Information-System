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
      typeof filters.civilStatus === "string"
        ? filters.civilStatus.trim()
        : "";
    const sex = typeof filters.sex === "string" ? filters.sex.trim() : "";
    const employeeType =
      typeof filters.employeeType === "string"
        ? filters.employeeType.trim()
        : "";
    const letter =
      typeof filters.letter === "string" ? filters.letter.trim() : "";
    const sortOrder =
      String(filters.sortOrder || "DESC").toUpperCase() === "ASC"
        ? "ASC"
        : "DESC";

    const whereParts = [];
    const params = [];

    if (search) {
      const like = `%${search}%`;
      whereParts.push(`
        (
          firstName LIKE ? OR
          lastName LIKE ? OR
          middleName LIKE ? OR
          middle_initial LIKE ? OR
          email LIKE ? OR
          district LIKE ? OR
          school LIKE ? OR
          place LIKE ? OR
          civilStatus LIKE ? OR
          gender LIKE ? OR
          teacher_status LIKE ?
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
      );
    }

    if (district) {
      whereParts.push("district = ?");
      params.push(district);
    }

    if (school) {
      whereParts.push("school = ?");
      params.push(school);
    }

    if (civilStatus) {
      whereParts.push("civilStatus = ?");
      params.push(civilStatus);
    }

    if (sex) {
      whereParts.push("gender = ?");
      params.push(sex);
    }

    if (employeeType) {
      whereParts.push("teacher_status = ?");
      params.push(employeeType);
    }

    if (letter) {
      whereParts.push("firstName LIKE ?");
      params.push(`${letter}%`);
    }

    const whereClause =
      whereParts.length > 0 ? `WHERE ${whereParts.join(" AND ")}` : "";

    const [[{ total }]] = await pool.query(
      `
      SELECT COUNT(*) AS total
      FROM emppersonalinfo
      ${whereClause}
      `,
      params,
    );

    const [rows] = await pool.query(
      `
      SELECT
        id,
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
      FROM emppersonalinfo
      ${whereClause}
      ORDER BY firstName ${sortOrder}
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
        id,
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
      FROM emppersonalinfo
      WHERE id = ?
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