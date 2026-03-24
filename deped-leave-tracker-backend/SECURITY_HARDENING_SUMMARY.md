# DepEd Leave Tracker — Backend Security Hardening Summary

This document summarizes all security improvements and structural enhancements made to the backend during this development session.

---

## 1. Input Validation Baseline

### New Files
- **`src/middleware/validateRequest.js`**
  - Generic Joi-based request validation middleware
  - Validates params, query, and body against configurable schemas
  - Returns structured 400 errors with field-level details
  - Converts types and strips unknown fields

- **`src/validation/schemas.js`**
  - Centralized Joi schema definitions for all route payloads
  - Includes schemas for:
    - ID parameters, school ID parameters
    - Employee, school, user creation/update bodies
    - User role, status, password reset bodies
    - Registration status queries and approval/rejection bodies
  - All schemas enforce type safety, length limits, and enum constraints

### Updated Files
- **`src/modules/employee/employeeRoutes.js`**
  - Added validation middleware to all CRUD routes
  - Validates school_id and employee id params, employee body payloads

- **`src/modules/school/schoolRoutes.js`**
  - Added validation middleware to all CRUD routes
  - Validates school id params and school body payloads

- **`src/modules/user/userRoutes.js`**
  - Added validation middleware to all user management routes
  - Validates id params, user query filters, role/status/password bodies

- **`src/modules/registration/registrationRoutes.js`**
  - Added validation middleware to registration routes
  - Validates status queries, id params, approval and rejection bodies

---

## 2. Access Control Consistency

### Route-Level RBAC Enforcement

**`src/modules/school/schoolRoutes.js`**
- Enhanced with explicit `authMiddleware` on all routes
- Read operations (GET) require: `DATA_ENCODER`, `ADMIN`, or `SUPER_ADMIN` roles
- Write operations (POST, PUT, DELETE) restricted to `ADMIN` or `SUPER_ADMIN`
- All routes now enforce role-based access checks at middleware layer (not just in controller)

**`src/modules/registration/registrationRoutes.js`**
- Added explicit `roleAuthMiddleware` to all routes (previously missing)
- All routes now require `ADMIN` or `SUPER_ADMIN` role
- Consistent with registration approval/rejection controller checks

### Key Principle
Every route now has:
1. Authentication check (`authMiddleware`)
2. Role-level authorization (`roleAuthMiddleware` with specific role list)
3. Input validation (`validateRequest` with schema)

This ensures no accidental open endpoints exist in the API surface.

---

## 3. Audit Trail Completeness

### Updated Backlog Infrastructure

**`src/modules/backlog/backlogModel.js`**
- Added `record()` helper method for simplified audit logging
- Normalizes and validates audit action and details fields
- Single entry point for all backlog writes

**`src/modules/backlog/backlogController.js`**
- Updated to use `Backlog.record()` instead of `Backlog.create()`

### Sensitive Write Operations Now Always Logged

**`src/modules/school/schoolController.js`**
- All write operations (`createSchool`, `updateSchool`, `deleteSchool`) now await backlog logging
- Logs include school name, code, and action type
- User ID is captured from authenticated request

**`src/modules/employee/employeeController.js`**
- All write operations now await `Backlog.record()` instead of fire-and-forget
- Ensures employee create/update/delete actions are reliably recorded

**`src/modules/user/userController.js`**
- Role changes log as `USER_ROLE_UPDATED` with before/after roles
- Status changes log as `USER_STATUS_UPDATED`
- User deletion logs actor and target user info
- Admin password resets log as `USER_PASSWORD_RESET`
- User creation logs school assignment

**`src/modules/leave/leaveController.js`**
- Leave create/update/delete operations now await backlog logging
- Ensures ledger consistency is audited

**`src/modules/registration/registrationController.js`**
- Approval logs as `REGISTRATION_APPROVED` with assigned role
- Rejection logs as `REGISTRATION_REJECTED` with optional reason

### Impact
- All sensitive state changes are now guaranteed to be recorded
- Supports compliance audits, incident investigation, and accountability tracking
- No more silent failures if backlog insert fails (async operations now properly awaited)

---

## 4. App-Level Security Middleware Baseline

### `src/app.js` — Enhanced Middleware Stack

**Helmet Integration**
- Added `helmet()` middleware with default security headers
- Configured `crossOriginResourcePolicy: { policy: "cross-origin" }` for CORS compatibility

**Strict CORS Allowlist**
- Replaced permissive `cors()` with explicit origin validation
- Default allowlist: `http://localhost:3001`, `http://127.0.0.1:3001`
- Environment override via `CORS_ORIGIN_ALLOWLIST` or `CORS_ALLOWED_ORIGINS` (comma-separated)
- Server-to-server calls (no origin header) are whitelisted
- Any origin not in allowlist receives `403 CORS blocked` error

**Request Body Size Limits**
- JSON payloads: `100kb` (configurable via `MAX_JSON_BODY_SIZE`)
- URL-encoded form data: `100kb` (configurable via `MAX_FORM_BODY_SIZE`)
- Prevents accidental or malicious oversized request attacks

---

## 5. Authentication & Token Security Hardening

### `src/modules/auth/authController.js`

**Password Reset Token Enforcement**
- Added `verifyPasswordResetToken()` helper with strict `maxAge` validation
- Reset token TTL now centralizes via `RESET_TOKEN_TTL` constant (default: "2h")
- Tokens expire after configured TTL; no silent acceptance of old tokens
- Clear error messages distinguish expired vs. invalid tokens
- Strict clock tolerance (0 seconds) prevents timing attacks

