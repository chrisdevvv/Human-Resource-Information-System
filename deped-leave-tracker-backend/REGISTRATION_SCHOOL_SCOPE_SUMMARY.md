# Registration School Scope Summary

## Overview
This document summarizes the backend changes that enforce school-scoped registration review.

## Business Rule Implemented
- Super Admin can review (view, approve, reject) registration requests across all schools.
- Admin can review only registration requests under the same school assigned to the admin account.
- Data Encoder can review only registration requests under the same school assigned to the data encoder account.

## API Behavior
### Registration Listing and Retrieval
- `GET /api/registrations`
- `GET /api/registrations/pending`
- `GET /api/registrations/:id`

Behavior:
- Super Admin: receives all matching records.
- Admin/Data Encoder: receives only records where `registration_requests.school_name` matches the user's assigned school.

### Registration Approval
- `POST /api/registrations/:id/approve`

Behavior:
- Super Admin: can approve any pending request.
- Admin/Data Encoder: can approve only pending requests within their assigned school.
- Admin/Data Encoder approvals are constrained to `DATA_ENCODER` role assignment.

### Registration Rejection
- `POST /api/registrations/:id/reject`

Behavior:
- Super Admin: can reject any pending request.
- Admin/Data Encoder: can reject only pending requests within their assigned school.

## Technical Changes
### Routes Updated
- `src/modules/registration/registrationRoutes.js`
- Added `data-encoder` role access to registration routes.
- Controller now applies school-scope authorization for restricted roles.

### Controller Updated
- `src/modules/registration/registrationController.js`
- Added centralized scope resolver to identify if user is:
  - super-admin (global scope), or
  - admin/data-encoder (school-limited scope).
- Applied scope to list, pending list, get-by-id, approve, and reject handlers.
- Improved status-code handling for scoped authorization errors.

### Model Updated
- `src/modules/registration/registrationModel.js`
- Extended `getAll(status, options)` to support optional `schoolName` filtering.
- Extended `getById(id, options)` to support optional `schoolName` filtering.
- Added `getSchoolNameById(school_id)` helper for resolving reviewer scope.

## Security and Data Integrity Notes
- Scope checks are enforced in backend controller/model layers, not just frontend.
- Scoped users cannot process registrations outside their school even if they call APIs directly.
- Super Admin remains fully unrestricted.

## Expected UX Impact
- Admin/Data Encoder registration queues will now show only same-school requests.
- Attempts to access or process other-school registrations will return not found within scope.
- Super Admin interface remains unchanged for cross-school review.
