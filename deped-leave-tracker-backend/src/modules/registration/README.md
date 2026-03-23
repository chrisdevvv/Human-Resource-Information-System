# Registration Module

Base route: `/api/registrations`

## Purpose
Supports admin review workflow for pending account registrations.

## Endpoints
All routes require authentication.
- `GET /`: List registration requests (supports status filtering via query).
- `GET /pending`: List pending registration requests.
- `GET /:id`: Get one registration request.
- `POST /:id/approve`: Approve a registration request.
- `POST /:id/reject`: Reject a registration request.

## Role Rules
- Approve: allowed for `SUPER_ADMIN` and `ADMIN`.
- Reject: allowed for `SUPER_ADMIN` only.
- Admin approvals are constrained to `DATA_ENCODER` role assignment.

## Workflow Notes
- Approval creates a user account from the request in a DB transaction.
- Missing schools can be auto-created during approval.
- Approval and rejection trigger email notifications and backlog entries.
