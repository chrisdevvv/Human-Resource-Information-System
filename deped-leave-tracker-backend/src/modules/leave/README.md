# Leave Module — Backend Documentation

## Overview

This module manages the digital employee leave card (CS Form No. 6) for DepEd employees. It tracks Vacation Leave (VL) and Sick Leave (SL) balances using a running ledger per employee, following Civil Service Commission (CSC) rules.

---

## Files

| File | Purpose |
|---|---|
| `leaveRoutes.js` | Defines all HTTP endpoints and applies auth middleware |
| `leaveController.js` | Business logic — validation, balance computation, cascade recompute |
| `leaveModel.js` | Database queries — all direct SQL interactions |

---

## API Endpoints

All endpoints require a valid JWT token in the `Authorization: Bearer <token>` header.

| Method | Path | Description | Role Required |
|---|---|---|---|
| `GET` | `/api/leave` | Get all leave records (with employee name) | Any |
| `GET` | `/api/leave/:id` | Get a single leave record by ID | Any |
| `GET` | `/api/leave/employee/:employee_id` | Get all leave records for one employee | Any |
| `POST` | `/api/leave` | Create a new leave entry | Any |
| `PUT` | `/api/leave/:id` | Correct/update a leave entry | Any |
| `DELETE` | `/api/leave/:id` | Delete a leave entry | Any |
| `POST` | `/api/leave/credit-monthly` | Apply monthly +1.25 VL/SL to all non-teaching employees | ADMIN or SUPER_ADMIN |

---

## Database Table: `leaves`

| Column | Type | Description |
|---|---|---|
| `id` | int | Primary key, auto-increment |
| `employee_id` | int | FK → employees.id (required) |
| `period_of_leave` | text | Label for the month/period (e.g. "March 2026") |
| `particulars` | text | Notes about the leave (optional) |
| `earned_vl` | decimal(10,2) | VL credits earned this period |
| `abs_with_pay_vl` | decimal(10,2) | VL days used with pay |
| `abs_without_pay_vl` | decimal(10,2) | VL days used without pay |
| `bal_vl` | decimal(10,2) | Running VL balance (computed by backend) |
| `earned_sl` | decimal(10,2) | SL credits earned this period |
| `abs_with_pay_sl` | decimal(10,2) | SL days used with pay |
| `abs_without_pay_sl` | decimal(10,2) | SL days used without pay |
| `bal_sl` | decimal(10,2) | Running SL balance (computed by backend) |
| `date_of_action` | date | Date the entry was recorded (auto-set by backend) |
| `created_at` | timestamp | Auto-set on insert |

---

## Balance Computation Rules

### Formula

The backend always computes `bal_vl` and `bal_sl`. The frontend must never send these — they are ignored even if provided.

```
bal_vl = max(0, previous_bal_vl + earned_vl - abs_with_pay_vl - abs_without_pay_vl)
bal_sl = max(0, previous_bal_sl + earned_sl - abs_with_pay_sl - abs_without_pay_sl)
```

- Balances are rounded to 2 decimal places.
- Balances never go below 0.
- If an employee has no previous entries, the starting balance is 0.

### Where "previous balance" comes from

| Operation | Previous balance source |
|---|---|
| **Create** | Latest existing leave row for that employee (`ORDER BY id DESC LIMIT 1`) |
| **Update** | The row directly before the edited row (`id < current_id ORDER BY id DESC LIMIT 1`) |
| **Monthly credit** | Latest existing leave row for that employee |

---

## Cascade Recompute

When a leave record is **updated** or **deleted**, all subsequent rows for the same employee are automatically recomputed in sequence to keep downstream balances accurate.

### How it works

1. All leave rows for the employee are fetched in ascending `id` order.
2. The system walks each row from the first to the last.
3. For each row it recalculates `bal_vl` and `bal_sl` using the formula above, carrying forward the running total.
4. If a row's stored balance differs from the recalculated value, `UPDATE leaves SET bal_vl = ?, bal_sl = ?` is issued for that row only.
5. Rows already correct are not touched.

This means editing a record from 6 months ago will automatically fix every row after it.

---

## Creating a Leave Entry (`POST /api/leave`)

### Required fields
- `employee_id` — integer
- `period_of_leave` — string (e.g. `"March 2026"`)

### Optional fields (default to 0 if not sent)
- `earned_vl`, `abs_with_pay_vl`, `abs_without_pay_vl`
- `earned_sl`, `abs_with_pay_sl`, `abs_without_pay_sl`
- `particulars` — free text description

