const EService = require("./eserviceModel");

const getAllEmployeePersonalInfo = async (req, res) => {
  try {
    const {
      search,
      district,
      school,
      civilStatus,
      sex,
      employeeType,
      retirementStatus,
      letter,
      sortOrder,
      page,
      pageSize,
    } = req.query;

    const filters = {
      search: search || null,
      district: district || null,
      school: school || null,
      civilStatus: civilStatus || null,
      sex: sex || null,
      employeeType: employeeType || null,
      retirementStatus: retirementStatus || null,
      letter: letter || null,
      sortOrder: sortOrder || "DESC",
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    };

    const results = await EService.getAll(filters);

    if (!filters.page) {
      return res.status(200).json({ data: results });
    }

    return res.status(200).json({
      data: results.data,
      total: results.total,
      page: results.page,
      pageSize: results.pageSize,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Error retrieving employee personal information",
      error: err.message,
    });
  }
};

const getEmployeePersonalInfoById = async (req, res) => {
  try {
    const result = await EService.getById(req.params.id);

    if (!result) {
      return res.status(404).json({
        message: "Employee personal information not found",
      });
    }

    return res.status(200).json({ data: result });
  } catch (err) {
    return res.status(500).json({
      message: "Error retrieving employee personal information",
      error: err.message,
    });
  }
};

const createEmployeePersonalInfo = async (req, res) => {
  try {
    const { firstName, lastName, district, school, gender, civilStatus } =
      req.body;

    if (!firstName || !String(firstName).trim()) {
      return res.status(400).json({
        message: "First name is required",
      });
    }

    if (!lastName || !String(lastName).trim()) {
      return res.status(400).json({
        message: "Last name is required",
      });
    }

    if (!district || !String(district).trim()) {
      return res.status(400).json({
        message: "District is required",
      });
    }

    if (!school || !String(school).trim()) {
      return res.status(400).json({
        message: "School is required",
      });
    }

    if (!gender || !String(gender).trim()) {
      return res.status(400).json({
        message: "Sex is required",
      });
    }

    if (!civilStatus || !String(civilStatus).trim()) {
      return res.status(400).json({
        message: "Civil status is required",
      });
    }

    const result = await EService.create(req.body);

    return res.status(201).json({
      message: "Employee personal information created successfully",
      data: result,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Error creating employee personal information",
      error: err.message,
    });
  }
};

const updateEmployeePersonalInfo = async (req, res) => {
  try {
    const existing = await EService.getById(req.params.id);

    if (!existing) {
      return res.status(404).json({
        message: "Employee personal information not found",
      });
    }

    const result = await EService.update(req.params.id, req.body);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Employee personal information not found",
      });
    }

    return res.status(200).json({
      message: "Employee personal information updated successfully",
      data: result,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Error updating employee personal information",
      error: err.message,
    });
  }
};

const deleteEmployeePersonalInfo = async (req, res) => {
  try {
    const existing = await EService.getById(req.params.id);

    if (!existing) {
      return res.status(404).json({
        message: "Employee personal information not found",
      });
    }

    const result = await EService.delete(req.params.id);

    return res.status(200).json({
      message: "Employee personal information deleted successfully",
      data: result,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Error deleting employee personal information",
      error: err.message,
    });
  }
};

const getRetirementCounts = async (req, res) => {
  try {
    const result = await EService.getRetirementCounts();
    return res.status(200).json({ data: result });
  } catch (err) {
    return res.status(500).json({
      message: "Error retrieving retirement counts",
      error: err.message,
    });
  }
};

const getEmployeePersonalInfoCount = async (req, res) => {
  try {
    const result = await EService.getCount();
    return res.status(200).json({ total: result });
  } catch (err) {
    return res.status(500).json({
      message: "Error retrieving employee count",
      error: err.message,
    });
  }
};

const getDistricts = async (req, res) => {
  try {
    const results = await EService.getDistricts();
    return res.status(200).json({ data: results });
  } catch (err) {
    console.error("[ESERVICE DISTRICTS ERROR]", err);
    return res.status(500).json({
      message: "Error retrieving districts",
      error: err.message,
    });
  }
};

