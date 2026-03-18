const Leave = require('./leaveModel');
const Backlog = require('../backlog/backlogModel');

const MONTHLY_CREDIT = 1.25;
const parseNum = (v) => parseFloat(v) || 0;
const todayStr = () => new Date().toISOString().slice(0, 10);

const normalizePeriod = (yearInput, monthInput) => {
    const now = new Date();
    const year = yearInput !== undefined ? Number(yearInput) : now.getFullYear();
    const month = monthInput !== undefined ? Number(monthInput) : (now.getMonth() + 1);

    if (!Number.isInteger(year) || year < 1900 || year > 3000) {
        const err = new Error('Invalid year. Please provide a valid year (e.g. 2026).');
        err.statusCode = 400;
        throw err;
    }

    if (!Number.isInteger(month) || month < 1 || month > 12) {
        const err = new Error('Invalid month. Please provide a month from 1 to 12.');
        err.statusCode = 400;
        throw err;
    }

    const monthName = new Date(year, month - 1, 1).toLocaleString('en-PH', { month: 'long' });
    const period = `${monthName} ${year}`;

    return { year, month, period };
};

const NUMERIC_LEAVE_FIELDS = [
    'earned_vl', 'abs_with_pay_vl', 'abs_without_pay_vl',
    'earned_sl', 'abs_with_pay_sl', 'abs_without_pay_sl',
];

// Returns an error message string if any numeric leave field is invalid, otherwise null.
const validateLeaveFields = (data) => {
    for (const field of NUMERIC_LEAVE_FIELDS) {
        const raw = data[field];
        if (raw === undefined || raw === null || raw === '') continue; // optional on update
        const num = Number(raw);
        if (isNaN(num)) return `${field} must be a valid number.`;
        if (num < 0)    return `${field} must not be negative.`;
    }
    return null;
};

const computeBalance = (previous, earned, withPay, withoutPay) => {
    return parseFloat(
        Math.max(0, previous + parseNum(earned) - parseNum(withPay) - parseNum(withoutPay)).toFixed(2)
    );
};

// Recomputes running VL/SL balances for all rows of one employee.
const recomputeEmployeeBalances = async (employee_id) => {
    const rows = await Leave.getByEmployeeOrdered(employee_id);
    let runningVl = 0;
    let runningSl = 0;

    for (const row of rows) {
        const nextVl = computeBalance(
            runningVl,
            row.earned_vl,
            row.abs_with_pay_vl,
            row.abs_without_pay_vl
        );
        const nextSl = computeBalance(
            runningSl,
            row.earned_sl,
            row.abs_with_pay_sl,
            row.abs_without_pay_sl
        );

        if (parseNum(row.bal_vl) !== nextVl || parseNum(row.bal_sl) !== nextSl) {
            await Leave.updateBalancesOnly(row.id, nextVl, nextSl);
        }

        runningVl = nextVl;
        runningSl = nextSl;
    }
};

