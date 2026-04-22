const Leave = require("./leaveModel");
const Backlog = require("../backlog/backlogModel");
const Employee = require("../employee/employeeModel");
const PDFDocument = require("pdfkit");
const { normalizeRole } = require("../../middleware/roleAuthMiddleware");

const MONTHLY_CREDIT = 1.25;
const ENTRY_KIND_MANUAL = "MANUAL";
const ENTRY_KIND_MONTHLY_CREDIT = "MONTHLY_CREDIT";
const parseNum = (v) => {
  const parsed = Number(v);
  return Number.isFinite(parsed) ? parsed : 0;
};
const round2 = (v) => parseFloat(parseNum(v).toFixed(2));
const todayStr = () => new Date().toISOString().slice(0, 10);
const isoDateStr = (d) => d.toISOString().slice(0, 10);
const toUpperStr = (v) => (typeof v === "string" ? v.trim().toUpperCase() : "");
const toBoolean = (v) => {
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v === 1;
  if (typeof v !== "string") return false;
  const normalized = v.trim().toLowerCase();
  return ["1", "true", "yes", "y", "on"].includes(normalized);
};
const hasValue = (v) => !(v === undefined || v === null || v === "");
const pickFirstValue = (...values) => values.find(hasValue);
const isDifferent = (a, b) => Math.abs(parseNum(a) - parseNum(b)) > 0.0001;
const ROLE_ADMIN = "admin";
const ROLE_DATA_ENCODER = "data-encoder";

const normalizeRoleKey = (role) =>
  String(role || "")
    .trim()
    .toLowerCase()
    .replace(/_/g, "-");

const isSchoolScopedWriteRole = (role) => {
  const normalized = normalizeRoleKey(role);
  return normalized === ROLE_ADMIN || normalized === ROLE_DATA_ENCODER;
};

const isSameSchool = (userSchoolId, targetSchoolId) =>
  Number(userSchoolId) > 0 && Number(userSchoolId) === Number(targetSchoolId);

const getScopedSchoolId = (req) => {
  const schoolId = Number(req.user?.school_id);
  return Number.isFinite(schoolId) && schoolId > 0 ? schoolId : null;
};

const canManageMonthlyCredit = (role) => {
  const normalized = normalizeRole(role);
  return normalized === "admin" || normalized === "super-admin";
};

const toFixed3 = (value) => parseNum(value).toFixed(3);

const formatDateForCard = (value) => {
  if (!value) return "-";

  const datePart = String(value).split("T")[0].split(" ")[0];
  if (!datePart) return "-";

  const date = new Date(datePart);
  if (Number.isNaN(date.getTime())) {
    return datePart;
  }

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const chunkRows = (rows, chunkSize) => {
  const output = [];
  for (let i = 0; i < rows.length; i += chunkSize) {
    output.push(rows.slice(i, i + chunkSize));
  }
  return output;
};

const formatEmployeeFullName = (employeeLike) => {
  const joinedFullName = String(employeeLike?.full_name || "").trim();
  if (joinedFullName) return joinedFullName;

  const composedFullName = [
    employeeLike?.first_name,
    employeeLike?.middle_name,
    employeeLike?.last_name,
  ]
    .map((part) => String(part || "").trim())
    .filter(Boolean)
    .join(" ")
    .trim();

  return composedFullName || "employee";
};

const normalizePeriod = (yearInput, monthInput) => {
  const now = new Date();
  const year = yearInput !== undefined ? Number(yearInput) : now.getFullYear();
  const month =
    monthInput !== undefined ? Number(monthInput) : now.getMonth() + 1;

  if (!Number.isInteger(year) || year < 1900 || year > 3000) {
    const err = new Error(
      "Invalid year. Please provide a valid year (e.g. 2026).",
    );
    err.statusCode = 400;
    throw err;
  }

  if (!Number.isInteger(month) || month < 1 || month > 12) {
    const err = new Error(
      "Invalid month. Please provide a month from 1 to 12.",
    );
    err.statusCode = 400;
    throw err;
  }

  const monthName = new Date(year, month - 1, 1).toLocaleString("en-PH", {
    month: "long",
  });
  const period = `${monthName} ${year}`;

  return { year, month, period };
};

const normalizeEmployeeType = (employeeType) => {
  if (typeof employeeType !== "string") return "";
  return employeeType
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, "-");
};

const getMonthlyCreditByEmployeeType = (employeeType) => {
  const normalizedType = normalizeEmployeeType(employeeType);
  if (normalizedType === "non-teaching") {
    return { earnedVL: MONTHLY_CREDIT, earnedSL: MONTHLY_CREDIT };
  }
  return { earnedVL: 0, earnedSL: 0 };
};

const normalizeStatus = (status) => {
  const raw = toUpperStr(status);
  if (!raw) return null;

  if (["DISAPPROVED", "REJECTED", "DENIED"].includes(raw)) {
    return "DISAPPROVED";
  }
  if (raw === "APPROVED") {
    return "APPROVED";
  }
  if (raw === "PENDING") {
    return "PENDING";
  }
  return null;
};

const normalizeLeaveCategory = (leaveType) => {
  const raw = toUpperStr(leaveType).replace(/\s+/g, "_").replace(/-/g, "_");
  if (!raw) return null;

  if (["VACATION", "VACATION_LEAVE", "VL"].includes(raw)) {
    return "VACATION";
  }
  if (["SICK", "SICK_LEAVE", "SL"].includes(raw)) {
    return "SICK";
  }
  return null;
};

const normalizeEntryKind = (entryKind) => {
  const raw = toUpperStr(entryKind).replace(/\s+/g, "_").replace(/-/g, "_");
  if (!raw) return null;
  if (["MONTHLY_CREDIT", "MONTHLY_LEAVE_CREDIT"].includes(raw)) {
    return ENTRY_KIND_MONTHLY_CREDIT;
  }
  if (["MANUAL", "LEAVE", "LEAVE_ENTRY"].includes(raw)) {
    return ENTRY_KIND_MANUAL;
  }
  return null;
};

const fallbackIsMonetization = (entryLike) => {
  const particulars = String(entryLike?.particulars || "")
    .trim()
    .toLowerCase();
  return particulars === "monetization";
};