### What the backend does
1. Validates required fields.
2. Validates all numeric fields (must be valid numbers, must not be negative).
3. Fetches the employee's latest leave row for balance carry-forward.
4. Computes `bal_vl` and `bal_sl`.
5. Sets `date_of_action` to today's date automatically.
6. Saves the record.
7. Writes a `LEAVE_CREATED` entry to the activity log.

### Example request body
```json
{
  "employee_id": 3,
  "period_of_leave": "March 2026",
  "particulars": "Sick leave - fever",
  "earned_vl": 1.25,
  "earned_sl": 1.25,
  "abs_with_pay_sl": 1
}
```

---

## Updating a Leave Entry (`PUT /api/leave/:id`)

### Behavior
- Only fields sent in the request body are updated; all others retain their existing values.
- `bal_vl` and `bal_sl` from the request are ignored — they are always recomputed.
- After saving, the cascade recompute runs for all later rows of the same employee.
- `date_of_action` is updated to today.

### Example request body (partial update)
```json
{
  "abs_with_pay_sl": 2,
  "particulars": "Corrected — approved sick leave"
}
```

---

## Deleting a Leave Entry (`DELETE /api/leave/:id`)

- The row is deleted.
- The cascade recompute then runs for all remaining rows of the same employee, so their balances reflect the gap.
- A `LEAVE_DELETED` entry is written to the activity log.

---

## Monthly Leave Credit (`POST /api/leave/credit-monthly`)

### Who can use it
- `ADMIN` or `SUPER_ADMIN` only. Returns `403` for any other role.

### How it works
1. Accepts optional `year` and `month` in the request body. Defaults to the current month and year if not provided.
2. Builds a period string like `"March 2026"`.
3. Fetches all employees where `employee_type = 'non-teaching'`.
4. For each employee:
   - Checks if a leave entry already exists for that period. If yes, **skips** that employee (prevents double crediting).
   - Fetches the employee's latest leave row for the previous balance.
   - Creates a new row with `earned_vl = 1.25`, `earned_sl = 1.25`, all absences = 0.
   - Computes and saves the new running balance.
5. Returns a summary.

### Teaching employees
Teaching employees are completely excluded from this endpoint. They do not accumulate monthly VL/SL credits under CSC rules.

### Example request body
```json
{
  "year": 2026,
  "month": 3
}
```

### Example response
```json
{
  "message": "Monthly leave credit applied for March 2026.",
  "period": "March 2026",
  "credited": 12,
  "skipped": 2,
  "skipped_employees": ["Juan Dela Cruz", "Maria Santos"]
}
```

---

## Input Validation

All numeric leave fields (`earned_vl`, `abs_with_pay_vl`, `abs_without_pay_vl`, `earned_sl`, `abs_with_pay_sl`, `abs_without_pay_sl`) are validated on both create and update:

| Rule | Error response |
|---|---|
| Must be a valid number | `400` — `"earned_vl must be a valid number."` |
| Must not be negative | `400` — `"abs_with_pay_sl must not be negative."` |

Fields that are omitted on update are not validated — they inherit the existing value.

---

## Activity Logging

Every mutating operation writes a fire-and-forget entry to the `backlogs` table. These appear in the Super Admin Activity Logs page.

| Action | Trigger |
|---|---|
| `LEAVE_CREATED` | New leave entry created |
| `LEAVE_UPDATED` | Leave entry corrected |
| `LEAVE_DELETED` | Leave entry deleted |
| `LEAVE_MONTHLY_CREDIT` | Monthly credit applied to an employee |

---

## Model Methods Reference

| Method | Description |
|---|---|
| `getAll()` | All leave records joined with employee name and type |
| `getById(id)` | Single leave record with employee info |
| `getByEmployeeId(employee_id)` | All records for one employee |
| `getByEmployeeOrdered(employee_id)` | All records for one employee in ascending id order (used for cascade recompute) |
| `create(data)` | Insert a new leave row |
| `update(id, data)` | Update an existing leave row |
| `delete(id)` | Delete a leave row |
| `getLatestByEmployee(employee_id)` | Most recent leave row for balance carry-forward |
| `getPreviousEntry(id, employee_id)` | Row directly before the given id for the same employee |
| `updateBalancesOnly(id, bal_vl, bal_sl)` | Updates only bal_vl and bal_sl — used during cascade recompute |
| `hasEntryForPeriod(employee_id, period)` | Checks if a period entry already exists (prevents double monthly credit) |
| `getAllNonTeachingEmployees()` | Returns all employees where employee_type = 'non-teaching' |

---

## Special Entry Behavior

Some entries are records only and do not deduct from the balance:
- Disapproved leave
- Compensatory paid leave
- Any entry where all absence fields are 0

In these cases, `earned` and `abs` values are all 0, so the balance formula produces the same balance as the previous row. No special handling is needed — the formula handles this naturally.
