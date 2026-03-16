const Leave = require('./leaveModel');
const Backlog = require('../backlog/backlogModel');

const MONTHLY_CREDIT = 1.25;
const parseNum = (v) => parseFloat(v) || 0;
const todayStr = () => new Date().toISOString().slice(0, 10);

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

        const now = new Date();
        const year  = req.body.year  ? parseInt(req.body.year)  : now.getFullYear();
        const month = req.body.month ? parseInt(req.body.month) : now.getMonth() + 1;

        const monthName = new Date(year, month - 1, 1)
            .toLocaleString('en-PH', { month: 'long' });
        const period = `${monthName} ${year}`;
        const today  = todayStr();

        const employees = await Leave.getAllNonTeachingEmployees();
        let credited = 0;
        let skipped  = 0;
        const skippedNames = [];

        for (const emp of employees) {
            // Prevent double-crediting the same period
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

            Backlog.create({
                user_id: req.user.id,
                school_id: null,
                employee_id: emp.id,
                leave_id: null,
                action: 'LEAVE_MONTHLY_CREDIT',
                details: `${emp.first_name} ${emp.last_name} — ${period}`,
            });

            credited++;
        }

        res.status(200).json({
            message: `Monthly leave credit applied for ${period}.`,
            period,
            credited,
            skipped,
            ...(skippedNames.length > 0 && { skipped_employees: skippedNames }),
        });
    } catch (err) {
        res.status(500).json({ message: 'Error applying monthly credit', error: err.message });
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
};