const fallbackStatus = (entryLike) => {
  const particulars = String(entryLike?.particulars || "")
    .trim()
    .toLowerCase();
  if (!particulars) return null;
  if (
    particulars.includes("disapproved") ||
    particulars.includes("rejected") ||
    particulars.includes("denied")
  ) {
    return "DISAPPROVED";
  }
  if (particulars.includes("approved")) {
    return "APPROVED";
  }
  return null;
};

const getStructuredContext = (entryLike) => {
  const status =
    normalizeStatus(entryLike?.status) ||
    normalizeStatus(entryLike?.approval_status) ||
    normalizeStatus(entryLike?.leave_status) ||
    fallbackStatus(entryLike);

  const leaveCategory =
    normalizeLeaveCategory(entryLike?.leave_type) ||
    normalizeLeaveCategory(entryLike?.leaveType) ||
    normalizeLeaveCategory(entryLike?.category) ||
    normalizeLeaveCategory(entryLike?.leave_category);

  const isMonetization =
    toBoolean(entryLike?.isMonetization) ||
    toBoolean(entryLike?.is_monetization) ||
    toBoolean(entryLike?.monetization) ||
    hasValue(entryLike?.monetized_vl) ||
    hasValue(entryLike?.monetizedVl) ||
    fallbackIsMonetization(entryLike);

  const isWithoutPay =
    toBoolean(entryLike?.isWithoutPay) ||
    toBoolean(entryLike?.is_without_pay) ||
    toBoolean(entryLike?.without_pay) ||
    parseNum(entryLike?.abs_without_pay_vl) > 0 ||
    parseNum(entryLike?.abs_without_pay_sl) > 0;

  const entryKind =
    normalizeEntryKind(entryLike?.entry_kind) ||
    normalizeEntryKind(entryLike?.entryKind);

  return {
    status,
    leaveCategory,
    isMonetization,
    isWithoutPay,
    entryKind,
  };
};

const NUMERIC_LEAVE_FIELDS = [
  "earned_vl",
  "abs_with_pay_vl",
  "abs_without_pay_vl",
  "earned_sl",
  "abs_with_pay_sl",
  "abs_without_pay_sl",
  "monetized_vl",
  "monetized_sl",
  "monetizedVl",
  "monetizedSl",
];

// Returns an error message string if any numeric leave field is invalid, otherwise null.
const validateLeaveFields = (data) => {
  for (const field of NUMERIC_LEAVE_FIELDS) {
    const raw = data[field];
    if (raw === undefined || raw === null || raw === "") continue; // optional on update
    const num = Number(raw);
    if (isNaN(num)) return `${field} must be a valid number.`;
    if (num < 0) return `${field} must not be negative.`;
  }
  return null;
};

const validatePaidAbsenceAgainstBalance = ({
  prev_bal_vl,
  prev_bal_sl,
  effect,
}) => {
  const errors = [];

  if (effect.abs_with_pay_vl > parseNum(prev_bal_vl)) {
    errors.push(
      `Abs With Pay VL (${effect.abs_with_pay_vl}) exceeds available VL balance (${round2(prev_bal_vl)}).`,
    );
  }

  if (effect.abs_with_pay_sl > parseNum(prev_bal_sl)) {
    errors.push(
      `Abs With Pay SL (${effect.abs_with_pay_sl}) exceeds available SL balance (${round2(prev_bal_sl)}).`,
    );
  }

  return errors;
};

const validateParticularAllowed = async (particulars) => {
  const value = typeof particulars === "string" ? particulars.trim() : "";
  if (!value) return null;

  const allowed = await Leave.isParticularAllowed(value);
  if (allowed) return null;

  return `particulars must be one of the configured options. Received: ${value}`;
};

const computeEntryEffect = (entryLike, { employeeType } = {}) => {
  const context = getStructuredContext(entryLike);

  let earned_vl = parseNum(entryLike?.earned_vl);
  let abs_with_pay_vl = parseNum(entryLike?.abs_with_pay_vl);
  let abs_without_pay_vl = parseNum(entryLike?.abs_without_pay_vl);

  let earned_sl = parseNum(entryLike?.earned_sl);
  let abs_with_pay_sl = parseNum(entryLike?.abs_with_pay_sl);
  let abs_without_pay_sl = parseNum(entryLike?.abs_without_pay_sl);

  let monetized_vl = parseNum(
    pickFirstValue(entryLike?.monetized_vl, entryLike?.monetizedVl),
  );
  let monetized_sl = parseNum(
    pickFirstValue(entryLike?.monetized_sl, entryLike?.monetizedSl),
  );

  if (context.entryKind === ENTRY_KIND_MONTHLY_CREDIT) {
    const monthlyCredit = getMonthlyCreditByEmployeeType(employeeType);
    earned_vl = monthlyCredit.earnedVL;
    earned_sl = monthlyCredit.earnedSL;
    abs_with_pay_vl = 0;
    abs_without_pay_vl = 0;
    abs_with_pay_sl = 0;
    abs_without_pay_sl = 0;
    monetized_vl = 0;
    monetized_sl = 0;
  }

  if (context.isMonetization) {
    // Keep monetization logic structured; particulars text is for display only.
    // Since current schema has no dedicated monetized_vl column, fold it into VL deduction field.
    const inferredMonetized = Math.max(
      monetized_vl,
      abs_with_pay_vl,
      parseNum(entryLike?.abs_with_pay_vl),
    );

    earned_vl = 0;
    earned_sl = 0;
    abs_with_pay_vl = inferredMonetized;
    abs_with_pay_sl = 0;
    monetized_vl = 0;
    monetized_sl = 0;
  }

  if (!context.isMonetization && monetized_vl > 0) {
    // Backward-compatible fallback: explicit monetized_vl input still deducts VL.
    abs_with_pay_vl += monetized_vl;
    monetized_vl = 0;
  }

  if (context.status === "DISAPPROVED") {
    earned_vl = 0;
    abs_with_pay_vl = 0;
    earned_sl = 0;
    abs_with_pay_sl = 0;
    monetized_vl = 0;
    monetized_sl = 0;
  }

  if (context.isWithoutPay) {
    if (
      context.leaveCategory === "VACATION" &&
      abs_without_pay_vl === 0 &&
      abs_with_pay_vl > 0
    ) {
      abs_without_pay_vl = abs_with_pay_vl;
    }
    if (
      context.leaveCategory === "SICK" &&
      abs_without_pay_sl === 0 &&
      abs_with_pay_sl > 0
    ) {
      abs_without_pay_sl = abs_with_pay_sl;
    }

    abs_with_pay_vl = 0;
    abs_with_pay_sl = 0;
    monetized_vl = 0;
    monetized_sl = 0;
  }

  if (
    context.status === "APPROVED" &&
    !context.isMonetization &&
    !context.isWithoutPay
  ) {
    if (context.leaveCategory === "VACATION") {
      abs_with_pay_sl = 0;
      abs_without_pay_sl = 0;
    }
    if (context.leaveCategory === "SICK") {
      abs_with_pay_vl = 0;
      abs_without_pay_vl = 0;
    }
  }

  return {
    earned_vl: round2(earned_vl),
    abs_with_pay_vl: round2(abs_with_pay_vl),
    abs_without_pay_vl: round2(abs_without_pay_vl),
    earned_sl: round2(earned_sl),
    abs_with_pay_sl: round2(abs_with_pay_sl),
    abs_without_pay_sl: round2(abs_without_pay_sl),
    monetized_vl: round2(monetized_vl),
    monetized_sl: round2(monetized_sl),
    context,
  };
};

