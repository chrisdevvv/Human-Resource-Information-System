# Employee Status Features Summary

This document summarizes the recently implemented backend changes for employee lifecycle and availability tracking.

## Scope Covered
- Employee soft archive and restore
- Manual ON LEAVE / AVAILABLE marking
- Employee list filters (`include_archived`, `on_leave`)
- Employee status dashboard counts endpoint
- Startup database schema migrations for these features

## 1. Employee Archive (Soft Delete)

### What was added
- Employees can now be archived instead of immediately hard-deleted.
- Archived employees are hidden from default list views.

### Database fields added
- `is_archived` (TINYINT, default `0`)
- `archived_at` (DATETIME, nullable)
- `archived_by` (INT, nullable)

### API endpoints
- `PATCH /api/employees/:id/archive`
- `PATCH /api/employees/:id/unarchive`

### Access
- `ADMIN`, `SUPER_ADMIN` only

### Logging
- Backlog actions:
  - `EMPLOYEE_ARCHIVED`
  - `EMPLOYEE_UNARCHIVED`

## 2. Employee ON LEAVE Status (Manual)

### What was added
- Admins can explicitly mark an employee as on leave, and restore to available.
- Supports optional leave date range and reason.

### Database fields added
- `on_leave` (TINYINT, default `0`)
- `on_leave_from` (DATE, nullable)
- `on_leave_until` (DATE, nullable)
- `on_leave_reason` (VARCHAR(500), nullable)
- `leave_status_updated_at` (DATETIME, nullable)

### API endpoints
- `PATCH /api/employees/:id/mark-on-leave`
- `PATCH /api/employees/:id/mark-available`

### Request body for mark-on-leave
```json
{
  "on_leave_from": "2026-03-25",
  "on_leave_until": "2026-03-28",
  "reason": "Medical leave"
}
```

### Validation rules
- `on_leave_from`: optional ISO date
- `on_leave_until`: optional ISO date, must be >= `on_leave_from` if both are provided
- `reason`: optional string up to 500 chars

### Access
- `ADMIN`, `SUPER_ADMIN` only

### Logging
- Backlog actions:
  - `EMPLOYEE_MARKED_ON_LEAVE`
  - `EMPLOYEE_MARKED_AVAILABLE`

## 3. Employee List Filtering Enhancements

### Added filters
- `include_archived=true|false` (admin-level only when true)
- `on_leave=true|false`

### Supported endpoints
- `GET /api/employees`
- `GET /api/employees/school/:school_id`

### Examples
- `GET /api/employees?on_leave=true`
- `GET /api/employees?on_leave=false`
- `GET /api/employees?include_archived=true&on_leave=true`
- `GET /api/employees/school/3?on_leave=true`

## 4. Employee Status Counts Endpoint

### What was added
A compact summary endpoint for dashboard cards.

### Endpoint
- `GET /api/employees/status-counts`

### Optional query params
- `school_id` (positive integer)
- `include_archived=true|false` (true honored only for `ADMIN` / `SUPER_ADMIN`)

### Response shape
```json
{
  "data": {
    "total": 25,
    "active_total": 23,
    "on_leave": 5,
    "available": 18,
    "archived": 2,
    "include_archived": true,
    "school_id": 3
  }
}
```

### Access
- `DATA_ENCODER`, `ADMIN`, `SUPER_ADMIN`

## 5. Startup DB Migration Support

The backend now auto-ensures required employee status columns on app startup.

### Startup schema checks now include
- Archive schema ensure
- On-leave schema ensure
- Related indexing (`is_archived`, `archived_by`, `on_leave`)

## 6. Files Updated

1. `src/app.js`
- Added schema ensure routine for on-leave fields
- Startup wiring for employee status schema checks

2. `src/validation/schemas.js`
- Added:
  - `employeeListQuerySchema` support for `on_leave`
  - `employeeMarkOnLeaveBodySchema`
  - `employeeStatusCountsQuerySchema`

3. `src/modules/employee/employeeModel.js`
- Added/updated:
  - Archive-aware listing and school query behavior
  - `archive`, `unarchive`
  - `markOnLeave`, `markAvailable`
  - `getStatusCounts`

4. `src/modules/employee/employeeController.js`
- Added handlers:
  - `archiveEmployee`, `unarchiveEmployee`
  - `markEmployeeOnLeave`, `markEmployeeAvailable`
  - `getEmployeeStatusCounts`
- Added filter parsing for list endpoints

5. `src/modules/employee/employeeRoutes.js`
- Added routes:
  - `/:id/archive`
  - `/:id/unarchive`
  - `/:id/mark-on-leave`
  - `/:id/mark-available`
  - `/status-counts`

## 7. Behavioral Notes

- Archived employees are excluded by default from list endpoints.
- Marking ON LEAVE is blocked for archived employees.
- State conflict responses are explicit (`409`) for already archived/on-leave/available conditions.
- Status counts are computed server-side in one aggregate query for dashboard efficiency.

## 8. Suggested Next Step

- Add automatic ON LEAVE synchronization from approved leave periods in the leave module so manual marking can become optional or fallback-only.
