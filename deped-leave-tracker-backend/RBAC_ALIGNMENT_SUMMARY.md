# DepEd Leave Tracker - RBAC Alignment Summary

This document summarizes the backend RBAC alignment changes applied to remove frontend-only restrictions and enforce the same rules at the API level.

---

## 1. Change Objective

Align backend authorization with frontend access policy for:
1. User and Roles visibility
2. Activity Logs (Backlogs) access

This closes the gap where users could still access restricted API endpoints directly even if the UI hid those features.

---

## 2. Files Updated

1. `src/modules/user/userRoutes.js`
2. `src/modules/backlog/backlogRoutes.js`

---

## 3. Route Changes

### A. User Module

File: `src/modules/user/userRoutes.js`

Updated role middleware on read endpoints:
1. `GET /api/users`
   - Before: `data-encoder`, `admin`, `super-admin`
   - After: `admin`, `super-admin`
2. `GET /api/users/:id`
   - Before: `data-encoder`, `admin`, `super-admin`
   - After: `admin`, `super-admin`

Effect:
- Data Encoder can no longer access user listing/detail endpoints through direct API calls.

### B. Backlog Module

File: `src/modules/backlog/backlogRoutes.js`

Updated role middleware on all backlog endpoints:
1. `GET /api/backlogs`
2. `GET /api/backlogs/report`
3. `GET /api/backlogs/user/:user_id`
4. `GET /api/backlogs/school/:school_id`
5. `GET /api/backlogs/:id`
6. `POST /api/backlogs`
7. `PATCH /api/backlogs/archive`

All changed from:
- Before: `admin`, `super-admin`

To:
- After: `super-admin` only

Effect:
- Activity logs and log reporting are now enforced as Super Admin-only on the backend.

---

## 4. Access Matrix (After Change)

| Feature / Endpoint Group | Data Encoder | Admin | Super Admin |
|---|---|---|---|
| User list/detail (`/api/users`, `/api/users/:id`) | Denied | Allowed | Allowed |
| Backlogs and reports (`/api/backlogs*`) | Denied | Denied | Allowed |

---

## 5. Validation Status

Post-change diagnostics:
1. `src/modules/user/userRoutes.js` - No errors found
2. `src/modules/backlog/backlogRoutes.js` - No errors found

---

## 6. Security Impact

1. Removes backend/frontend RBAC mismatch for Users and Logs.
2. Reduces risk of privilege escalation through direct API access.
3. Makes policy intent explicit at route middleware level.

---

## 7. Recommended Follow-Up

1. Add automated RBAC tests for role/endpoint matrix:
   - Data Encoder denied on `/api/users` and `/api/users/:id`
   - Admin denied on `/api/backlogs*`
   - Super Admin allowed on both groups
2. Optionally add controller-level deny checks as defense-in-depth for the same restricted paths.