const computeRunningBalance = (previous, effect) => {
  const prev_vl = parseNum(previous?.bal_vl);
  const prev_sl = parseNum(previous?.bal_sl);

  const bal_vl = round2(
    Math.max(
      0,
      prev_vl + effect.earned_vl - effect.abs_with_pay_vl - effect.monetized_vl,
    ),
  );
  const bal_sl = round2(
    Math.max(
      0,
      prev_sl + effect.earned_sl - effect.abs_with_pay_sl - effect.monetized_sl,
    ),
  );

  return { bal_vl, bal_sl };
};

// Recomputes running VL/SL balances for all rows of one employee.
const recomputeEmployeeLeaveLedger = async (employee_id) => {
  const rows = await Leave.getByEmployeeOrdered(employee_id);
  const employeeType = await Leave.getEmployeeTypeById(employee_id);
  let runningVl = 0;
  let runningSl = 0;

  for (const row of rows) {
    const effect = computeEntryEffect(row, { employeeType });
    const { bal_vl, bal_sl } = computeRunningBalance(
      { bal_vl: runningVl, bal_sl: runningSl },
      effect,
    );

    const shouldUpdate =
      isDifferent(row.earned_vl, effect.earned_vl) ||
      isDifferent(row.abs_with_pay_vl, effect.abs_with_pay_vl) ||
      isDifferent(row.abs_without_pay_vl, effect.abs_without_pay_vl) ||
      isDifferent(row.earned_sl, effect.earned_sl) ||
      isDifferent(row.abs_with_pay_sl, effect.abs_with_pay_sl) ||
      isDifferent(row.abs_without_pay_sl, effect.abs_without_pay_sl) ||
      isDifferent(row.bal_vl, bal_vl) ||
      isDifferent(row.bal_sl, bal_sl);

    if (shouldUpdate) {
      await Leave.updateComputedLeaveFields(row.id, {
        earned_vl: effect.earned_vl,
        abs_with_pay_vl: effect.abs_with_pay_vl,
        abs_without_pay_vl: effect.abs_without_pay_vl,
        bal_vl,
        earned_sl: effect.earned_sl,
        abs_with_pay_sl: effect.abs_with_pay_sl,
        abs_without_pay_sl: effect.abs_without_pay_sl,
        bal_sl,
      });
    }

    runningVl = bal_vl;
    runningSl = bal_sl;
  }
};

const resolveParticulars = (
  particulars,
  { isMonetization, isMonthlyCredit } = {},
) => {
  if (isMonthlyCredit) {
    return "Leave Credit";
  }
  if (isMonetization) {
    return "Monetization";
  }
  const value = typeof particulars === "string" ? particulars.trim() : "";
  return value || null;
};

const getMonthBounds = (year, month) => {
  const monthStart = new Date(Date.UTC(year, month - 1, 1));
  const monthEnd = new Date(Date.UTC(year, month, 0));
  return {
    monthStart: isoDateStr(monthStart),
    monthEnd: isoDateStr(monthEnd),
  };
};

const isOnLeaveDuringPeriod = (employee, periodStart, periodEnd) => {
  if (!toBoolean(employee?.on_leave)) {
    return false;
  }

  const leaveFrom = employee?.on_leave_from
    ? String(employee.on_leave_from).slice(0, 10)
    : null;
  const leaveUntil = employee?.on_leave_until
    ? String(employee.on_leave_until).slice(0, 10)
    : null;

  // If dates are not provided while flagged on_leave, treat as ongoing leave.
  if (!leaveFrom && !leaveUntil) {
    return true;
  }

  if (!leaveFrom && leaveUntil) {
    return leaveUntil >= periodStart;
  }

  if (leaveFrom && !leaveUntil) {
    return leaveFrom <= periodEnd;
  }

  return leaveFrom <= periodEnd && leaveUntil >= periodStart;
};