const applyMonthlyCredit = async ({ year, month, actorUserId = null } = {}) => {
    const { period } = normalizePeriod(year, month);
    const today = todayStr();

    const employees = await Leave.getAllNonTeachingEmployees();
    let credited = 0;
    let skipped = 0;
    const skippedNames = [];

    for (const emp of employees) {
        const alreadyCredited = await Leave.hasEntryForPeriod(emp.id, period);
        if (alreadyCredited) {
            skipped++;
            skippedNames.push(`${emp.first_name} ${emp.last_name}`);
            continue;
        }

        const latest = await Leave.getLatestByEmployee(emp.id);
        const prev_bal_vl = latest ? parseNum(latest.bal_vl) : 0;
        const prev_bal_sl = latest ? parseNum(latest.bal_sl) : 0;

        await Leave.create({
            employee_id: emp.id,
            period_of_leave: period,
            particulars: 'Monthly leave credit',
            earned_vl: MONTHLY_CREDIT,
            abs_with_pay_vl: 0,
            abs_without_pay_vl: 0,
            bal_vl: parseFloat((prev_bal_vl + MONTHLY_CREDIT).toFixed(2)),
            earned_sl: MONTHLY_CREDIT,
            abs_with_pay_sl: 0,
            abs_without_pay_sl: 0,
            bal_sl: parseFloat((prev_bal_sl + MONTHLY_CREDIT).toFixed(2)),
            date_of_action: today,
        });

        if (actorUserId) {
            Backlog.create({
                user_id: actorUserId,
                school_id: null,
                employee_id: emp.id,
                leave_id: null,
                action: 'LEAVE_MONTHLY_CREDIT',
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
        const {
            employee_id, period_of_leave, particulars,
            earned_vl = 0, abs_with_pay_vl = 0, abs_without_pay_vl = 0,
            earned_sl = 0, abs_with_pay_sl = 0, abs_without_pay_sl = 0,
        } = req.body;

        if (!employee_id || !period_of_leave) {
            return res.status(400).json({ message: 'employee_id and period_of_leave are required' });
        }

        const validationError = validateLeaveFields(req.body);
        if (validationError) return res.status(400).json({ message: validationError });

        // Carry forward the running balance from the latest entry
        const latest = await Leave.getLatestByEmployee(employee_id);
        const prev_bal_vl = latest ? parseNum(latest.bal_vl) : 0;
        const prev_bal_sl = latest ? parseNum(latest.bal_sl) : 0;

        const bal_vl = computeBalance(prev_bal_vl, earned_vl, abs_with_pay_vl, abs_without_pay_vl);
        const bal_sl = computeBalance(prev_bal_sl, earned_sl, abs_with_pay_sl, abs_without_pay_sl);

        const result = await Leave.create({
            employee_id,
            period_of_leave,
            particulars: particulars || null,
            earned_vl: parseNum(earned_vl),
            abs_with_pay_vl: parseNum(abs_with_pay_vl),
            abs_without_pay_vl: parseNum(abs_without_pay_vl),
            bal_vl,
            earned_sl: parseNum(earned_sl),
            abs_with_pay_sl: parseNum(abs_with_pay_sl),
            abs_without_pay_sl: parseNum(abs_without_pay_sl),
            bal_sl,
            date_of_action: todayStr(),
        });

        Backlog.create({
            user_id: req.user.id,
            school_id: null,
            employee_id: employee_id || null,
            leave_id: result.insertId,
            action: 'LEAVE_CREATED',
            details: `${period_of_leave}${particulars ? ` — ${particulars}` : ''}`,
        });

        res.status(201).json({ message: 'Leave entry created successfully', data: result });
    } catch (err) {
        res.status(500).json({ message: 'Error creating leave entry', error: err.message });
    }
};

const getAllLeaveRequests = async (req, res) => {
    try {
        const results = await Leave.getAll();
        res.status(200).json({ data: results });
    } catch (err) {
        res.status(500).json({ message: 'Error retrieving leave records', error: err.message });
    }
};

const getLeaveRequestById = async (req, res) => {
    try {
        const result = await Leave.getById(req.params.id);
        if (!result) return res.status(404).json({ message: 'Leave record not found' });
        res.status(200).json({ data: result });
    } catch (err) {
        res.status(500).json({ message: 'Error retrieving leave record', error: err.message });
    }
};

const getLeavesByEmployee = async (req, res) => {
    try {
        const results = await Leave.getByEmployeeId(req.params.employee_id);
        res.status(200).json({ data: results });
    } catch (err) {
        res.status(500).json({ message: 'Error retrieving leave records', error: err.message });
    }
};

// PUT /api/leave/:id  — corrects a leave entry and recalculates its balance
const updateLeaveRequest = async (req, res) => {
    try {
        const leave = await Leave.getById(req.params.id);
        if (!leave) return res.status(404).json({ message: 'Leave record not found' });

        const validationError = validateLeaveFields(req.body);
        if (validationError) return res.status(400).json({ message: validationError });

        const {
            period_of_leave = leave.period_of_leave,
            particulars = leave.particulars,
            earned_vl = leave.earned_vl,
            abs_with_pay_vl = leave.abs_with_pay_vl,
            abs_without_pay_vl = leave.abs_without_pay_vl,
            earned_sl = leave.earned_sl,
            abs_with_pay_sl = leave.abs_with_pay_sl,
            abs_without_pay_sl = leave.abs_without_pay_sl,
        } = req.body;

        // Recalculate balance using the entry that came directly before this one
        const prev = await Leave.getPreviousEntry(req.params.id, leave.employee_id);
        const prev_bal_vl = prev ? parseNum(prev.bal_vl) : 0;
        const prev_bal_sl = prev ? parseNum(prev.bal_sl) : 0;

        const bal_vl = computeBalance(prev_bal_vl, earned_vl, abs_with_pay_vl, abs_without_pay_vl);
        const bal_sl = computeBalance(prev_bal_sl, earned_sl, abs_with_pay_sl, abs_without_pay_sl);

        const result = await Leave.update(req.params.id, {
            period_of_leave, particulars,
            earned_vl: parseNum(earned_vl),
            abs_with_pay_vl: parseNum(abs_with_pay_vl),
            abs_without_pay_vl: parseNum(abs_without_pay_vl),
            bal_vl,
            earned_sl: parseNum(earned_sl),
            abs_with_pay_sl: parseNum(abs_with_pay_sl),
            abs_without_pay_sl: parseNum(abs_without_pay_sl),
            bal_sl,
            date_of_action: todayStr(),
        });

        // Keep downstream rows consistent when editing historical entries
        await recomputeEmployeeBalances(leave.employee_id);

        Backlog.create({
            user_id: req.user.id,
            school_id: null,
            employee_id: leave.employee_id || null,
            leave_id: Number(req.params.id),
            action: 'LEAVE_UPDATED',
            details: `${period_of_leave} — record corrected`,
        });

        res.status(200).json({ message: 'Leave entry updated successfully', data: result });
    } catch (err) {
        res.status(500).json({ message: 'Error updating leave entry', error: err.message });
    }
};

const deleteLeaveRequest = async (req, res) => {
    try {
        const leave = await Leave.getById(req.params.id);
        if (!leave) return res.status(404).json({ message: 'Leave record not found' });
        const result = await Leave.delete(req.params.id);

        // Keep downstream rows consistent when deleting historical entries
        await recomputeEmployeeBalances(leave.employee_id);

        Backlog.create({
            user_id: req.user.id,
            school_id: null,
            employee_id: leave.employee_id || null,
            leave_id: Number(req.params.id),
            action: 'LEAVE_DELETED',
            details: `${leave.period_of_leave} — ${leave.full_name || 'employee'}`,
        });
        res.status(200).json({ message: 'Leave entry deleted successfully', data: result });
    } catch (err) {
        res.status(500).json({ message: 'Error deleting leave entry', error: err.message });
    }
};

// POST /api/leave/credit-monthly
// Applies +1.25 VL and +1.25 SL to every non-teaching employee for the given month.
// Body: { year?: number, month?: number }  — defaults to current month.
const creditMonthly = async (req, res) => {
    try {
        if (!['SUPER_ADMIN', 'ADMIN'].includes(req.user.role)) {
            return res.status(403).json({ message: 'Only Admin or Super Admin can apply monthly leave credit' });
        }

        const result = await applyMonthlyCredit({
            year: req.body.year,
            month: req.body.month,
            actorUserId: req.user.id,
        });

        res.status(200).json(result);
    } catch (err) {
        const status = err.statusCode || 500;
        const message = status === 500 ? 'Error applying monthly credit' : err.message;
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
