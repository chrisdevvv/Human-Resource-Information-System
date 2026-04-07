const pool = require("../../config/db");

// Simple in-memory cache with TTL for frequently accessed logs
const queryCache = new Map();
const CACHE_TTL = 30000; // 30 seconds

const getCacheKey = (key) => queryCache.get(key);
const setCacheValue = (key, value) => {
  queryCache.set(key, { data: value, timestamp: Date.now() });
  setTimeout(() => queryCache.delete(key), CACHE_TTL);
};
const isCacheFresh = (key) => {
  const cached = queryCache.get(key);
  return cached && Date.now() - cached.timestamp < CACHE_TTL;
};

const Backlog = {
  // Supports optional pagination and filtering. If pagination not provided, returns all rows (backwards compatible).
  // Also applies filtering by is_archived by default for better performance
  getAll: async (pagination, options = {}) => {
    const includeArchived = options.includeArchived || false; // Default to NOT including archived (optimization)
    
    // Build cache key for read operations
    const cacheKey = `getAll_${pagination?.page || 'all'}_${pagination?.pageSize || 'all'}_${includeArchived}`;
    if (isCacheFresh(cacheKey)) {
      const cached = getCacheKey(cacheKey);
      return cached?.data;
    }

    // Select only necessary columns to reduce data transfer and improve join performance
    const selectColumns = `
      backlogs.id,
      backlogs.user_id,
      backlogs.school_id,
      backlogs.employee_id,
      backlogs.leave_id,
      backlogs.action,
      backlogs.details,
      backlogs.created_at,
      backlogs.is_archived,
      users.first_name,
      users.last_name,
      users.role,
      users.email,
      schools.school_name
    `;
    
    const baseQuery = `FROM backlogs 
      LEFT JOIN users ON backlogs.user_id = users.id 
      LEFT JOIN schools ON users.school_id = schools.id`;
    
    // Use composite index (is_archived, created_at DESC) for better query performance
    const whereClause = !includeArchived 
      ? "WHERE backlogs.is_archived = 0" 
      : "";

    if (!pagination || !pagination.page) {
      const [rows] = await pool
        .promise()
        .query(
          `SELECT ${selectColumns} ${baseQuery} ${whereClause} ORDER BY backlogs.created_at DESC LIMIT 500`,
        );
      
      setCacheValue(cacheKey, rows);
      return rows;
    }

    const page = Number(pagination.page) || 1;
    const pageSize = Math.min(Number(pagination.pageSize) || 25, 200);
    const offset = (page - 1) * pageSize;

    // Optimized pagination: use LIMIT clause early to reduce rows examined
    const [[{ total }]] = await pool
      .promise()
      .query(`SELECT COUNT(1) as total ${baseQuery} ${whereClause}`);

    const [rows] = await pool
      .promise()
      .query(
        `SELECT ${selectColumns} ${baseQuery} ${whereClause} ORDER BY backlogs.created_at DESC LIMIT ? OFFSET ?`,
        [pageSize, offset],
      );

    const result = { data: rows, total: Number(total), page, pageSize };
    setCacheValue(cacheKey, result);
    return result;
  },

  getById: async (id) => {
    const cacheKey = `getById_${id}`;
    if (isCacheFresh(cacheKey)) {
      const cached = getCacheKey(cacheKey);
      return cached?.data;
    }

    const selectColumns = `
      backlogs.id,
      backlogs.user_id,
      backlogs.school_id,
      backlogs.employee_id,
      backlogs.leave_id,
      backlogs.action,
      backlogs.details,
      backlogs.created_at,
      backlogs.is_archived,
      users.first_name,
      users.last_name,
      users.role,
      users.email,
      schools.school_name
    `;
    
    const [rows] = await pool.promise().query(
      `SELECT ${selectColumns}
       FROM backlogs
       LEFT JOIN users ON backlogs.user_id = users.id
       LEFT JOIN schools ON users.school_id = schools.id
       WHERE backlogs.id = ?`,
      [id],
    );
    
    const result = rows[0];
    if (result) setCacheValue(cacheKey, result);
    return result;
  },

  create: async (data) => {
    const { user_id, school_id, employee_id, leave_id, action, details } = data;
    const [result] = await pool
      .promise()
      .query(
        "INSERT INTO backlogs (user_id, school_id, employee_id, leave_id, action, details) VALUES (?, ?, ?, ?, ?, ?)",
        [user_id, school_id, employee_id, leave_id, action, details],
      );
    
    // Invalidate relevant caches when new log is created
    queryCache.clear();
    
    return result;
  },

  record: async (data) => {
    if (!data || !data.action) {
      throw new Error("Backlog action is required");
    }

    return Backlog.create({
      user_id: data.user_id || null,
      school_id: data.school_id || null,
      employee_id: data.employee_id || null,
      leave_id: data.leave_id || null,
      action: String(data.action).trim(),
      details: data.details ? String(data.details).trim() : null,
    });
  },

  getByUser: async (user_id) => {
    // Use index on user_id; limit results for performance
    const [rows] = await pool
      .promise()
      .query(
        "SELECT id, user_id, action, details, created_at, is_archived FROM backlogs WHERE user_id = ? AND is_archived = 0 ORDER BY created_at DESC LIMIT 100",
        [user_id],
      );
    return rows;
  },

  getBySchool: async (school_id) => {
    // Use index on school_id; limit results for performance
    const [rows] = await pool
      .promise()
      .query(
        "SELECT id, school_id, action, details, created_at, is_archived FROM backlogs WHERE school_id = ? AND is_archived = 0 ORDER BY created_at DESC LIMIT 100",
        [school_id],
      );
    return rows;
  },

  getReport: async (filters = {}) => {
    const whereParts = [];
    const params = [];

    if (!filters.includeArchived) {
      whereParts.push("backlogs.is_archived = 0");
    }

    // Apply date range filters first (uses created_at index)
    if (filters.from) {
      whereParts.push("backlogs.created_at >= ?");
      params.push(filters.from);
    }

    if (filters.to) {
      whereParts.push("backlogs.created_at <= ?");
      params.push(filters.to);
    }

    if (filters.action) {
      whereParts.push("backlogs.action = ?");
      params.push(filters.action);
    }

    if (filters.userId) {
      whereParts.push("backlogs.user_id = ?");
      params.push(filters.userId);
    }

    if (filters.schoolId) {
      whereParts.push("backlogs.school_id = ?");
      params.push(filters.schoolId);
    }

    if (filters.employeeId) {
      whereParts.push("backlogs.employee_id = ?");
      params.push(filters.employeeId);
    }

    if (filters.leaveId) {
      whereParts.push("backlogs.leave_id = ?");
      params.push(filters.leaveId);
    }

    const whereClause = whereParts.length
      ? `WHERE ${whereParts.join(" AND ")}`
      : "";

    // Select only necessary columns to reduce memory footprint for reports
    const selectColumns = `
      backlogs.id,
      backlogs.user_id,
      backlogs.school_id,
      backlogs.employee_id,
      backlogs.leave_id,
      backlogs.action,
      backlogs.details,
      backlogs.created_at,
      backlogs.is_archived,
      users.first_name,
      users.last_name,
      users.role,
      users.email,
      schools.school_name
    `;

    const [rows] = await pool.promise().query(
      `SELECT ${selectColumns}
       FROM backlogs
       LEFT JOIN users ON backlogs.user_id = users.id
       LEFT JOIN schools ON users.school_id = schools.id
       ${whereClause}
       ORDER BY backlogs.created_at DESC
       LIMIT 10000`,
      params,
    );

    return rows;
  },

  archiveByDateRange: async ({ from, to }) => {
    const [result] = await pool.promise().query(
      `UPDATE backlogs
         SET is_archived = 1
         WHERE is_archived = 0
           AND created_at >= ?
           AND created_at <= ?`,
      [from, to],
    );

    return {
      affectedRows: Number(result.affectedRows || 0),
    };
  },

  archiveByIds: async ({ ids }) => {
    if (!Array.isArray(ids) || ids.length === 0) {
      return { affectedRows: 0 };
    }

    const [result] = await pool.promise().query(
      `UPDATE backlogs
         SET is_archived = 1
         WHERE is_archived = 0
           AND id IN (?)`,
      [ids],
    );

    return {
      affectedRows: Number(result.affectedRows || 0),
    };
  },
};

module.exports = Backlog;