const applyMonthlyCredit = async ({
  year,
  month,
  actorUserId = null,
  simulate = false,
} = {}) => {
  const {
    period,
    year: normalizedYear,
    month: normalizedMonth,
  } = normalizePeriod(year, month);
  const today = todayStr();
  const { monthStart, monthEnd } = getMonthBounds(
    normalizedYear,
    normalizedMonth,
  );

  const employees = await Leave.getAllNonTeachingEmployees();
  const teachingEmployees = await Leave.getAllTeachingEmployees();
  const expectedCredit = getMonthlyCreditByEmployeeType("non-teaching");
  let credited = 0;
  let skipped = 0;
  const skippedNames = [];
  const creditedEmployees = [];
  const skippedEmployees = [];

  for (const emp of employees) {
    const fullName = `${emp.first_name} ${emp.last_name}`;

    if (isOnLeaveDuringPeriod(emp, monthStart, monthEnd)) {
      skipped++;
      skippedNames.push(fullName);
      if (simulate) {
        skippedEmployees.push({
          employee_id: emp.id,
          employee_name: fullName,
          reason: "ON_LEAVE_DURING_PERIOD",
        });
      }
      continue;
    }

    const monthlyCredit = getMonthlyCreditByEmployeeType(emp.employee_type);
    if (monthlyCredit.earnedVL <= 0 && monthlyCredit.earnedSL <= 0) {
      skipped++;
      skippedNames.push(fullName);
      if (simulate) {
        skippedEmployees.push({
          employee_id: emp.id,
          employee_name: fullName,
          reason: "NOT_ELIGIBLE_FOR_MONTHLY_CREDIT",
        });
      }
      continue;
    }

    const alreadyCredited = await Leave.hasEntryForPeriod(
      emp.id,
      period,
      ENTRY_KIND_MONTHLY_CREDIT,
      expectedCredit.earnedVL,
      expectedCredit.earnedSL,
    );
    if (alreadyCredited) {
      skipped++;
      skippedNames.push(fullName);
      if (simulate) {
        skippedEmployees.push({
          employee_id: emp.id,
          employee_name: fullName,
          reason: "ALREADY_CREDITED_FOR_PERIOD",
        });
      }
      continue;
    }

    const latest = await Leave.getLatestByEmployee(emp.id);
    const prev_bal_vl = latest ? parseNum(latest.bal_vl) : 0;
    const prev_bal_sl = latest ? parseNum(latest.bal_sl) : 0;

    const effect = computeEntryEffect(
      {
        entry_kind: ENTRY_KIND_MONTHLY_CREDIT,
        earned_vl: monthlyCredit.earnedVL,
        earned_sl: monthlyCredit.earnedSL,
      },
      { employeeType: emp.employee_type },
    );

    const { bal_vl, bal_sl } = computeRunningBalance(
      { bal_vl: prev_bal_vl, bal_sl: prev_bal_sl },
      effect,
    );

    if (simulate) {
      creditedEmployees.push({
        employee_id: emp.id,
        employee_name: fullName,
        on_leave: Boolean(emp.on_leave),
        period,
        credit: {
          earned_vl: effect.earned_vl,
          earned_sl: effect.earned_sl,
        },
        previous_balance: {
          bal_vl: round2(prev_bal_vl),
          bal_sl: round2(prev_bal_sl),
        },
        projected_balance: {
          bal_vl: round2(bal_vl),
          bal_sl: round2(bal_sl),
        },
      });
      credited++;
      continue;
    }

    await Leave.create({
      employee_id: emp.id,
      period_of_leave: period,
      entry_kind: ENTRY_KIND_MONTHLY_CREDIT,
      particulars: resolveParticulars(null, { isMonthlyCredit: true }),
      earned_vl: effect.earned_vl,
      abs_with_pay_vl: effect.abs_with_pay_vl,
      abs_without_pay_vl: effect.abs_without_pay_vl,
      bal_vl,
      earned_sl: effect.earned_sl,
      abs_with_pay_sl: effect.abs_with_pay_sl,
      abs_without_pay_sl: effect.abs_without_pay_sl,
      bal_sl,
      date_of_action: today,
    });

    // Ensure downstream balances remain correct even if period/date are backfilled.
    await recomputeEmployeeLeaveLedger(emp.id);

    if (actorUserId) {
      Backlog.create({
        user_id: actorUserId,
        school_id: null,
        employee_id: emp.id,
        leave_id: null,
        action: "LEAVE_MONTHLY_CREDIT",
        details: `${fullName} — ${period}`,
      });
    }

    credited++;
  }

  if (teachingEmployees.length > 0) {
    for (const emp of teachingEmployees) {
      const fullName = `${emp.first_name} ${emp.last_name}`;
      skipped++;
      skippedNames.push(fullName);
      if (simulate) {
        skippedEmployees.push({
          employee_id: emp.id,
          employee_name: fullName,
          reason:
            "This employee is teaching personnel, and monthly leave credit applies only to non-teaching employees.",
        });
      }
    }
  }

  if (simulate) {
    return {
      message: `Monthly leave credit simulation completed for ${period}.`,
      period,
      would_credit: credited,
      would_skip: skipped,
      ...(creditedEmployees.length > 0 && {
        would_credit_employees: creditedEmployees,
      }),
      ...(skippedEmployees.length > 0 && {
        would_skip_employees: skippedEmployees,
      }),
      ...(skippedNames.length > 0 && { skipped_employees: skippedNames }),
    };
  }

  return {
    message: `Monthly leave credit applied for ${period}.`,
    period,
    credited,
    skipped,
    ...(skippedNames.length > 0 && { skipped_employees: skippedNames }),
  };
};

const autoCreditCurrentMonth = async () => {
  const result = await applyMonthlyCredit();
  return result;
};

const getLeaveParticulars = async (req, res) => {
  try {
    const data = await Leave.getParticulars();
    const search = String(req.query?.search || "")
      .trim()
      .toLowerCase();
    const sortOrder =
      String(req.query?.sortOrder || "a-z").toLowerCase() === "z-a"
        ? "z-a"
        : "a-z";

    const filtered = search
      ? data.filter((item) => String(item).toLowerCase().includes(search))
      : data;

    const sorted = [...filtered].sort((a, b) =>
      sortOrder === "a-z"
        ? String(a).localeCompare(String(b))
        : String(b).localeCompare(String(a)),
    );

    return res.status(200).json({ data: sorted, total: sorted.length });
  } catch (err) {
    return res.status(500).json({
      message: "Error retrieving leave particulars",
      error: err.message,
    });
  }
};

const createLeaveParticular = async (req, res) => {
  try {
    const particular = String(req.body?.particular || "").trim();
    if (!particular) {
      return res.status(400).json({ message: "particular is required" });
    }

    const result = await Leave.addParticular(particular);

    await Backlog.record({
      user_id: req.user?.id || null,
      school_id: null,
      employee_id: null,
      leave_id: null,
      action: result.created
        ? "LEAVE_PARTICULAR_CREATED"
        : "LEAVE_PARTICULAR_EXISTS",
      details: particular,
    });

    return res.status(result.created ? 201 : 200).json({
      message: result.created
        ? "Leave particular created successfully"
        : "Leave particular already exists",
      data: {
        particular,
        created: result.created,
        total: result.options.length,
        options: result.options,
      },
    });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Error creating leave particular", error: err.message });
  }
};