const getSchools = async (req, res) => {
  try {
    const { district } = req.query;

    const results = await EService.getSchools(district || null);

    return res.status(200).json({ data: results });
  } catch (err) {
    return res.status(500).json({
      message: "Error retrieving schools",
      error: err.message,
    });
  }
};

const sendServiceRecord = async (req, res) => {
  try {
    const { reqEmail } = req.body || {};
    const requesterEmail = String(reqEmail || "").trim().toLowerCase();

    if (!requesterEmail) {
      return res.status(400).json({ message: "reqEmail is required" });
    }

    const isDepEdEmail = (email) => {
      if (!email) return false;
      return /@[^@\s]*deped[^@\s]*\.gov\.ph$/i.test(String(email).trim());
    };

    if (!isDepEdEmail(requesterEmail)) {
      return res.status(403).json({ message: "Please use your DepEd email address" });
    }

    const employee = await EService.getByEmail(requesterEmail);

    if (!employee) {
      // Log the request even if no data was found
      const now = new Date();
      const dateLabel = now.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric" });
      const timeLabel = now.toLocaleString("en-US", { hour: "numeric", minute: "numeric", hour12: true });
      await EService.insertLogServiceRequest(requesterEmail, dateLabel, timeLabel);
      return res.status(200).json({ status: "no data" });
    }

    const AOName = (await EService.getAdministrativeOfficerBySchool(employee.school)) || "MA. JIMA T. CADIZ";
    const records = await EService.getServiceRecordsByEmpId(employee.id);

    const fs = require("fs");
    const PDFDocument = require("pdfkit");
    const doc = new PDFDocument({ size: "A4", margin: 0, autoFirstPage: false });
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));

    const safe = (v) => (v === undefined || v === null ? "" : String(v));
    const mm = (value) => value * 2.8346456693;
    const findFont = (candidates) => candidates.find((candidate) => fs.existsSync(candidate));
    const registerFont = (name, candidates, fallback) => {
      const fontPath = findFont(candidates);
      if (!fontPath) return fallback;
      doc.registerFont(name, fontPath);
      return name;
    };
    const arial = registerFont("arial", [
      "C:\\Windows\\Fonts\\arial.ttf",
      "/usr/share/fonts/truetype/msttcorefonts/Arial.ttf",
      "/usr/share/fonts/truetype/msttcorefonts/arial.ttf",
    ], "Helvetica");
    const arialBold = registerFont("arialbd", [
      "C:\\Windows\\Fonts\\arialbd.ttf",
      "/usr/share/fonts/truetype/msttcorefonts/Arial_Bold.ttf",
      "/usr/share/fonts/truetype/msttcorefonts/arialbd.ttf",
    ], "Helvetica-Bold");
    const arialNarrow = registerFont("arialn", [
      "C:\\Windows\\Fonts\\arialn.ttf",
      "C:\\Windows\\Fonts\\ARIALN.TTF",
      "/usr/share/fonts/truetype/msttcorefonts/Arial_Narrow.ttf",
      "/usr/share/fonts/truetype/msttcorefonts/arialn.ttf",
    ], arial);
    const arialNarrowBold = registerFont("arialnb", [
      "C:\\Windows\\Fonts\\arialnb.ttf",
      "C:\\Windows\\Fonts\\ARIALNB.TTF",
      "/usr/share/fonts/truetype/msttcorefonts/Arial_Narrow_Bold.ttf",
      "/usr/share/fonts/truetype/msttcorefonts/arialnb.ttf",
    ], arialBold);
    const fonts = {
      arial,
      arialbd: arialBold,
      arialn: arialNarrow,
      arialnb: arialNarrowBold,
    };
    const fontScaleX = {
      arial: 1,
      arialbd: 1,
      arialn: arialNarrow === "arialn" ? 1 : 0.86,
      arialnb: arialNarrowBold === "arialnb" ? 1 : 0.86,
    };
    let activeFontScaleX = 1;
    const useFont = (fontKey, size) => {
      doc.font(fonts[fontKey] || "Helvetica").fontSize(size);
      activeFontScaleX = fontScaleX[fontKey] || 1;
    };
    const line = (x1, y1, x2, y2, width = 0.2) => {
      doc.lineWidth(mm(width)).moveTo(mm(x1), mm(y1)).lineTo(mm(x2), mm(y2)).stroke();
    };
    const rect = (x, y, w, h, width = 0.2) => {
      doc.lineWidth(mm(width)).rect(mm(x), mm(y), mm(w), mm(h)).stroke();
    };
    const text = (value, x, y, w, h, options = {}) => {
      const scaleX = options.scaleX || activeFontScaleX;
      const textOptions = {
        width: mm(w),
        height: h ? mm(h) : undefined,
        align: options.align || "left",
        lineGap: options.lineGap ?? 0,
        ellipsis: options.ellipsis ?? false,
        underline: options.underline ?? false,
      };

      if (scaleX === 1) {
        doc.text(safe(value), mm(x), mm(y), textOptions);
        return;
      }

      doc.save();
      doc.translate(mm(x), mm(y));
      doc.scale(scaleX, 1);
      doc.text(safe(value), 0, 0, {
        ...textOptions,
        width: textOptions.width / scaleX,
      });
      doc.restore();
    };
    const cellText = (value, x, y, w, h, options = {}) => {
      const paddingLeft = options.paddingLeft ?? options.paddingX ?? 0;
      const paddingRight = options.paddingRight ?? options.paddingX ?? 0;
      const paddingTop = options.paddingTop ?? options.paddingY ?? 0;
      const paddingBottom = options.paddingBottom ?? 0;
      const fontSize = options.fontSize || 7;
      doc.save();
      doc.rect(mm(x), mm(y), mm(w), mm(h)).clip();
      useFont(options.fontKey || (options.bold ? "arialnb" : "arialn"), fontSize);
      text(safe(value), x + paddingLeft, y + paddingTop, Math.max(w - paddingLeft - paddingRight, 1), Math.max(h - paddingTop - paddingBottom, 1), {
        align: options.align || "center",
        lineGap: options.lineGap ?? -1,
        ellipsis: options.ellipsis ?? false,
      });
      doc.restore();
    };

    const formatShortDate = (val) => {
      if (!val) return "";
      const s = String(val).trim();
      if (/present/i.test(s)) return "Present";
      const d = new Date(s);
      if (Number.isNaN(d.getTime())) return s;
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      const yy = String(d.getFullYear()).slice(-2);
      return `${mm}/${dd}/${yy}`;
    };

    const formatDateTime = () => {
      const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Singapore",
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }).formatToParts(new Date()).reduce((acc, part) => {
        acc[part.type] = part.value;
        return acc;
      }, {});
      return ` ${parts.month} ${parts.day}  ${parts.year}  ${parts.hour}:${parts.minute} ${parts.dayPeriod}`;
    };

    const drawHeader = () => {
      useFont("arialnb", 13);
      text("SERVICE RECORD", 0, 13, 210, 5, { align: "center", underline: true });
      useFont("arialn", 9);
      text("(To be accomplished by the Employer)", 0, 19, 210, 5, { align: "center" });
    };

    const drawEmployeeBlock = (continuedPage = false) => {
      const finalMiddle = continuedPage
        ? employee.MISR
        : (employee.gender === "Female" && employee.civilStatus === "Married")
          ? employee.middleName
          : employee.middle_initial;

      useFont("arialnb", 9);
      text("NAME:", 16, 43, 14, 5);
      text(employee.lastName, 28, 43, 40, 5, { align: "center" });
      text(employee.firstName, 70, 43, 40, 5, { align: "center" });
      text(finalMiddle, 112, 43, 40, 5, { align: "center" });

      useFont("arialn", 9);
      text("(If married woman, give full maiden name)", 152, 43, 43, 10);

      useFont("arialbd", 8);
      line(28, 47.8, 151, 47.8, 0.2);

      useFont("arialn", 9);
      text("Surname", 28, 48.7, 40, 5, { align: "center" });
      text("Given Name", 70, 48.7, 40, 5, { align: "center" });
      text("MI", 112, 48.7, 40, 5, { align: "center" });

      useFont("arialnb", 9);
      text("BIRTH:", 16, 59, 14, 5);
      text(employee.dateOfBirth, 30, 59, 40, 5, { align: "center" });
      text(employee.place, 72, 59, 75, 5, { align: "center" });

      useFont("arialn", 9);
      text("(Date herein should be checked from birth or baptismal certificate)", 152, 59, 47, 15);

      useFont("arialbd", 8);
      line(28, 63.8, 151, 63.8, 0.2);

      useFont("arialn", 9);
      text("Date", 30, 64.7, 40, 5, { align: "center" });
      text("Place", 72, 64.7, 75, 5, { align: "center" });

      text("      This is to certify that the employee named herein above actually rendered service in the office as shown by the service record  below each line of which", 17, 76, 180, 5);
      text(" is supported by appointment and other papers actually issued by this office and approved by the authorities concerned.", 17, 81, 180, 5);
    };

    const drawTableHeader = () => {
      rect(9, 91, 25, 7);
      cellText("SERVICE INCLUSIVE\nDATES", 9, 91, 25, 7, {
        fontKey: "arialnb",
        fontSize: 5.7,
        paddingTop: 0.7,
        lineGap: -0.8,
      });

      rect(34, 91, 52, 7);
      cellText("RECORD OF APPOINTMENT", 34, 91, 52, 7, {
        fontKey: "arialnb",
        fontSize: 8,
        paddingTop: 2,
      });

      rect(86, 91, 51, 7);
      cellText("OFFICE/ENTITY/DIVISION", 86, 91, 51, 7, {
        fontKey: "arialnb",
        fontSize: 8,
        paddingTop: 2,
      });

      rect(137, 91, 40, 14);
      cellText("LEAVE OF ABS WITHOUT PAY", 137, 91, 40, 14, {
        fontKey: "arialnb",
        fontSize: 8,
        paddingTop: 5,
      });

      rect(177, 91, 26, 14);
      cellText("REMARKS", 177, 91, 26, 14, {
        fontKey: "arialnb",
        fontSize: 8,
        paddingTop: 5,
      });

      const sub = [
        [9, "From", 12.5],
        [21.5, "To", 12.5],
        [34, "Designation", 27],
        [61, "Status", 10],
        [71, "Salary", 15],
        [86, "Station/Place of Appointment", 41],
        [127, "Branch", 10],
      ];
      for (const [x, label, w] of sub) {
        rect(x, 98, w, 7);
        cellText(label, x, 98, w, 7, {
          fontKey: "arialnb",
          fontSize: 7,
          paddingTop: 2,
        });
      }
    };

    const drawTableBorders = () => {
      line(9, 91, 203, 91, 0.1);
      line(9, 91.5, 203, 91.5, 0.1);
      line(9, 105, 9, 236, 0.2);
      line(203, 105, 203, 236, 0.2);
      line(9, 236, 203, 236, 0.1);
      line(9, 235.5, 203, 235.5, 0.1);
      [21.5, 34, 61, 71, 86, 127, 137, 177].forEach((x) =>
        line(x, 105, x, 236, 0.2),
      );
    };

    const drawFooter = () => {
      useFont("arialn", 9);
      text("Issued in accordance with Executive Order No. 54 dated August 10, 1954 in accordance with circular No. 58 dated August 10, 1954 of the system.", 18, 237, 180, 15);

      useFont("arialnb", 11);
      text("CERTIFIED CORRECT:", 125, 247, 35, 5, { align: "center" });

      useFont("arialn", 10);
      text("For the Schools Division Superintendent:", 124, 257, 55, 5, { align: "center" });

      useFont("arialnb", 11);
      text(AOName, 135, 267, 35, 5, { align: "center" });

      useFont("arialn", 10);
      text("Administrative Officer V", 135, 271, 35, 5, { align: "center" });

      useFont("arialn", 8.5);
      text("Not Valid without seal", 22, 252, 24, 11, { align: "center" });
      useFont("arialn", 9);
      text(formatDateTime(), 23, 267, 20, 10, { align: "center" });
    };

    const startPage = (continuedPage = false) => {
      doc.addPage();
      drawHeader();
      drawEmployeeBlock(continuedPage);
      drawTableHeader();
      drawTableBorders();
      drawFooter();
      useFont("arialn", 7);
      return 105.3;
    };

    const getRowHeight = (row) => {
      const leaveLength = safe(row.leaveOfAbssence).length;
      const remarksLength = safe(row.remarks).length;
      if (leaveLength >= 50 && leaveLength <= 69) return 7;
      if (leaveLength >= 86 || remarksLength >= 20) return 10;
      return 4;
    };

    doc.on("end", async () => {
      try {
        const pdfBuffer = Buffer.concat(chunks);

        const nodemailer = require("nodemailer");
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT) || 587,
          secure: process.env.SMTP_SECURE === "true",
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });

        const mailOptions = {
          from: process.env.SMTP_FROM || "Division Office <no-reply@deped.gov.ph>",
          to: requesterEmail,
          subject: "SERVICE RECORD",
          html: `Below is the requested Service Record of ${employee.lastName}, ${employee.firstName} ${employee.middleName || ""}.`,
          attachments: [
            {
              filename: `ServiceRecord-${employee.lastName}, ${employee.firstName}${employee.middleName ? ' ' + employee.middleName : ''}.pdf`,
              content: pdfBuffer,
            },
          ],
        };

        const info = await transporter.sendMail(mailOptions);
        console.log("[ESERVICE sendServiceRecord] SMTP accepted", {
          to: requesterEmail,
          messageId: info.messageId,
          accepted: info.accepted,
          rejected: info.rejected,
          response: info.response,
        });

        const now = new Date();
        const dateLabel = now.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric" });
        const timeLabel = now.toLocaleString("en-US", { hour: "numeric", minute: "numeric", hour12: true });
        await EService.insertLogServiceRequest(requesterEmail, dateLabel, timeLabel);

        return res.status(200).json({ status: "found", messageId: info.messageId });
      } catch (err) {
        console.error("[ESERVICE sendServiceRecord]", err);
        return res.status(500).json({ message: "Failed to send service record", error: err.message });
      }
    });

    let rowY = startPage(false);
    let rowCount = 0;
    for (const r of records) {
      if (rowCount >= 40) {
        rowY = startPage(true);
        rowCount = 0;
      }

      const rowHeight = getRowHeight(r);
      const from = formatShortDate(r.dateStart);
      const to = formatShortDate(r.dateEnd);
      const cells = [
        [9, 12.5, from, { fontSize: 6.7, paddingLeft: 0, paddingRight: 0 }],
        [21.5, 12.5, to, { fontSize: 6.7, paddingLeft: 0, paddingRight: 0 }],
        [34, 27, r.designation],
        [61, 10, r.empStatus],
        [71, 15, r.empSalary],
        [86, 41, r.placeOfAppointment],
        [127, 10, r.branch],
        [137, 40, r.leaveOfAbssence],
        [177, 26, r.remarks],
      ];

      for (const [x, w, value, cellOptions = {}] of cells) {
        cellText(value, x, rowY, w, rowHeight, {
          fontKey: "arialn",
          fontSize: cellOptions.fontSize ?? 7,
          paddingLeft: cellOptions.paddingLeft ?? 2,
          paddingRight: cellOptions.paddingRight ?? 0,
          paddingTop: 0.5,
        });
      }
      rowY += rowHeight;
      rowCount += 1;
    }

    doc.end();
  } catch (err) {
    console.error("[ESERVICE sendServiceRecord outer]", err);
    return res.status(500).json({ message: "Error processing request", error: err.message });
  }
};

module.exports = {
  getAllEmployeePersonalInfo,
  getEmployeePersonalInfoById,
  getEmployeePersonalInfoCount,
  getRetirementCounts,
  createEmployeePersonalInfo,
  updateEmployeePersonalInfo,
  deleteEmployeePersonalInfo,
  getDistricts,
  getSchools,
  sendServiceRecord,
};