**Backend Brute-Force Login Lockout** (Previously implemented)
- Login attempts tracked per email + IP combination
- After 3 failed attempts (configurable), account locks for 60 seconds (configurable)
- Lockout stored in `login_attempts` table with automatic cleanup
- Failed login attempts increment counter and return 429 (Too Many Requests) with retry-after

### `src/utils/mailer.js`
- Reset link validity text made configurable via `RESET_PASSWORD_TOKEN_TTL_LABEL` env var
- Ensures frontend and backend messaging stay synchronized

---

## 6. Dependency Additions

### `package.json`

**Production Dependencies**
- `helmet` (^8.1.0) — HTTP security headers
- `joi` (^18.1.1) — Schema validation library

**No dev dependencies added** (smoke test framework was reverted)

---

## 7. Documentation Updates

### `src/modules/school/README.md`
- Updated to reflect new authentication and role-based access requirements
- Clearly indicates read access available to authenticated users
- Write operations explicitly restricted to admin-level roles
- Removed outdated "consider adding security" notes; now documents applied security measures

---

## 8. Summary of Security Posture Improvements

| Area | Before | After |
|------|--------|-------|
| **Input Validation** | None | Joi schemas on all route params/query/body; 400 errors with field details |
| **Route Access Control** | Mixed enforcement (some in routes, some in controllers) | Consistent three-layer check: auth → role → validation on every route |
| **CORS Policy** | Permissive (`*`) | Explicit allowlist with environment override |
| **Request Size Limits** | Unlimited | 100kb per type (configurable) |
| **Audit Logging** | Incomplete; some backlog calls fire-and-forget | All sensitive writes await backlog logging; guaranteed consistency |
| **Reset Token Security** | TTL fixed in code; basic verification | Centralizable TTL; strict maxAge enforcement; clear expired/invalid errors |
| **Brute-Force Protection** | Frontend-only (localStorage) | Backend DB-tracked; IP + email-based lockout; 429 responses |
| **HTTP Headers** | Minimal | Helmet enforces CSP, X-Frame-Options, X-Content-Type-Options, etc. |

---

## 9. Environment Configuration Reference

New environment variables introduced (all optional with sensible defaults):

```bash
# CORS Configuration
CORS_ORIGIN_ALLOWLIST=http://localhost:3001,http://127.0.0.1:3001

# Request Body Limits
MAX_JSON_BODY_SIZE=100kb
MAX_FORM_BODY_SIZE=100kb

# Password Reset Token
RESET_PASSWORD_TOKEN_TTL=2h
RESET_PASSWORD_TOKEN_TTL_LABEL=2 hours

# Login Lockout
LOGIN_MAX_ATTEMPTS=3
LOGIN_LOCK_SECONDS=60
LOGIN_ATTEMPT_WINDOW_SECONDS=60
```

---

## 10. Files Modified / Created

### Created
1. `src/middleware/validateRequest.js`
2. `src/validation/schemas.js`

### Modified (Security/Validation)
1. `src/app.js` — Helmet, CORS allowlist, body limits
2. `src/modules/auth/authController.js` — Strict reset token verification
3. `src/modules/school/schoolRoutes.js` — Auth + RBAC + validation
4. `src/modules/registration/registrationRoutes.js` — RBAC + validation
5. `src/modules/employee/employeeRoutes.js` — Validation middleware
6. `src/modules/user/userRoutes.js` — Validation middleware
7. `src/modules/backlog/backlogModel.js` — Added `record()` method
8. `src/modules/backlog/backlogController.js` — Use `record()`
9. `src/modules/school/schoolController.js` — Audit logging on writes
10. `src/modules/employee/employeeController.js` — Await backlog calls
11. `src/modules/user/userController.js` — Await backlog calls
12. `src/modules/leave/leaveController.js` — Await backlog calls
13. `src/modules/registration/registrationController.js` — Await backlog calls
14. `src/utils/mailer.js` — Configurable reset link label
15. `package.json` — Added helmet, joi
16. `src/modules/school/README.md` — Updated access control docs

---

## 11. Recommended Next Steps

1. **Frontend Integration**
   - Update login error handling to surface backend 429 responses and `retry_after_seconds`
   - Display validation errors from 400 responses with field-level detail

2. **Comprehensive Error Handler**
   - Create middleware to normalize all error responses (validation, auth, CORS, etc.)
   - Return consistent API error contract across all endpoints

3. **Rate Limiting**
   - Consider express-rate-limit for global endpoint rate-limiting (separate from brute-force login attempts)

4. **API Logging**
   - Add middleware to log all API requests/responses for debugging and compliance

5. **Testing**
   - Integration tests for validation edge cases
   - RBAC enforcement tests for each route
   - Brute-force lockout scenarios

---

## Checklist for Deployment

- [ ] Verify all environment variables are set in production (JWT_SECRET, DB config, CORS allowlist)
- [ ] Run `npm install` to pull Helmet and Joi
- [ ] Test CORS policy with frontend origin(s)
- [ ] Confirm validation errors are user-friendly (check 400 response format)
- [ ] Verify audit trail logs appear in `backlogs` table for sensitive write operations
- [ ] Test reset token expiry by generating a token, waiting past the TTL, then attempting reset
- [ ] Confirm brute-force lockout by simulating multiple failed logins

---

**Last Updated:** March 24, 2026  
**Session Focus:** Access Control Consistency, Audit Trail Completeness, App-Level Security Baseline, Input Validation