const updateLeaveParticular = async (req, res) => {
  try {
    const oldParticular = String(req.body?.old_particular || "").trim();
    const newParticular = String(req.body?.new_particular || "").trim();

    const result = await Leave.updateParticular(oldParticular, newParticular);

    await Backlog.record({
      user_id: req.user?.id || null,
      school_id: null,
      employee_id: null,
      leave_id: null,
      action: "LEAVE_PARTICULAR_UPDATED",
      details: `${oldParticular} -> ${newParticular}`,
    });

    return res.status(result.updated ? 200 : 200).json({
      message: result.updated
        ? "Leave particular updated successfully"
        : "No changes made",
      data: {
        old_particular: oldParticular,
        new_particular: newParticular,
        updated: result.updated,
        options: result.options,
      },
    });
  } catch (err) {
    const status = err.statusCode || 500;
    return res
      .status(status)
      .json({ message: "Error updating leave particular", error: err.message });
  }
};

const deleteLeaveParticular = async (req, res) => {
  try {
    const particular = String(req.body?.particular || "").trim();
    const result = await Leave.deleteParticular(particular);

    await Backlog.record({
      user_id: req.user?.id || null,
      school_id: null,
      employee_id: null,
      leave_id: null,
      action: "LEAVE_PARTICULAR_DELETED",
      details: particular,
    });

    return res.status(200).json({
      message: "Leave particular deleted successfully",
      data: {
        particular,
        deleted: result.deleted,
        options: result.options,
      },
    });
  } catch (err) {
    const status = err.statusCode || 500;
    return res
      .status(status)
      .json({ message: "Error deleting leave particular", error: err.message });
  }
};

// POST /api/leave
const createLeaveRequest = async (req, res) => {
  try {
    const { employee_id, period_of_leave, particulars } = req.body;

    if (!employee_id || !period_of_leave) {
      return res
        .status(400)
        .json({ message: "employee_id and period_of_leave are required" });
    }

    const validationError = validateLeaveFields(req.body);
    if (validationError)
      return res.status(400).json({ message: validationError });

    const particularValidationError =
      await validateParticularAllowed(particulars);
    if (particularValidationError) {
      return res.status(400).json({
        message: "Validation failed",
        errors: [
          {
            field: "particulars",
            message: particularValidationError,
            source: "body",
          },
        ],
      });
    }

    const employeeId = Number(employee_id);
    if (!Number.isInteger(employeeId) || employeeId <= 0) {
      return res.status(400).json({ message: "employee_id must be valid" });
    }

    const employee = await Employee.getById(employeeId, {
      includeArchived: true,
    });
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }
    const employeeFullName = formatEmployeeFullName(employee);

    if (isSchoolScopedWriteRole(req.user?.role)) {
      if (!isSameSchool(req.user?.school_id, employee.school_id)) {
        return res.status(403).json({
          message:
            "You can only create leave records under your assigned school",
        });
      }
    }

    // Heal any prior inconsistencies before using latest running balances.
    await recomputeEmployeeLeaveLedger(employeeId);

    // Carry forward the running balance from the latest entry
    const latest = await Leave.getLatestByEmployee(employeeId);
    const prev_bal_vl = latest ? parseNum(latest.bal_vl) : 0;
    const prev_bal_sl = latest ? parseNum(latest.bal_sl) : 0;

    const effect = computeEntryEffect(req.body, {
      employeeType: employee.employee_type,
    });

    const paidLeaveBalanceErrors = validatePaidAbsenceAgainstBalance({
      prev_bal_vl,
      prev_bal_sl,
      effect,
    });
    if (paidLeaveBalanceErrors.length > 0) {
      return res.status(400).json({
        message: "Validation failed",
        errors: paidLeaveBalanceErrors.map((msg) => ({
          field: "abs_with_pay",
          message: msg,
          source: "body",
        })),
      });
    }

    const { bal_vl, bal_sl } = computeRunningBalance(
      { bal_vl: prev_bal_vl, bal_sl: prev_bal_sl },
      effect,
    );

    const resolvedParticulars = resolveParticulars(particulars, {
      isMonetization: effect.context.isMonetization,
      isMonthlyCredit: effect.context.entryKind === ENTRY_KIND_MONTHLY_CREDIT,
    });
    const resolvedEntryKind = effect.context.entryKind || ENTRY_KIND_MANUAL;

    const result = await Leave.create({
      employee_id: employeeId,
      period_of_leave,
      entry_kind: resolvedEntryKind,
      particulars: resolvedParticulars,
      earned_vl: effect.earned_vl,
      abs_with_pay_vl: effect.abs_with_pay_vl,
      abs_without_pay_vl: effect.abs_without_pay_vl,
      bal_vl,
      earned_sl: effect.earned_sl,
      abs_with_pay_sl: effect.abs_with_pay_sl,
      abs_without_pay_sl: effect.abs_without_pay_sl,
      bal_sl,
      date_of_action: todayStr(),
    });

    // Keep the full chain consistent after adding a new entry.
    await recomputeEmployeeLeaveLedger(employeeId);

    await Backlog.record({
      user_id: req.user.id,
      school_id: null,
      employee_id: employeeId,
      leave_id: result.insertId,
      action: "LEAVE_CREATED",
      details: `${period_of_leave} — ${employeeFullName}${particulars ? ` — ${particulars}` : ""}`,
    });

    res
      .status(201)
      .json({ message: "Leave entry created successfully", data: result });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error creating leave entry", error: err.message });
  }
};

const drawLeaveCardHeader = (doc) => {
  const marginX = doc.page.margins.left;
  const rightX = doc.page.width - doc.page.margins.right;

  doc
    .font("Times-Bold")
    .fontSize(12)
    .text("Republic of the Philippines", { align: "center", lineGap: 1 })
    .text("Department of Education", { align: "center", lineGap: 1 })
    .text("Region III", { align: "center", lineGap: 1 })
    .text("Division of City of San Jose del Monte", {
      align: "center",
      lineGap: 1,
    })
    .moveDown(0.35)
    .fontSize(14)
    .text("EMPLOYEE LEAVE CARD", { align: "center" })
    .moveDown(0.35);

  const lineY = doc.y;
  doc.moveTo(marginX, lineY).lineTo(rightX, lineY).stroke();
  doc.y = lineY + 14;
  doc.font("Times-Roman");
};

