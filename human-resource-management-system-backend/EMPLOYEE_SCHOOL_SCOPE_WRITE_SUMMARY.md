# Employee School-Scoped Write Access Summary

## Overview
This document summarizes the backend update that restricts employee write operations by school scope.

## Business Rule Implemented
- Admin and Data Encoder can only create, edit, and delete employee records for their own assigned school.
- Super Admin can create, edit, and delete employee records across all schools.

## Endpoints Affected
- `POST /api/employees`
- `PUT /api/employees/:id`
- `DELETE /api/employees/:id`

## Access and Scope Rules
### Create Employee (`POST /api/employees`)
- `ADMIN` / `DATA_ENCODER`:
  - Request is allowed only when `req.body.school_id` equals the user's assigned `school_id`.
- `SUPER_ADMIN`:
  - No school restriction.

### Update Employee (`PUT /api/employees/:id`)
- `ADMIN` / `DATA_ENCODER`:
  - Can update only if the target employee currently belongs to the same school as the user.
  - Cannot reassign employee to another school (`req.body.school_id` must match user's school).
- `SUPER_ADMIN`:
  - No school restriction.

### Delete Employee (`DELETE /api/employees/:id`)
- `ADMIN` / `DATA_ENCODER`:
  - Can delete only if the target employee belongs to the same school as the user.
- `SUPER_ADMIN`:
  - No school restriction.

## Technical Changes
### Routes Updated
- File: `src/modules/employee/employeeRoutes.js`
- Write routes now permit `data-encoder`, `admin`, and `super-admin`.
- School-scope enforcement is implemented in controller logic.

### Controller Updated
- File: `src/modules/employee/employeeController.js`
- Added helper checks:
  - school-scoped write role detection (`ADMIN`, `DATA_ENCODER`)
  - same-school comparison logic
- Added scoped authorization checks in:
  - `createEmployee`
  - `updateEmployee`
  - `deleteEmployee`

## Error Behavior
When school-scope validation fails for `ADMIN` or `DATA_ENCODER`, API returns:
- HTTP `403 Forbidden`
- Message indicating that operation is limited to the user's assigned school.

## Security Impact
- Prevents cross-school employee record manipulation by non-super-admin roles.
- Enforces school-based tenancy boundaries at backend level.
- Ensures direct API calls cannot bypass UI school restrictions.

## Validation Status
- Diagnostics report no backend errors in modified employee route/controller files after this change.
