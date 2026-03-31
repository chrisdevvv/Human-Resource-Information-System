# Backlog Module

Base route: `/api/backlogs`

## Purpose
Stores and serves audit trail entries for major system actions (user changes, leave updates, approvals, and similar events).

## Endpoints
All routes require authentication.
- `GET /`: List all backlog entries.
- `GET /user/:user_id`: List logs for a specific user.
- `GET /school/:school_id`: List logs for a specific school.
- `GET /:id`: Get one log entry by id.
- `POST /`: Create a backlog entry.

## Data Captured
Common fields used when creating logs:
- `user_id`
- `school_id`
- `employee_id`
- `leave_id`
- `action`
- `details`

## Notes
- Most modules write logs through `Backlog.create(...)` as side-effects of operations.
- Log retrieval joins user and school metadata where available.