const drawLeaveCardEmployeeMeta = (doc, employee) => {
  const marginX = doc.page.margins.left;
  const contentWidth =
    doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const fullName = [
    employee.first_name,
    employee.middle_name,
    employee.last_name,
  ]
    .filter(Boolean)
    .join(" ");
  const normalizedEmployeeType = normalizeEmployeeType(employee.employee_type);
  const employeeTypeLabel =
    normalizedEmployeeType === "non-teaching"
      ? "Non-Teaching"
      : normalizedEmployeeType === "teaching-related"
        ? "Teaching Related"
        : "Teaching";

  const metaY = doc.y;

  doc
    .fontSize(10)
    .font("Times-Bold")
    .text(`Name of Employee: ${fullName || "-"}`, marginX, metaY, {
      width: contentWidth * 0.55,
      align: "left",
    })
    .text(`Type: ${employeeTypeLabel}`, marginX + contentWidth * 0.56, metaY, {
      width: contentWidth * 0.44,
      align: "left",
    })
    .font("Times-Roman");

  doc.y = metaY + 24;
};

const drawLeaveCardTable = (doc, rows) => {
  const columns = [
    {
      key: "period_of_leave",
      title: "Period of Leave",
      width: 57,
      align: "left",
    },
    {
      key: "particulars",
      title: "Particulars",
      width: 70,
      align: "left",
    },
    {
      key: "earned_vl",
      title: "Earned VL",
      width: 36,
      align: "right",
    },
    {
      key: "abs_with_pay_vl",
      title: "Abs With Pay VL",
      width: 44,
      align: "right",
    },
    {
      key: "abs_without_pay_vl",
      title: "Abs Without Pay VL",
      width: 52,
      align: "right",
    },
    {
      key: "bal_vl",
      title: "Bal VL",
      width: 36,
      align: "right",
    },
    {
      key: "earned_sl",
      title: "Earned SL",
      width: 36,
      align: "right",
    },
    {
      key: "abs_with_pay_sl",
      title: "Abs With Pay SL",
      width: 44,
      align: "right",
    },
    {
      key: "abs_without_pay_sl",
      title: "Abs Without Pay SL",
      width: 52,
      align: "right",
    },
    {
      key: "bal_sl",
      title: "Bal SL",
      width: 36,
      align: "right",
    },
    {
      key: "date_of_action",
      title: "Date and Action Taken / Evaluation",
      width: 72,
      align: "left",
    },
  ];

  const totalTableWidth = columns.reduce((sum, col) => sum + col.width, 0);
  const startX = doc.page.margins.left;
  const headerHeight = 30;
  const rowHeight = 20;
  const headerY = doc.y;

  let x = startX;
  doc.font("Times-Bold").fontSize(8.5);
  for (const column of columns) {
    doc
      .rect(x, headerY, column.width, headerHeight)
      .fillAndStroke("#f3f4f6", "#000000");

    doc.fillColor("#000000").text(column.title, x + 2, headerY + 8, {
      width: column.width - 4,
      align: column.align,
    });

    x += column.width;
  }

  let y = headerY + headerHeight;
  doc.font("Times-Roman").fontSize(9.5);

  if (rows.length === 0) {
    doc.rect(startX, y, totalTableWidth, rowHeight).stroke("#000000");
    doc.text("No leave entries available.", startX + 4, y + 6, {
      width: totalTableWidth - 8,
      align: "center",
    });
    y += rowHeight;
  } else {
    rows.forEach((row, rowIndex) => {
      let colX = startX;

      if (rowIndex % 2 === 1) {
        doc
          .rect(startX, y, totalTableWidth, rowHeight)
          .fillAndStroke("#f3f4f6", "#000000");
      }

      for (const column of columns) {
        const rawValue = row[column.key];
        const value =
          column.key === "date_of_action"
            ? formatDateForCard(rawValue)
            : [
                  "earned_vl",
                  "abs_with_pay_vl",
                  "abs_without_pay_vl",
                  "bal_vl",
                  "earned_sl",
                  "abs_with_pay_sl",
                  "abs_without_pay_sl",
                  "bal_sl",
                ].includes(column.key)
              ? toFixed3(rawValue)
              : String(rawValue || "-");

        doc.rect(colX, y, column.width, rowHeight).stroke("#000000");
        doc.fillColor("#000000").text(value, colX + 2, y + 6, {
          width: column.width - 4,
          align: column.align,
          ellipsis: true,
        });

        colX += column.width;
      }

      y += rowHeight;
    });
  }
};

const splitLeaveCardRows = (rows = []) => {
  const firstPageLimit = 14;
  const nextPageLimit = 20;
  if (!rows.length) return [[]];

  const pages = [];
  pages.push(rows.slice(0, firstPageLimit));

  let cursor = firstPageLimit;
  while (cursor < rows.length) {
    pages.push(rows.slice(cursor, cursor + nextPageLimit));
    cursor += nextPageLimit;
  }

  return pages;
};

const buildLeaveCardPdfBuffer = ({ employee, leaveRows }) =>
  new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", margin: 28 });
      const chunks = [];

      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const pageRows = splitLeaveCardRows(leaveRows || []);

      pageRows.forEach((rows, pageIndex) => {
        if (pageIndex > 0) doc.addPage();
        if (pageIndex === 0) {
          drawLeaveCardHeader(doc);
          drawLeaveCardEmployeeMeta(doc, employee);
        }
        drawLeaveCardTable(doc, rows);
      });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });

