const Backlog = require("./backlogModel");
const PDFDocument = require("pdfkit");

const toBoolean = (v) => {
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v === 1;
  if (typeof v !== "string") return false;
  const normalized = v.trim().toLowerCase();
  return ["1", "true", "yes", "y", "on"].includes(normalized);
};

const toIsoDateOnly = (value) => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      return null;
    }
    return value.toISOString().slice(0, 10);
  }

  const raw = String(value).trim();
  if (!raw) {
    return null;
  }

  const isoMatch = raw.match(/^(\d{4}-\d{2}-\d{2})/);
  if (isoMatch) {
    return isoMatch[1];
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString().slice(0, 10);
};

const toDateTimeBoundary = (value, boundary) => {
  const isoDate = toIsoDateOnly(value);
  if (!isoDate) {
    return null;
  }

  return `${isoDate} ${boundary === "start" ? "00:00:00" : "23:59:59"}`;
};

const toCsvCell = (value) => {
  if (value === null || value === undefined) return "";
  const text = String(value);
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
};

const buildCsv = (rows) => {
  const headers = [
    "id",
    "created_at",
    "action",
    "details",
    "user_id",
    "user_name",
    "user_role",
    "email",
    "school_id",
    "school_name",
    "employee_id",
    "leave_id",
    "is_archived",
  ];

  const lines = [headers.join(",")];

  for (const row of rows) {
    const userName = [row.first_name, row.last_name].filter(Boolean).join(" ");
    const values = [
      row.id,
      row.created_at,
      row.action,
      row.details,
      row.user_id,
      userName,
      row.role,
      row.email,
      row.school_id,
      row.school_name,
      row.employee_id,
      row.leave_id,
      row.is_archived,
    ];

    lines.push(values.map(toCsvCell).join(","));
  }

  return `${lines.join("\n")}\n`;
};

const drawPdfPageHeader = (doc, filters = {}) => {
  doc
    .fontSize(16)
    .text("Backlog Report", { align: "left" })
    .moveDown(0.3)
    .fontSize(9)
    .fillColor("#555");

  const filterText = [
    `From: ${filters.from || "-"}`,
    `To: ${filters.to || "-"}`,
    `Action: ${filters.action || "-"}`,
    `Include Archived: ${filters.include_archived ? "Yes" : "No"}`,
  ].join(" | ");

  doc.text(filterText).moveDown(0.7).fillColor("black");
};

const ensurePdfRowSpace = (doc, minY = 740) => {
  if (doc.y > minY) {
    doc.addPage();
  }
};

