# Backend Modules Documentation

**Last Updated**: May 4, 2026

This directory contains all business logic modules for the DepEd Leave Tracker backend. Each module is self-contained with its own routes, controllers, models, and database interactions.

---

## 📑 Table of Contents

1. [Module Structure](#module-structure)
2. [Available Modules](#available-modules)
3. [Important Architecture Patterns](#important-architecture-patterns)
4. [Security Considerations](#security-considerations)
5. [Database Schema](#database-schema)
6. [Error Handling](#error-handling)
7. [Development Guidelines](#development-guidelines)

---

## Module Structure

Each module typically follows this pattern:

```
module-name/
├── moduleName + Routes.js     # API route definitions
├── moduleName + Controller.js # Business logic implementation
├── moduleName + Model.js      # Database operations
└── README.md                  # Module-specific documentation
```

### Standard Module Pattern

```javascript
// Routes: Define endpoints and middleware
router.get('/resource', authMiddleware, roleAuthMiddleware([roles]), controller.getAll);
router.post('/resource', authMiddleware, validateRequest({body: schema}), controller.create);

// Controller: Handle HTTP requests
async getAll(req, res) {
  try {
    const data = await Model.getAll(filters);
    res.json({ data });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// Model: Execute database queries
static async getAll(filters) {
  const [rows] = await pool.promise().query(sql, params);
  return rows;
}
```

---

## Available Modules

### 🔐 **Auth Module** (`auth/`)

**Purpose**: User authentication, registration, and password management

**Key Responsibilities**:
- User registration with email verification
- Login with brute-force protection (3 attempts → 60-second lockout)
- Password reset with 2-hour token TTL
- Password change with session invalidation
- JWT token generation and validation

**Important Features**:
- ✅ IP-based rate limiting on login attempts
- ✅ Password reset tokens tied to current password (invalidated if password changes)
- ✅ Automatic session invalidation on password changes
- ✅ Fire-and-forget email pattern (failures don't block response)

**Key Functions**:
- `login()` - Authenticate with email/password
- `register()` - Submit registration request
- `forgotPassword()` - Initiate password reset
- `resetPassword()` - Complete password reset with token
- `changePassword()` - Change password (auth required)
- `logout()` - Invalidate sessions

**Database Tables**:
- `users` - User accounts
- `registration_requests` - Pending registrations
- `login_attempts` - Failed login tracking
- `user_token_invalidations` - Session invalidation records

**Critical Notes**:
- ⚠️ Login lockout tracked by `identifier` (email + IP combo)
- ⚠️ Reset tokens use JWT with password hash as secret
- ⚠️ All user sessions invalidated when password changes
- ⚠️ Email delivery is non-blocking (use separate logging for failures)

**API Endpoints**:
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | ❌ | Submit registration request (validated) |
| POST | `/api/auth/login` | ❌ | Authenticate user (rate-limited) |
| POST | `/api/auth/verify-password` | ✅ | Verify current password |
| PATCH | `/api/auth/change-password` | ✅ | Change password |
| POST | `/api/auth/logout` | ✅ | Log out user |
| POST | `/api/auth/forgot-password` | ❌ | Request password reset (rate-limited) |
| POST | `/api/auth/reset-password` | ❌ | Reset password with token |

---

### 👥 **Employee Module** (`employee/`)

**Purpose**: Employee lifecycle management, work information, and salary tracking

**Key Responsibilities**:
- Employee CRUD operations with transactional integrity
- Work information management (position, employment type, identification numbers)
- Salary information and increment notices
- Employee archiving with reasons
- On-leave status tracking

**Important Features**:
- ✅ School-scoped access control (Admin/Encoder restricted to own school)
- ✅ Automatic work_information record creation
- ✅ Full audit trail via Backlog integration
- ✅ Salary step calculation with promotion logic
- ✅ PDF generation for salary increment notices
- ✅ Employee archiving with restoration capability

**Key Functions**:
- `getAllEmployees()` - List with filters (search, employee type, school, letter)
- `getEmployeeById()` - Retrieve employee with full details
- `createEmployee()` - Create with validation (transactional)
- `updateEmployee()` - Modify employee record
- `archiveEmployee()` - Soft delete with reason
- `unarchiveEmployee()` - Restore archived employee

**Database Tables**:
- `employees` - Main employee records
- `work_information` - Employment details per school config
- `salary_information` - Salary history

**Critical Notes**:
- ⚠️ **School-Scoped Access**: Encoder/Admin can only see their school's employees
- ⚠️ **Transactional**: Create/Update/Delete must maintain employee + work_information consistency
- ⚠️ **Salary Step Logic**: Promotions reset to step 1; regular increments max at step 8
- ⚠️ **Archiving**: Soft delete (is_archived = 1), preserves all historical data
- ⚠️ **Age Calculation**: Derived from birthdate, updated on retrieval

**API Endpoints**:
| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/api/employees` | ✅ | encoder/admin/super | List employees with filters |
| GET | `/api/employees/:employee_id` | ✅ | encoder/admin/super | Get employee details |
| POST | `/api/employees` | ✅ | encoder/admin/super | Create employee |
| PUT | `/api/employees/:employee_id` | ✅ | encoder/admin/super | Update employee |
| PATCH | `/api/employees/:employee_id/archive` | ✅ | encoder/admin/super | Archive employee |
| PATCH | `/api/employees/:employee_id/unarchive` | ✅ | super | Restore archived employee |

---

### 📋 **Leave Module** (`leave/`)

**Purpose**: Leave request management, monthly auto-crediting, and leave card generation

**Key Responsibilities**:
- Leave request CRUD with balance tracking
- Monthly automatic leave crediting (1.25 days per month)
- Leave particulars configuration (29 default types)
- Leave card PDF generation
- Leave balance calculations

**Important Features**:
- ✅ Automatic monthly crediting on 1st of month at 00:00 UTC
- ✅ Configurable leave particulars (system + custom)
- ✅ Running leave balance calculations
- ✅ PDF generation for leave cards
- ✅ Fire-and-forget scheduling (cron-based)

**Key Functions**:
- `getAllLeaveRequests()` - List with school filtering
- `getLeavesByEmployee()` - Employee leave history
- `createLeaveRequest()` - Record new leave
- `getLeaveCardPdf()` - Generate printable leave card
- `creditMonthly()` - Manual monthly credit trigger
- `simulateMonthlyCredit()` - Preview credit without applying

**Database Tables**:
- `leaves` - Leave records
- `leave_particulars` - Leave type definitions (29 system types)

**Critical Notes**:
- ⚠️ **Monthly Credit**: Auto-runs on 1st of month; manually triggered at startup
- ⚠️ **Entry Kind**: MANUAL (user entered) vs MONTHLY_CREDIT (auto)
- ⚠️ **Balance Tracking**: Separate balances for Vacation Leave (VL) and Sick Leave (SL)
- ⚠️ **Automatic Crediting**: Default enabled; can be disabled via `AUTO_MONTHLY_CREDIT=false`

**API Endpoints**:
| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/api/leave` | ✅ | encoder/admin/super | List all leave requests |
| GET | `/api/leave/employee/:employee_id` | ✅ | encoder/admin/super | Get employee leaves |
| GET | `/api/leave/employee/:employee_id/leave-card-pdf` | ✅ | encoder/admin/super | Download leave card PDF |
| POST | `/api/leave` | ✅ | encoder/admin/super | Create leave request |
| PUT | `/api/leave/:id` | ✅ | encoder/admin/super | Update leave request |
| DELETE | `/api/leave/:id` | ✅ | encoder/admin/super | Delete leave request |
| POST | `/api/leave/credit-monthly` | ✅ | admin/super | Trigger monthly credit |

---

### 👤 **User Module** (`user/`)

**Purpose**: User account management, role assignment, and profile management

**Key Responsibilities**:
- User CRUD (list, get, create, update, delete)
- Role assignment and modification
- User profile management
- User status enable/disable
- Password reset by admin

**Important Features**:
- ✅ Role-based access control (Super Admin, Admin, Data Encoder, Regular User)
- ✅ School-scoped user creation (Admin restricted to own school)
- ✅ Admin can reset user passwords
- ✅ User status tracking (active/inactive)

**Key Functions**:
- `getAllUsers()` - List with role/status filtering
- `getUserById()` - Get user details
- `createUser()` - Admin create user (validated)
- `updateUserRole()` - Change user role
- `updateUserStatus()` - Enable/disable user
- `resetUserPassword()` - Admin password reset

**Database Tables**:
- `users` - User accounts

**Critical Notes**:
- ⚠️ **Role Normalization**: Role names accept multiple formats (super-admin, SUPER_ADMIN, super_admin)
- ⚠️ **School Scoping**: Admin can only create users in their school
- ⚠️ **Password Reset**: Admin can set temporary passwords for users

**API Endpoints**:
| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/api/users` | ✅ | admin/super | List all users |
| GET | `/api/users/:id` | ✅ | admin/super | Get user details |
| POST | `/api/users/admin-create` | ✅ | admin/super | Create data encoder |
| PATCH | `/api/users/:id/role` | ✅ | admin/super | Update user role |
| PATCH | `/api/users/:id/status` | ✅ | admin/super | Enable/disable user |

---

### 📝 **Registration Module** (`registration/`)

**Purpose**: Approval workflow for new user registrations

**Key Responsibilities**:
- Retrieve pending registration requests
- Approve registrations (create user account from request)
- Reject registrations with reason
- Track review decisions

**Important Features**:
- ✅ Transactional approval (creates user + school if needed)
- ✅ School lookup/creation during approval
- ✅ Reviewer tracking (who approved, when)

**Key Functions**:
- `getPendingRequests()` - List registrations awaiting approval
- `approveRegistration()` - Accept and create user
- `rejectRegistration()` - Decline with optional reason

**Database Tables**:
- `registration_requests` - Pending registration data

**Critical Notes**:
- ⚠️ **Atomic Approval**: Wrapped in MySQL transaction to prevent duplicates
- ⚠️ **School Lookup**: Finds or creates school by name during approval

**API Endpoints**:
| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/api/registrations/pending` | ✅ | admin/super | List pending registrations |
| POST | `/api/registrations/:id/approve` | ✅ | admin/super | Approve registration |
| POST | `/api/registrations/:id/reject` | ✅ | admin/super | Reject registration |

---

### 🏫 **School Module** (`school/`)

**Purpose**: School record management

**Key Responsibilities**:
- School CRUD operations
- Public school list for registration (now auth-required for security)
- School configuration lookup

**Important Features**:
- ✅ Schema flexibility (supports different DB structures)
- ✅ Public list endpoint for registration flow

**Database Tables**:
- `schools` - School records

**Critical Notes**:
- ⚠️ **Public Endpoint**: `/schools/public/list` now requires authentication (security fix - May 2026)
- ⚠️ **Schema Flexibility**: Code detects whether DB uses `schoolId` or `id` column

---

### 📊 **Backlog Module** (`backlog/`)

**Purpose**: Audit trail and activity logging

**Key Responsibilities**:
- Log all system activities (CRUD operations)
- CSV export of activity logs
- Query caching (30-second TTL)
- Backlog archiving for old records

**Important Features**:
- ✅ Automatic audit trail for all data changes
- ✅ 30-second query cache to reduce DB load
- ✅ CSV export with filtering
- ✅ Automatic archival of old records (>1 month)

**Key Functions**:
- `getAllBacklogs()` - List activities with filters
- `createBacklog()` - Log activity
- `exportBacklogCsv()` - Download activity log as CSV

**Database Tables**:
- `backlogs` - Activity log

**Critical Notes**:
- ⚠️ **Query Caching**: Results cached for 30 seconds
- ⚠️ **Auto Archiving**: Runs daily at 01:00 AM; archives records >1 month old

---

### 📍 **Position Module** (`position/`)

**Purpose**: Job position master data

**Key Responsibilities**:
- Position lookup and management
- Custom position creation

**Database Tables**:
- `positions` - Position master data

**Critical Notes**:
- ⚠️ **Unique Positions**: Position names are unique

---

### 🔄 **Session Module** (`session/`)

**Purpose**: Reserved for future session management

**Current Status**: Placeholder directory (not yet implemented)

---

### 🔗 **EService Module** (`eservice/`)

**Purpose**: Integration with external e-Service system for employee personal information

**Database Access**: Connects to separate `eservice` database

**Critical Notes**:
- ⚠️ **External Integration**: Connects to separate data source
- ⚠️ **Read-Only**: Used for data retrieval and sync

---

## Important Architecture Patterns

### 1. **School-Scoped Access Control**
Only Admin/Super Admin can see all schools; Encoders restricted to their assigned school.

### 2. **Transactional Operations**
Multi-table operations (registration approval, employee creation) wrapped in MySQL transactions.

### 3. **Automatic Audit Trail**
All CRUD operations automatically logged in `backlogs` table for compliance.

### 4. **Fire-and-Forget Email Pattern**
Email sending is non-blocking; failures logged but don't affect API response.

### 5. **30-Second Query Caching**
Backlog queries cached to reduce DB load; trade-off is 30-second data staleness.

### 6. **Role Normalization**
Role names accept multiple formats (super-admin, SUPER_ADMIN, super_admin).

---

## Security Considerations

✅ **Authentication & Authorization**: JWT tokens, role-based access control
✅ **Rate Limiting**: Login attempts (3/60s), password reset throttled
✅ **Password Security**: Bcrypt hashing, reset tokens tied to password
✅ **SQL Injection Prevention**: Parameterized statements throughout
✅ **Session Management**: JWT validation, token revocation
✅ **Data Access Control**: School-scoped queries

---

## Database Schema

### Core Tables

- `employees` - Employee records with school/archive tracking
- `users` - User accounts with roles
- `work_information` - Employment details (position, appointment date, govt IDs)
- `leaves` - Leave records with balance tracking
- `salary_information` - Salary history with step/increment tracking

### Lookup Tables

- `schools` - School master data
- `positions` - Job positions
- `civil_statuses`, `sexes`, `districts` - Reference data

### Security/Audit Tables

- `login_attempts` - Failed login tracking
- `revoked_tokens` - Invalidated JWT tokens
- `user_token_invalidations` - Session invalidation per user
- `backlogs` - Activity log with user/employee/action tracking

---

## Error Handling

### Standard Response Format

**Success**: 
```json
{ "data": {...}, "message": "Success" }
```

**Error**: 
```json
{ "message": "Error description", "error": "Details (dev only)" }
```

### HTTP Status Codes

- 200 - Success
- 400 - Bad Request / Validation failed
- 401 - Unauthorized / Missing auth
- 403 - Forbidden / Insufficient permissions
- 409 - Conflict / Email already exists
- 500 - Server Error

---

## Development Guidelines

### Best Practices

✅ Use transactions for multi-table operations
✅ Validate all user input with Joi schemas
✅ Implement school-scoped queries when needed
✅ Log errors with context
✅ Use parameterized SQL queries

❌ Don't use dynamic SQL construction
❌ Don't skip validation for optional fields
❌ Don't ignore permissions in queries
❌ Don't return internal error details to clients

### Common Operations

**School-Scoped Query**:
```javascript
const schoolId = req.user.school_id;
const [rows] = await pool.promise().query(
  'SELECT * FROM employees WHERE school_id = ?',
  [schoolId]
);
```

**Transactional Operation**:
```javascript
const conn = await pool.promise().getConnection();
try {
  await conn.beginTransaction();
  // ... operations ...
  await conn.commit();
} catch (err) {
  await conn.rollback();
  throw err;
} finally {
  conn.release();
}
```

---

**For module-specific details, see individual README.md files in each module directory.**
