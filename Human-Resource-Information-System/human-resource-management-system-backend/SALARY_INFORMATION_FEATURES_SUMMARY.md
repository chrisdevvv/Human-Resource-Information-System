# Salary Information Features Summary

This document records the backend changes implemented for the employee Salary Information feature.

## Scope Implemented

- New Salary Information backend module under employee scope.
- New database table for salary history entries.
- CRUD API endpoints for employee salary entries.
- Audit logging to backlogs for salary create/update/delete operations.
- Automated salary date generation every 3 years.
- Controlled dropdown-style remarks values.
- Automated increment calculation from salary changes.

## 1. Database Table

### Table name
- `salary_information`

### Columns
- `id` (INT, PK, auto-increment)
- `employee_id` (INT, FK -> `employees.id`, ON DELETE CASCADE)
- `salary_date` (DATE, required)
- `plantilla` (VARCHAR(100), nullable)
- `sg` (VARCHAR(20), nullable)
- `step` (VARCHAR(20), nullable)
- `salary` (DECIMAL(12,2), required)
- `increment_amount` (DECIMAL(12,2), nullable)
- `remarks` (ENUM, nullable)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP ON UPDATE)

### Indexes
- `idx_salary_information_employee_id (employee_id)`
- `idx_salary_information_employee_date (employee_id, salary_date)`

### Remarks Enum Values
- `Step Increment`
- `Promotion`
- `Step Increment Increase`

### Migration Behavior
- Existing non-matching remarks values are normalized to `NULL`.
- Column is enforced as ENUM after normalization.

## 2. API Endpoints

Base route: `/api/employees/:employee_id/salary-information`

All endpoints require authentication and are allowed for:
- `data-encoder`
- `admin`
- `super-admin`

### Endpoints
- `GET /api/employees/:employee_id/salary-information`
- `GET /api/employees/:employee_id/salary-information/:id`
- `POST /api/employees/:employee_id/salary-information`
- `PATCH /api/employees/:employee_id/salary-information/:id`
- `DELETE /api/employees/:employee_id/salary-information/:id`

### Validation
- List query supports: `page`, `pageSize`, `sortOrder`
- Create body requires: `date`, `salary`
- Update body supports partial fields (minimum 1 field)
- `remarks` is validated against the 3 allowed enum values

## 3. Authorization and School Scope

- Employee existence is validated before salary operations.
- `admin` and `data-encoder` are school-scoped:
  - They can only access salary information for employees in their assigned school.
- `super-admin` can access across schools.

## 4. Audit Logs (Backlogs)

Salary mutations write activity logs to the backlogs module.

### Actions Added
- `SALARY_INFORMATION_CREATED`
- `SALARY_INFORMATION_UPDATED`
- `SALARY_INFORMATION_DELETED`

### Logged Context
- `user_id`
- `school_id`
- `employee_id`
- `leave_id` = `null`
- `details` summary containing salary-date context (date, plantilla, SG, step, salary, increment, remarks)

## 5. Increment Automation

Increment is now backend-calculated based on salary difference from the previous salary entry of the same employee.

### Rule
- For ordered entries by `(salary_date ASC, id ASC)`:
  - First entry increment = `0`
  - Next entries increment = `max(0, current_salary - previous_salary)`

### Notes
- Input `increment` from request is not used as the source of truth.
- `increment_amount` is recomputed automatically after:
  - create
  - update
  - delete
  - auto-generated 3-year entries

## 6. Three-Year Salary Date Automation

### Logic
- Uses latest salary entry per active employee.
- Computes next date = latest `salary_date` + 3 years.
- Creates missing entries when due (including catch-up for multiple missed 3-year cycles).
- Prevents duplicates by checking `(employee_id, salary_date)` before insert.

### Auto-generated Entry Defaults
- Copies prior values for: `plantilla`, `sg`, `step`, `salary`
- Sets `remarks` to `Step Increment`
- Sets `increment_amount` initial value to `0`, then recomputation aligns increments

### Execution Points
- Runs once on backend startup.
- Runs daily via scheduler at 01:00 AM.

### Time Source
- Automation is based on server/system clock (local backend runtime time), not internet/NTP time.

## 7. Files Added

- `src/modules/employee/salaryInformationModel.js`
- `src/modules/employee/salaryInformationController.js`

## 8. Files Updated

- `src/modules/employee/employeeRoutes.js`
- `src/validation/schemas.js`
- `src/app.js`

## 9. Diagnostics Status

- No diagnostics errors were reported in the touched backend files after implementation.