const buildPdfBuffer = (rows, filters = {}) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: "A4" });
      const chunks = [];

      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      drawPdfPageHeader(doc, filters);

      doc
        .fontSize(9)
        .text("ID", 40)
        .text("Date", 75)
        .text("Action", 180)
        .text("User", 320)
        .text("School", 430)
        .text("Archived", 530)
        .moveDown(0.4);

      doc.moveTo(40, doc.y).lineTo(555, doc.y).strokeColor("#aaa").stroke();
      doc.moveDown(0.4).strokeColor("black");

      if (rows.length === 0) {
        doc.fontSize(10).text("No logs found for the selected filters.");
      } else {
        for (const row of rows) {
          ensurePdfRowSpace(doc);

          const userName =
            [row.first_name, row.last_name].filter(Boolean).join(" ") || "-";
          const createdAt = row.created_at
            ? String(row.created_at).slice(0, 19).replace("T", " ")
            : "-";

          doc
            .fontSize(8)
            .text(String(row.id || "-"), 40)
            .text(createdAt, 75)
            .text(String(row.action || "-"), 180, doc.y - 12, {
              width: 130,
              ellipsis: true,
            })
            .text(userName, 320, doc.y - 12, {
              width: 100,
              ellipsis: true,
            })
            .text(String(row.school_name || "-"), 430, doc.y - 12, {
              width: 90,
              ellipsis: true,
            })
            .text(row.is_archived ? "Yes" : "No", 530, doc.y - 12)
            .moveDown(0.2);

          if (row.details) {
            ensurePdfRowSpace(doc);
            doc
              .fontSize(7)
              .fillColor("#555")
              .text(`Details: ${String(row.details)}`, 75, doc.y, {
                width: 450,
              })
              .fillColor("black")
              .moveDown(0.5);
          }

          doc
            .moveTo(40, doc.y)
            .lineTo(555, doc.y)
            .strokeColor("#eee")
            .stroke()
            .moveDown(0.3)
            .strokeColor("black");
        }
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

const getAllBacklogs = async (req, res) => {
  try {
    const { page, pageSize } = req.query;
    const onlyArchived = req.query.only_archived
      ? toBoolean(req.query.only_archived)
      : false;
    // Default to NOT including archived logs for better performance.
    const includeArchived = onlyArchived
      ? true
      : req.query.include_archived
        ? toBoolean(req.query.include_archived)
        : false;
    const fromDateTime = toDateTimeBoundary(req.query.from, "start");
    const toDateTime = toDateTimeBoundary(req.query.to, "end");
    const pagination = page
      ? { page: Number(page), pageSize: Number(pageSize || 25) }
      : undefined;
    const results = await Backlog.getAll(pagination, {
      includeArchived,
      onlyArchived,
      search: req.query.search || null,
      role: req.query.role || null,
      schoolId: req.query.school_id ? Number(req.query.school_id) : null,
      letter: req.query.letter || null,
      sortMode: req.query.sortMode || null,
      from: fromDateTime,
      to: toDateTime,
    });

    if (!pagination) return res.status(200).json({ data: results });
    return res.status(200).json({
      data: results.data,
      total: results.total,
      page: results.page,
      pageSize: results.pageSize,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error retrieving backlogs", error: err.message });
  }
};

const archiveBacklogsByDateRange = async (req, res) => {
  try {
    const fromDate = toIsoDateOnly(req.body.from);
    const toDate = toIsoDateOnly(req.body.to);

    const from = fromDate ? new Date(`${fromDate}T00:00:00Z`) : new Date(NaN);
    const to = toDate ? new Date(`${toDate}T00:00:00Z`) : new Date(NaN);

    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
      return res.status(400).json({ message: "Invalid archive date range." });
    }

    if (to < from) {
      return res
        .status(400)
        .json({ message: "'to' date must be on or after 'from' date." });
    }

    const fromDateTime = `${fromDate} 00:00:00`;
    const toDateTime = `${toDate} 23:59:59`;

    const search =
      typeof req.body.search === "string" ? req.body.search.trim() : "";
    const role = typeof req.body.role === "string" ? req.body.role.trim() : "";
    const letter =
      typeof req.body.letter === "string"
        ? req.body.letter.trim().toUpperCase()
        : "";

    const shouldUseFilterArchive = Boolean(search || role || letter);

    const archived = shouldUseFilterArchive
      ? await Backlog.archiveByFilters({
          from: fromDateTime,
          to: toDateTime,
          search: search || null,
          role: role || null,
          letter: letter || null,
        })
      : await Backlog.archiveByDateRange({
          from: fromDateTime,
          to: toDateTime,
        });

    return res.status(200).json({
      message: "Logs archived successfully.",
      data: {
        from: fromDate,
        to: toDate,
        archivedCount: archived.affectedRows,
        mode: shouldUseFilterArchive ? "filters" : "range",
      },
    });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Error archiving backlogs", error: err.message });
  }
};

const getBacklogById = async (req, res) => {
  try {
    const result = await Backlog.getById(req.params.id);
    if (!result) return res.status(404).json({ message: "Backlog not found" });
    res.status(200).json({ data: result });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error retrieving backlog", error: err.message });
  }
};

const getBacklogsByUser = async (req, res) => {
  try {
    const results = await Backlog.getByUser(req.params.user_id);
    res.status(200).json({ data: results });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error retrieving backlogs", error: err.message });
  }
};

const getBacklogsBySchool = async (req, res) => {
  try {
    const results = await Backlog.getBySchool(req.params.school_id);
    res.status(200).json({ data: results });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error retrieving backlogs", error: err.message });
  }
};

const createBacklog = async (req, res) => {
  try {
    const result = await Backlog.create(req.body);
    res
      .status(201)
      .json({ message: "Backlog created successfully", data: result });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error creating backlog", error: err.message });
  }
};

const generateBacklogReport = async (req, res) => {
  try {
    const format = (req.query.format || "json").toLowerCase();
    const onlyArchived = toBoolean(req.query.only_archived);
    const includeArchived = onlyArchived
      ? true
      : toBoolean(req.query.include_archived);
    const fromDate = toIsoDateOnly(req.query.from);
    const toDate = toIsoDateOnly(req.query.to);

    const from = fromDate ? `${fromDate} 00:00:00` : null;
    const to = toDate ? `${toDate} 23:59:59` : null;

    const rows = await Backlog.getReport({
      from,
      to,
      search: req.query.search || null,
      action: req.query.action || null,
      role: req.query.role || null,
      schoolId: req.query.school_id ? Number(req.query.school_id) : null,
      letter: req.query.letter || null,
      sortMode: req.query.sortMode || null,
      userId: req.query.user_id ? Number(req.query.user_id) : null,
      employeeId: req.query.employee_id ? Number(req.query.employee_id) : null,
      leaveId: req.query.leave_id ? Number(req.query.leave_id) : null,
      includeArchived,
      onlyArchived,
    });

    if (format === "csv") {
      const csvContent = buildCsv(rows);
      const dateSuffix = new Date().toISOString().slice(0, 10);
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=backlog-report-${dateSuffix}.csv`,
      );
      return res.status(200).send(csvContent);
    }

    if (format === "pdf") {
      const dateSuffix = new Date().toISOString().slice(0, 10);
      const pdfBuffer = await buildPdfBuffer(rows, {
        from: fromDate,
        to: toDate,
        action: req.query.action || null,
        role: req.query.role || null,
        schoolId: req.query.school_id ? Number(req.query.school_id) : null,
        letter: req.query.letter || null,
        include_archived: includeArchived,
        only_archived: onlyArchived,
      });

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=backlog-report-${dateSuffix}.pdf`,
      );
      return res.status(200).send(pdfBuffer);
    }

    return res.status(200).json({
      data: rows,
      total: rows.length,
      filters: {
        from: fromDate,
        to: toDate,
        search: req.query.search || null,
        action: req.query.action || null,
        role: req.query.role || null,
        letter: req.query.letter || null,
        sortMode: req.query.sortMode || null,
        user_id: req.query.user_id || null,
        school_id: req.query.school_id || null,
        employee_id: req.query.employee_id || null,
        leave_id: req.query.leave_id || null,
        include_archived: includeArchived,
        only_archived: onlyArchived,
      },
    });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Error generating backlog report", error: err.message });
  }
};

module.exports = {
  getAllBacklogs,
  getBacklogById,
  getBacklogsByUser,
  getBacklogsBySchool,
  createBacklog,
  generateBacklogReport,
  archiveBacklogsByDateRange,
};
