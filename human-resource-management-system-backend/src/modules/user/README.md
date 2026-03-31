# User & Roles — Backend Module

## Overview
This module handles all user management operations for the Super Admin dashboard, including listing users, updating roles, toggling account status, and deleting accounts.

---

## Files

| File | Purpose |
|------|---------|
| `userModel.js` | Database queries against the `users` and `schools` tables |
| `userController.js` | Request handling, input validation, safety guards |
| `userRoutes.js` | Express route definitions, all protected by `authMiddleware` |

---

## Endpoints

Base path: `/api/users`

| Method | Path | Description | Body |
|--------|------|-------------|------|
| `GET` | `/` | List all users | — |
| `GET` | `/:id` | Get a single user with school info | — |
| `PATCH` | `/:id/role` | Update a user's role | `{ role }` |
| `PATCH` | `/:id/status` | Activate or deactivate a user | `{ is_active: true \| false }` |
| `DELETE` | `/:id` | Delete a user permanently | — |

### Query Parameters for `GET /`

| Param | Type | Description |
|-------|------|-------------|
| `search` | string | Filters by first name, last name, email, or school name |
| `role` | string | `SUPER_ADMIN`, `ADMIN`, or `DATA_ENCODER` |
| `is_active` | number | `1` (active) or `0` (inactive) |

---

## Safety Guards (in controller)

- Cannot update your own role
- Cannot deactivate your own account
- Cannot delete your own account

---

## Response Format

All endpoints return JSON:

```json
// Success list
{ "data": [ ...users ] }

// Success single
{ "data": { ...user } }

// Success action
{ "message": "..." }

// Error
{ "message": "...", "error": "..." }
```

Each user object includes: `id`, `first_name`, `last_name`, `email`, `role`, `is_active`, `created_at`, `updated_at`, `school_name`, `school_code`.

---

## Authentication

All routes require a valid JWT via `Authorization: Bearer <token>` header.