const getAllLeaveRequests = async (req, res) => {
  try {
    const { employee_id, page, pageSize } = req.query;
    const filters = {};
    if (employee_id) filters.employee_id = employee_id;

    const scopedSchoolId = isSchoolScopedWriteRole(req.user?.role)
      ? getScopedSchoolId(req)
      : null;
    if (isSchoolScopedWriteRole(req.user?.role) && !scopedSchoolId) {
      return res.status(403).json({
        message: "Your account is not assigned to a valid school",
      });
    }
    if (scopedSchoolId) {
      filters.school_id = scopedSchoolId;
    }

    const pagination = page
      ? { page: Number(page), pageSize: Number(pageSize || 50) }
      : undefined;

    const results = await Leave.getAll(filters, pagination);

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
      .json({ message: "Error retrieving leave records", error: err.message });
  }
};

const getLeaveRequestById = async (req, res) => {
  try {
    const result = await Leave.getById(req.params.id);
    if (!result)
      return res.status(404).json({ message: "Leave record not found" });

    if (isSchoolScopedWriteRole(req.user?.role)) {
      if (!isSameSchool(req.user?.school_id, result.school_id)) {
        return res.status(403).json({
          message: "You can only view leave records under your assigned school",
        });
      }
    }

    res.status(200).json({ data: result });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error retrieving leave record", error: err.message });
  }
};

