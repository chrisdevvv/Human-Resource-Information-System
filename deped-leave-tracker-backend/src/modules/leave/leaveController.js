const Leave = require("./leaveModel");
const Backlog = require("../backlog/backlogModel");

const MONTHLY_CREDIT = 1.25;
const ENTRY_KIND_MANUAL = "MANUAL";
const ENTRY_KIND_MONTHLY_CREDIT = "MONTHLY_CREDIT";
const parseNum = (v) => {
  const parsed = Number(v);
  return Number.isFinite(parsed) ? parsed : 0;
};
const round2 = (v) => parseFloat(parseNum(v).toFixed(2));
const todayStr = () => new Date().toISOString().slice(0, 10);
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
  return employeeType.trim().toLowerCase().replace(/_/g, "-");
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

const applyMonthlyCredit = async ({ year, month, actorUserId = null } = {}) => {
  const { period } = normalizePeriod(year, month);
  const today = todayStr();

  const employees = await Leave.getAllNonTeachingEmployees();
  const expectedCredit = getMonthlyCreditByEmployeeType("non-teaching");
  let credited = 0;
  let skipped = 0;
  const skippedNames = [];

  for (const emp of employees) {
    const monthlyCredit = getMonthlyCreditByEmployeeType(emp.employee_type);
    if (monthlyCredit.earnedVL <= 0 && monthlyCredit.earnedSL <= 0) {
      skipped++;
      skippedNames.push(`${emp.first_name} ${emp.last_name}`);
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
      skippedNames.push(`${emp.first_name} ${emp.last_name}`);
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
        details: `${emp.first_name} ${emp.last_name} — ${period}`,
      });
    }

    credited++;
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

    const employeeType = await Leave.getEmployeeTypeById(employee_id);
    if (!employeeType) {
      return res.status(404).json({ message: "Employee not found" });
    }

    // Heal any prior inconsistencies before using latest running balances.
    await recomputeEmployeeLeaveLedger(employee_id);

    // Carry forward the running balance from the latest entry
    const latest = await Leave.getLatestByEmployee(employee_id);
    const prev_bal_vl = latest ? parseNum(latest.bal_vl) : 0;
    const prev_bal_sl = latest ? parseNum(latest.bal_sl) : 0;

    const effect = computeEntryEffect(req.body, { employeeType });

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
      employee_id,
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
    await recomputeEmployeeLeaveLedger(employee_id);

    await Backlog.record({
      user_id: req.user.id,
      school_id: null,
      employee_id: employee_id || null,
      leave_id: result.insertId,
      action: "LEAVE_CREATED",
      details: `${period_of_leave}${particulars ? ` — ${particulars}` : ""}`,
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

const getAllLeaveRequests = async (req, res) => {
  try {
    const { employee_id, page, pageSize } = req.query;
    const filters = {};
    if (employee_id) filters.employee_id = employee_id;

    const pagination = page
      ? { page: Number(page), pageSize: Number(pageSize || 50) }
      : undefined;

    const results = await Leave.getAll(filters, pagination);

    if (!pagination) return res.status(200).json({ data: results });
    return res
      .status(200)
      .json({
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
    res.status(200).json({ data: result });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error retrieving leave record", error: err.message });
  }
};

const getLeavesByEmployee = async (req, res) => {
  try {
    await recomputeEmployeeLeaveLedger(req.params.employee_id);
    const { page, pageSize } = req.query;
    const pagination = page
      ? { page: Number(page), pageSize: Number(pageSize || 50) }
      : undefined;

    if (!pagination) {
      const results = await Leave.getByEmployeeId(req.params.employee_id);
      return res.status(200).json({ data: results });
    }

    const results = await Leave.getAll(
      { employee_id: req.params.employee_id },
      pagination,
    );
    return res
      .status(200)
      .json({
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

// PUT /api/leave/:id  — corrects a leave entry and recalculates its balance
const updateLeaveRequest = async (req, res) => {
  try {
    const leave = await Leave.getById(req.params.id);
    if (!leave)
      return res.status(404).json({ message: "Leave record not found" });

    const validationError = validateLeaveFields(req.body);
    if (validationError)
      return res.status(400).json({ message: validationError });

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
      details: `${period_of_leave} — record corrected`,
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
    const result = await Leave.delete(req.params.id);

    // Keep downstream rows consistent when deleting historical entries
    await recomputeEmployeeLeaveLedger(leave.employee_id);

    await Backlog.record({
      user_id: req.user.id,
      school_id: null,
      employee_id: leave.employee_id || null,
      leave_id: Number(req.params.id),
      action: "LEAVE_DELETED",
      details: `${leave.period_of_leave} — ${leave.full_name || "employee"}`,
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
    if (!["SUPER_ADMIN", "ADMIN"].includes(req.user.role)) {
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

module.exports = {
  createLeaveRequest,
  getAllLeaveRequests,
  getLeaveRequestById,
  getLeavesByEmployee,
  updateLeaveRequest,
  deleteLeaveRequest,
  creditMonthly,
  autoCreditCurrentMonth,
};