const getLeavesByEmployee = async (req, res) => {
  try {
    const employeeId = Number(req.params.employee_id);
    if (!Number.isInteger(employeeId) || employeeId <= 0) {
      return res.status(400).json({ message: "Invalid employee id" });
    }

    const employee = await Employee.getById(employeeId, {
      includeArchived: true,
    });
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    if (isSchoolScopedWriteRole(req.user?.role)) {
      if (!isSameSchool(req.user?.school_id, employee.school_id)) {
        return res.status(403).json({
          message: "You can only view leave records under your assigned school",
        });
      }
    }

    await recomputeEmployeeLeaveLedger(employeeId);
    const { page, pageSize } = req.query;
    const pagination = page
      ? { page: Number(page), pageSize: Number(pageSize || 50) }
      : undefined;

    if (!pagination) {
      const results = await Leave.getByEmployeeId(employeeId);
      return res.status(200).json({ data: results });
    }

    const results = await Leave.getAll(
      {
        employee_id: employeeId,
        school_id: isSchoolScopedWriteRole(req.user?.role)
          ? getScopedSchoolId(req)
          : null,
      },
      pagination,
    );
    return res.status(200).json({
      data: results.data,
      total: results.total,
      page: results.page,
      pageSize: results.pageSize,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error retrieving leave records", error: err.message });
  }
};

const getLeaveCardPdf = async (req, res) => {
  try {
    const employeeId = Number(req.params.employee_id);
    if (!Number.isInteger(employeeId) || employeeId <= 0) {
      return res.status(400).json({ message: "Invalid employee id" });
    }

    const employee = await Employee.getById(employeeId, {
      includeArchived: true,
    });
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    if (isSchoolScopedWriteRole(req.user?.role)) {
      if (!isSameSchool(req.user?.school_id, employee.school_id)) {
        return res.status(403).json({
          message:
            "You can only generate leave card PDFs for employees under your assigned school",
        });
      }
    }

    await recomputeEmployeeLeaveLedger(employeeId);
    const leaveRows = await Leave.getByEmployeeId(employeeId);
    const pdfBuffer = await buildLeaveCardPdfBuffer({ employee, leaveRows });

    const fullName = [
      employee.first_name,
      employee.middle_name,
      employee.last_name,
    ]
      .filter(Boolean)
      .join(" ")
      .replace(/[\\/:*?"<>|]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    const safeName = fullName || `Employee-${employeeId}`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${safeName} - Leave Card.pdf"`,
    );
    return res.status(200).send(pdfBuffer);
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Error generating leave card PDF", error: err.message });
  }
};

// PUT /api/leave/:id  — corrects a leave entry and recalculates its balance
const updateLeaveRequest = async (req, res) => {
  try {
    const leave = await Leave.getById(req.params.id);
    if (!leave)
      return res.status(404).json({ message: "Leave record not found" });

    if (isSchoolScopedWriteRole(req.user?.role)) {
      if (!isSameSchool(req.user?.school_id, leave.school_id)) {
        return res.status(403).json({
          message:
            "You can only update leave records under your assigned school",
        });
      }
    }

    const validationError = validateLeaveFields(req.body);
    if (validationError)
      return res.status(400).json({ message: validationError });

    const particularsInput =
      req.body?.particulars !== undefined
        ? req.body.particulars
        : leave.particulars;
    const particularValidationError =
      await validateParticularAllowed(particularsInput);
    if (particularValidationError) {
      return res.status(400).json({
        message: "Validation failed",
        errors: [
          {
            field: "particulars",
            message: particularValidationError,
            source: "body",
          },
        ],
      });
    }

    const {
      period_of_leave = leave.period_of_leave,
      particulars = leave.particulars,
    } = req.body;

    const employeeType = await Leave.getEmployeeTypeById(leave.employee_id);

    const effect = computeEntryEffect(
      {
        ...leave,
        ...req.body,
      },
      { employeeType },
    );

    // Recalculate balance using the entry that came directly before this one
    const prev = await Leave.getPreviousEntry(req.params.id, leave.employee_id);
    const prev_bal_vl = prev ? parseNum(prev.bal_vl) : 0;
    const prev_bal_sl = prev ? parseNum(prev.bal_sl) : 0;

    const { bal_vl, bal_sl } = computeRunningBalance(
      { bal_vl: prev_bal_vl, bal_sl: prev_bal_sl },
      effect,
    );

    const paidLeaveBalanceErrors = validatePaidAbsenceAgainstBalance({
      prev_bal_vl,
      prev_bal_sl,
      effect,
    });
    if (paidLeaveBalanceErrors.length > 0) {
      return res.status(400).json({
        message: "Validation failed",
        errors: paidLeaveBalanceErrors.map((msg) => ({
          field: "abs_with_pay",
          message: msg,
          source: "body",
        })),
      });
    }

    const resolvedParticulars = resolveParticulars(particulars, {
      isMonetization: effect.context.isMonetization,
      isMonthlyCredit: effect.context.entryKind === ENTRY_KIND_MONTHLY_CREDIT,
    });
    const resolvedEntryKind =
      effect.context.entryKind ||
      normalizeEntryKind(leave.entry_kind) ||
      ENTRY_KIND_MANUAL;

    const result = await Leave.update(req.params.id, {
      period_of_leave,
      entry_kind: resolvedEntryKind,
      particulars: resolvedParticulars,
      earned_vl: effect.earned_vl,
      abs_with_pay_vl: effect.abs_with_pay_vl,
      abs_without_pay_vl: effect.abs_without_pay_vl,
      bal_vl,
      earned_sl: effect.earned_sl,
      abs_with_pay_sl: effect.abs_with_pay_sl,
      abs_without_pay_sl: effect.abs_without_pay_sl,
      bal_sl,
      date_of_action: todayStr(),
    });

    // Keep downstream rows consistent when editing historical entries
    await recomputeEmployeeLeaveLedger(leave.employee_id);

    await Backlog.record({
      user_id: req.user.id,
      school_id: null,
      employee_id: leave.employee_id || null,
      leave_id: Number(req.params.id),
      action: "LEAVE_UPDATED",
      details: `${period_of_leave} — ${formatEmployeeFullName(leave)} — record corrected`,
    });

    res
      .status(200)
      .json({ message: "Leave entry updated successfully", data: result });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error updating leave entry", error: err.message });
  }
};

const deleteLeaveRequest = async (req, res) => {
  try {
    const leave = await Leave.getById(req.params.id);
    if (!leave)
      return res.status(404).json({ message: "Leave record not found" });

    if (isSchoolScopedWriteRole(req.user?.role)) {
      if (!isSameSchool(req.user?.school_id, leave.school_id)) {
        return res.status(403).json({
          message:
            "You can only delete leave records under your assigned school",
        });
      }
    }

    const result = await Leave.delete(req.params.id);

    // Keep downstream rows consistent when deleting historical entries
    await recomputeEmployeeLeaveLedger(leave.employee_id);

    await Backlog.record({
      user_id: req.user.id,
      school_id: null,
      employee_id: leave.employee_id || null,
      // Leave row is already deleted above; keep backlog insert valid.
      leave_id: null,
      action: "LEAVE_DELETED",
      details: `${leave.period_of_leave} — ${formatEmployeeFullName(leave)}`,
    });
    res
      .status(200)
      .json({ message: "Leave entry deleted successfully", data: result });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error deleting leave entry", error: err.message });
  }
};

// POST /api/leave/credit-monthly
// Applies +1.25 VL and +1.25 SL to every non-teaching employee for the given month.
// Body: { year?: number, month?: number }  — defaults to current month.
const creditMonthly = async (req, res) => {
  try {
    if (!canManageMonthlyCredit(req.user?.role)) {
      return res.status(403).json({
        message: "Only Admin or Super Admin can apply monthly leave credit",
      });
    }

    const result = await applyMonthlyCredit({
      year: req.body.year,
      month: req.body.month,
      actorUserId: req.user.id,
    });

    res.status(200).json(result);
  } catch (err) {
    const status = err.statusCode || 500;
    const message =
      status === 500 ? "Error applying monthly credit" : err.message;
    res.status(status).json({ message, error: err.message });
  }
};

const deleteMonthlyCredit = async (req, res) => {
  try {
    if (!canManageMonthlyCredit(req.user?.role)) {
      return res.status(403).json({
        message: "Only Admin or Super Admin can delete monthly leave credit",
      });
    }

    const { period } = normalizePeriod(req.body.year, req.body.month);
    const entries = await Leave.getMonthlyCreditEntriesByPeriod(
      period,
      ENTRY_KIND_MONTHLY_CREDIT,
    );

    if (entries.length === 0) {
      return res.status(200).json({
        message: `No applied monthly credit found for ${period}.`,
        period,
        deleted_entries: 0,
        affected_employees: 0,
      });
    }

    const entryIds = entries.map((entry) => entry.id);
    const affectedEmployeeIds = [...new Set(entries.map((e) => e.employee_id))];
    const affectedEmployeeNames = (
      await Promise.all(
        affectedEmployeeIds.map(async (employeeId) => {
          const employee = await Employee.getById(employeeId, {
            includeArchived: true,
          });
          return formatEmployeeFullName(employee);
        }),
      )
    ).filter((name, index, arr) => name && arr.indexOf(name) === index);

    const result = await Leave.deleteByIds(entryIds);

    // Recompute each affected employee to restore correct downstream balances.
    for (const employeeId of affectedEmployeeIds) {
      await recomputeEmployeeLeaveLedger(employeeId);
    }

    await Backlog.record({
      user_id: req.user.id,
      school_id: null,
      employee_id: null,
      leave_id: null,
      action: "LEAVE_MONTHLY_CREDIT_DELETE",
      details: `${period} — deleted ${Number(result.affectedRows || 0)} monthly credit entries — ${affectedEmployeeNames.join(", ") || "employee"}`,
    });

    return res.status(200).json({
      message: `Monthly leave credit deleted for ${period}.`,
      period,
      deleted_entries: Number(result.affectedRows || 0),
      affected_employees: affectedEmployeeIds.length,
    });
  } catch (err) {
    const status = err.statusCode || 500;
    const message =
      status === 500 ? "Error deleting monthly credit" : err.message;
    return res.status(status).json({ message, error: err.message });
  }
};

const simulateMonthlyCredit = async (req, res) => {
  try {
    if (!canManageMonthlyCredit(req.user?.role)) {
      return res.status(403).json({
        message: "Only Admin or Super Admin can simulate monthly leave credit",
      });
    }

    const result = await applyMonthlyCredit({
      year: req.body.year,
      month: req.body.month,
      simulate: true,
    });

    res.status(200).json(result);
  } catch (err) {
    const status = err.statusCode || 500;
    const message =
      status === 500 ? "Error simulating monthly credit" : err.message;
    res.status(status).json({ message, error: err.message });
  }
};

module.exports = {
  createLeaveRequest,
  getAllLeaveRequests,
  getLeaveRequestById,
  getLeavesByEmployee,
  getLeaveCardPdf,
  updateLeaveRequest,
  deleteLeaveRequest,
  creditMonthly,
  deleteMonthlyCredit,
  simulateMonthlyCredit,
  autoCreditCurrentMonth,
  getLeaveParticulars,
  createLeaveParticular,
  updateLeaveParticular,
  deleteLeaveParticular,
};
