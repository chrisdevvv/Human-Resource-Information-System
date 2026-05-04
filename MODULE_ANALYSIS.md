# DepEd Employee Leave Tracker - Backend Modules Analysis

**Generated:** May 4, 2026

## Table of Contents
1. [Auth Module](#auth-module)
2. [Employee Module](#employee-module)
3. [Leave Module](#leave-module)
4. [User Module](#user-module)
5. [Registration Module](#registration-module)
6. [School Module](#school-module)
7. [Backlog Module](#backlog-module)
8. [Position Module](#position-module)
9. [Session Module](#session-module)
10. [EService Module](#eservice-module)

---

## Auth Module

### File Structure
```
auth/
├── authRoutes.js        (Defines authentication endpoints)
├── authController.js    (Implements authentication logic)
└── README.md
```

### Purpose
Handles user authentication, registration, and password management. Provides secure login/logout functionality with brute-force protection, password reset flows, and email verification.

### Key Functions

#### authController.js
- **`register(req, res)`** - Submits registration request with validation
  - Validates user input (first name, last name, email, password, school)
  - Checks for existing pending requests and active accounts
  - Creates registration_requests record
  - Sends confirmation email (fire-and-forget pattern)
  
- **`login(req, res)`** - Authenticates user with email/password
  - Implements login attempt tracking with IP-based rate limiting
  - Locks account after 3 failed attempts for 60 seconds (configurable)
  - Validates password using bcrypt
  - Generates JWT token on success
  - Returns user role and school information
  
- **`verifyPassword(req, res)`** - Verifies current password (requires auth)
  - Used for password change confirmation
  
- **`changePassword(req, res)`** - Changes user password (requires auth)
  - Validates old password
  - Hashes new password
  - Sends email notification
  - Invalidates all existing tokens for user
  
- **`logout(req, res)`** - Logs out user (requires auth)
  - Invalidates user sessions
  
- **`forgotPassword(req, res)`** - Initiates password reset flow
  - Validates email exists in users table
  - Generates JWT token with user's password hash as secret (tied to specific password)
  - Sends reset link via email
  - Rate limited to prevent abuse
  
- **`verifyOldPassword(req, res)`** - Verifies old password
  - Used in reset password flow
  
- **`resetPassword(req, res)`** - Resets password using reset token
  - Verifies reset token with 2-hour TTL
  - Updates password hash
  - Sends confirmation email

### Helper Functions
- `normalizeEmail(email)` - Standardizes email format (lowercase, trimmed)
- `toApiRole(role)` - Normalizes role names (SNAKE_CASE, uppercase)
- `normalizeBirthdate(value)` - Validates and formats dates
- `resolveSchoolSchemaInfo()` - Detects school table schema (schoolId vs id)
- `getSourceIp(req)` - Extracts client IP from request (handles X-Forwarded-For)
- `verifyPasswordResetToken(token, passwordHash)` - Validates JWT with password hash secret
- `recordFailedLoginAttempt()` - Records login attempt and triggers lockout
- `invalidateUserSessions(userId)` - Invalidates all tokens for user

### Database Tables
- **users** - Main user records
- **registration_requests** - Pending registrations
- **login_attempts** - Tracks failed login attempts per identifier (email|ip)
- **user_token_invalidations** - Tracks invalidated tokens by user

### API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/register` | ❌ | Submit registration request (validated) |
| POST | `/login` | ❌ | Authenticate user (rate-limited) |
| POST | `/verify-password` | ✅ | Verify current password |
| PATCH | `/change-password` | ✅ | Change password |
| POST | `/logout` | ✅ | Log out user |
| POST | `/forgot-password` | ❌ | Request password reset (rate-limited) |
| POST | `/verify-old-password` | ❌ | Verify old password |
| POST | `/reset-password` | ❌ | Reset password with token |

### Important Implementation Details

#### Security Considerations
- **Brute-force Protection**: Login attempts tracked in `login_attempts` table
  - Max 3 attempts (configurable via `LOGIN_MAX_ATTEMPTS`)
  - 60-second lockout on trigger (configurable via `LOGIN_LOCK_SECONDS`)
  - 60-second attempt window (configurable via `LOGIN_ATTEMPT_WINDOW_SECONDS`)
  - Tracked per IP + email combination
  
- **Password Reset Security**: Reset tokens are JWT tokens that include password hash as secret
  - Makes tokens invalid if password changes again
  - 2-hour TTL (configurable via `RESET_PASSWORD_TOKEN_TTL`)
  - Token verified with maxAge constraint
  
- **Session Invalidation**: Records user token invalidations in database
  - Used to invalidate all sessions when password changes or logout occurs
  - Middleware checks this table to reject invalidated tokens
  
- **Email Validation**: Prevents duplicate registrations and accounts
  - Checks for existing pending requests
  - Checks for existing active accounts

#### Email Integration
- Uses mailer utility for sending:
  - Registration confirmation
  - Password reset link (with frontend URL)
  - Password change notification
  - Account status change notifications
- Fire-and-forget pattern: Email failures don't block responses

#### Configuration Parameters
```
LOGIN_MAX_ATTEMPTS = 3 (env: process.env.LOGIN_MAX_ATTEMPTS)
LOGIN_LOCK_SECONDS = 60 (env: process.env.LOGIN_LOCK_SECONDS)
LOGIN_ATTEMPT_WINDOW_SECONDS = 60 (env: process.env.LOGIN_ATTEMPT_WINDOW_SECONDS)
RESET_TOKEN_TTL = "2h" (env: process.env.RESET_PASSWORD_TOKEN_TTL)
FRONTEND_URL (env: process.env.FRONTEND_URL or process.env.APP_URL)
```

#### Error Handling
- Proper HTTP status codes (400, 409, 500)
- Meaningful error messages without exposing internal details
- Validation errors with clear field descriptions

### Dependencies
- `bcryptjs` - Password hashing
- `jsonwebtoken` - JWT token generation/verification
- `crypto` - Random UUID generation
- Mailer utility - Email sending

---

## Employee Module

### File Structure
```
employee/
├── employeeRoutes.js              (Defines employee endpoints)
├── employeeController.js           (Implements CRUD + archive logic)
├── employeeModel.js                (Database queries for employees)
├── salaryInformationController.js  (Salary information endpoints)
├── salaryInformationModel.js        (Salary information database)
├── salaryIncrementNoticeModel.js    (Salary increment notices)
└── README.md
```

### Purpose
Core module for managing employee records, work information, salary data, and employee lifecycle. Handles employee CRUD operations, archiving, leave status tracking, and salary increment management.

### Key Functions

#### employeeController.js
- **`getAllEmployees(req, res)`** - Retrieves employees with filtering and pagination
  - Role-based filtering (data-encoder, admin, super-admin)
  - School-scoped access (admin/data-encoder restricted to own school)
  - Filters: search, employee_type, school_id, letter, retirement, on_leave
  - Pagination support (default 25 per page, max 200)
  - Include archived option (admin only)
  - Returns total count for pagination
  
- **`getEmployeeById(req, res)`** - Retrieves single employee with details
  - Includes work information (position, appointment date, etc.)
  - Includes school permission checks
  - Includes archiver information (who archived and why)
  
- **`getEmployeesBySchool(req, res)`** - Gets all employees for a school
  - School-scoped access enforcement
  - Same filtering options as getAllEmployees
  
- **`getEmployeeStatusCounts(req, res)`** - Returns count breakdown
  - Counts by: active, archived, on_leave
  - Optional school filter
  
- **`createEmployee(req, res)`** - Creates new employee record
  - Validates all required fields
  - Transactional operation
  - Creates work_information record automatically
  - Records backlog entry
  
- **`updateEmployee(req, res)`** - Updates employee personal info
  - Validates update payload
  - Transactional operation
  - Records change in backlog
  
- **`deleteEmployee(req, res)`** - Deletes employee record
  - Soft delete with is_archived flag
  - Records reason and deleter info
  - Removes related leave records
  
- **`archiveEmployee(req, res)`** - Archives employee
  - Marks is_archived = 1
  - Records archiver user ID
  - Records archiving reason
  
- **`unarchiveEmployee(req, res)`** - Restores archived employee
  - Marks is_archived = 0
  - Super admin only
  
- **`markEmployeeOnLeave(req, res)`** - Marks employee as on leave
  - Sets on_leave date range
  - Updates employee status
  
- **`markEmployeeAvailable(req, res)`** - Marks employee as available
  - Clears on_leave dates
  - Updates employee status

#### employeeModel.js
- **`getAll(filters, pagination)`** - Main employee query builder
  - Joins with work_information for enhanced data
  - Calculates age from birthdate
  - Handles schema variations (schoolId vs id)
  - Returns resolved data (merges current and historical info)
  
- **`getById(id, options)`** - Single employee with all details
  - Full work information
  - School details
  - Age calculation
  
- **`create(data)`** - Creates employee with validation
  - Normalizes all data types
  - Validates dates and employee types
  - Returns insertId
  
- **`update(id, data)`** - Updates employee fields
  - Only updates provided fields
  - Normalizes data before update

#### salaryInformationController.js
- **`getSalaryInformationByEmployee(req, res)`** - Gets salary history for employee
  - Filters by date range if provided
  - Pagination support
  
- **`getSalaryInformationById(req, res)`** - Gets specific salary record
  
- **`getStepIncrementNoticePdf(req, res)`** - Generates PDF of increment notice
  - Automatic or manual increment detection
  - Step calculation based on remarks (promotion resets to step 1)
  
- **`createSalaryInformation(req, res)`** - Creates salary record
  - Validates salary data
  - Auto-calculates step if not provided
  - Records backlog entry
  
- **`updateSalaryInformation(req, res)`** - Updates salary record
  - Validates updated data
  - Records change in backlog
  
- **`deleteSalaryInformation(req, res)`** - Deletes salary record
  - Records deletion in backlog

#### salaryInformationModel.js
- **`getByEmployeeId(employeeId, filters)`** - Gets salary history
  - Sorted by salary_date
  - Supports pagination
  
- **`getLatestByEmployeeId(employeeId)`** - Gets most recent salary record
  
- **`getPreviousRecordForStep(employeeId, salaryDate, excludeId)`** - Gets previous record for step calculation
  - Used to determine promotion vs regular increment
  
- **`create(data)`** - Inserts salary record
  - Calculates next step based on previous record
  - Validates increment amount
  
- **`update(id, data)`** - Updates salary record

### Database Tables
- **employees** - Main employee records
  - Columns: id, first_name, middle_name, last_name, birthdate, age, school_id, is_archived, archived_by, archived_reason, on_leave, on_leave_from, on_leave_until, created_at, updated_at
  
- **work_information** - Employee work details (may vary by school config)
  - Columns: employee_id, employee_type, employee_no, work_email, district, position, position_id, plantilla_no, sg, date_of_first_appointment, years_in_service, loyalty_bonus, current_employee_type, current_position, current_plantilla_no, current_appointment_date, current_sg, prc_license_no, tin, gsis_bp_no, gsis_crn_no, pagibig_no, philhealth_no
  
- **salary_information** - Salary history
  - Columns: id, employee_id, salary_date, plantilla, sg, step, salary, increment_amount, increment_mode (AUTO/MANUAL), remarks, created_at, updated_at

### API Endpoints

#### Employee Operations
| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/employees` | ✅ | encoder/admin/super | List employees with filters |
| GET | `/employees/school/:school_id` | ✅ | encoder/admin/super | Get employees by school |
| GET | `/employees/status-counts` | ✅ | encoder/admin/super | Get status counts |
| GET | `/employees/:employee_id` | ✅ | encoder/admin/super | Get employee details |
| POST | `/employees` | ✅ | encoder/admin/super | Create employee |
| PUT | `/employees/:employee_id` | ✅ | encoder/admin/super | Update employee |
| DELETE | `/employees/:employee_id` | ✅ | encoder/admin/super | Delete employee |
| PATCH | `/employees/:employee_id/archive` | ✅ | encoder/admin/super | Archive employee |
| PATCH | `/employees/:employee_id/unarchive` | ✅ | super | Restore archived employee |
| PATCH | `/employees/:employee_id/mark-on-leave` | ✅ | encoder/admin/super | Mark as on leave |
| PATCH | `/employees/:employee_id/mark-available` | ✅ | encoder/admin/super | Mark as available |

#### Salary Information Operations
| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/employees/:employee_id/salary-information` | ✅ | encoder/admin/super | Get salary history |
| GET | `/employees/:employee_id/salary-information/:id` | ✅ | encoder/admin/super | Get salary record |
| GET | `/employees/:employee_id/salary-information/:id/pdf` | ✅ | encoder/admin/super | Download increment notice PDF |
| POST | `/employees/:employee_id/salary-information` | ✅ | encoder/admin/super | Create salary record |
| PUT | `/employees/:employee_id/salary-information/:id` | ✅ | encoder/admin/super | Update salary record |
| DELETE | `/employees/:employee_id/salary-information/:id` | ✅ | encoder/admin/super | Delete salary record |

### Important Implementation Details

#### Access Control
- **Data Encoder & Admin**: Restricted to employees in their assigned school
  - getScopedSchoolId() retrieves from req.user.school_id
  - isSameSchool() validates permission
  
- **Super Admin**: Can access all employees across all schools

#### Data Normalization
- `normalizeEmployeeTypeForStorage()` - Standardizes employee types (teaching, non-teaching, teaching-related)
- `normalizeOptionalDate()` - Parses and formats dates to ISO 8601
- `toMmDdYyyy()` - Converts to MM/DD/YYYY format for legacy systems
- All dates stored as ISO 8601 (YYYY-MM-DD)

#### Salary Increment Logic
- Step calculation:
  - Promotion remarks: resets to step 1
  - Regular increment: current_step + 1, max step 8
  - 3-year interval for automatic increments
  - Support for manual increments
  
- Modes:
  - `AUTO`: Automatically calculated by system
  - `MANUAL`: Manually entered by user

#### Full Name Construction
- `buildFullName(firstName, middleName, lastName)` - Builds display name
- Joins non-null parts with spaces

#### Archive Logic
- Employees marked is_archived = 1
- Records who archived and when
- Optional archiving reason
- Can be restored by super admin

#### Transactional Operations
- Create, update, delete operations are transactional
- Ensures consistency between employee and work_information records

### Dependencies
- Employee Model
- Work Information
- Salary Information
- Position Module (for position lookups)
- Backlog Module (for audit trail)
- Database pool

---

## Leave Module

### File Structure
```
leave/
├── leaveRoutes.js        (Defines leave endpoints)
├── leaveController.js    (Implements leave logic)
├── leaveModel.js         (Database queries for leaves)
└── README.md
```

### Purpose
Manages employee leave requests, leave credits, leave particulars configuration, and leave card generation. Supports monthly auto-crediting of leave, leave tracking, and PDF generation.

### Key Functions

#### leaveController.js
- **`getAllLeaveRequests(req, res)`** - Lists all leave requests
  - Role-based access: data-encoder, admin, super-admin
  - School-scoped for encoder/admin
  - Returns leave data with employee info
  
- **`getLeavesByEmployee(req, res)`** - Gets employee's leave records
  - School permission checks
  - Sorted by date of action
  
- **`getLeaveRequestById(req, res)`** - Gets specific leave request
  
- **`getLeaveCardPdf(req, res)`** - Generates leave card PDF
  - Employee details
  - Leave balances (vacation, sick leave)
  - Leave history table
  - Formatted for printing
  - Uses PDFKit library
  
- **`createLeaveRequest(req, res)`** - Creates new leave record
  - Validates employee exists
  - Validates leave data
  - Calculates balances
  - Records backlog entry
  
- **`updateLeaveRequest(req, res)`** - Updates leave request
  - Validates update data
  - Recalculates balances
  - Records change
  
- **`deleteLeaveRequest(req, res)`** - Deletes leave record
  - Records deletion
  
- **`creditMonthly(req, res)`** - Manually triggers monthly leave credit
  - 1.25 days credit per employee per month
  - Adds to earned vacation leave
  - Creates entry with kind: MONTHLY_CREDIT
  - Admin/Super Admin only
  
- **`deleteMonthlyCredit(req, res)`** - Removes monthly credit entry
  - Super Admin only
  
- **`simulateMonthlyCredit(req, res)`** - Preview monthly credit without applying
  - Shows what would be credited
  - Super Admin only
  
- **`getLeaveParticulars(req, res)`** - Gets leave type configuration
  - System-defined and custom particulars
  - Super Admin can configure
  
- **`createLeaveParticular(req, res)`** - Creates custom leave type
  - Adds to leave particulars list
  - Super Admin only
  
- **`updateLeaveParticular(req, res)`** - Updates leave particular
  - Super Admin only
  
- **`deleteLeaveParticular(req, res)`** - Deletes leave particular
  - Super Admin only

#### leaveModel.js
- **`getAll(filters, pagination)`** - Retrieves all leave records
  - Optional employee_id filter
  - Optional school_id filter
  - Pagination support
  
- **`getById(id)`** - Gets specific leave record
  
- **`getByEmployeeId(employee_id)`** - Gets all leave records for employee
  
- **`create(data)`** - Creates leave entry
  - entry_kind: MANUAL or MONTHLY_CREDIT
  - Calculates running balances
  
- **`update(id, data)`** - Updates leave entry
  
- **`delete(id)`** - Deletes leave entry
  
- **`getParticulars()`** - Gets system-defined and custom leave particulars

### Database Tables
- **leaves** - Leave records
  - Columns: id, employee_id, period_of_leave, entry_kind (MANUAL/MONTHLY_CREDIT), particulars, earned_vl, abs_with_pay_vl, abs_without_pay_vl, bal_vl, earned_sl, abs_with_pay_sl, abs_without_pay_sl, bal_sl, date_of_action, created_at, updated_at
  
- **leave_particulars** - Leave type configuration
  - Columns: id, particular_name, is_system_defined

### API Endpoints

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/leave` | ✅ | encoder/admin/super | List all leave requests |
| GET | `/leave/employee/:employee_id` | ✅ | encoder/admin/super | Get employee leaves |
| GET | `/leave/employee/:employee_id/leave-card-pdf` | ✅ | encoder/admin/super | Download leave card PDF |
| GET | `/leave/:id` | ✅ | encoder/admin/super | Get leave request |
| POST | `/leave` | ✅ | encoder/admin/super | Create leave request |
| PUT | `/leave/:id` | ✅ | encoder/admin/super | Update leave request |
| DELETE | `/leave/:id` | ✅ | encoder/admin/super | Delete leave request |
| GET | `/leave/particulars` | ✅ | encoder/admin/super | List leave particulars |
| GET | `/leave/particulars/config` | ✅ | super | List particulars (admin) |
| POST | `/leave/particulars` | ✅ | super | Create particular |
| PUT | `/leave/particulars` | ✅ | super | Update particular |
| DELETE | `/leave/particulars` | ✅ | super | Delete particular |
| POST | `/leave/credit-monthly` | ✅ | admin/super | Trigger monthly credit |
| DELETE | `/leave/monthly-credit/:id` | ✅ | super | Remove monthly credit |
| GET | `/leave/simulate-monthly-credit` | ✅ | super | Preview credit |

### Important Implementation Details

#### Leave Calculation Logic
- **Monthly Credit**: 1.25 days automatically credited (configurable as MONTHLY_CREDIT)
- **Running Balances**: Updated with each entry
- **Balance Fields**:
  - Vacation Leave (VL): earned_vl, abs_with_pay_vl, abs_without_pay_vl, bal_vl
  - Sick Leave (SL): earned_sl, abs_with_pay_sl, abs_without_pay_sl, bal_sl
  
- **Entry Kind**:
  - MANUAL: Manually entered entry
  - MONTHLY_CREDIT: Auto-credited monthly entry

#### Leave Particulars (System Defined)
```
- Adoption Leave
- Balance Forwarded
- Brigada Eskwela
- Checking of Forms
- Compensatory Paid Leave
- Early Registration/Enrollment
- Election
- Forced Leave
- Forced Leave (Disapproved)
- Late/Undertime
- Leave Credit
- Maternity Leave
- Monetization
- Others
- Paternity Leave
- Rehabilitation Leave
- Remediation/Enrichment Classes/NLC
- Service Credit
- Sick Leave
- Solo Parent
- Special Emergency Leave
- Special Leave for Women
- Special Privilege Leave
- Study Leave
- Terminal Leave
- Training/Seminar
- VAWC Leave
- Vacation Leave
- Wellness Leave
```

#### PDF Generation
- Uses PDFKit library
- Generates leave card with:
  - Employee information
  - Leave balances
  - Leave history in tabular format
  - Pagination for large datasets
- Automatically chunks large datasets (rows grouped by 30)

#### Decimal Precision
- Rounds values to 2 decimal places for storage and display
- Uses `round2()` helper for calculations
- Fixed-point arithmetic to prevent floating-point errors

#### School-Scoped Access
- Data Encoders and Admins limited to own school
- Super Admin sees all schools

### Dependencies
- Leave Model
- Backlog Module (for audit trail)
- Employee Module (for employee details)
- PDFKit (for PDF generation)

---

## User Module

### File Structure
```
user/
├── userRoutes.js        (Defines user management endpoints)
├── userController.js    (Implements user management logic)
├── userModel.js         (Database queries for users)
└── README.md
```

### Purpose
Manages system users, roles, permissions, and account status. Provides admin/super-admin user management, role assignment, password reset, and profile management.

### Key Functions

#### userController.js
- **`getAllUsers(req, res)`** - Lists all users with filtering
  - Role filter (SUPER_ADMIN, ADMIN, DATA_ENCODER)
  - School filter
  - Status filter (active/inactive)
  - Search by name, email, school
  - Letter filter for name-based lookup
  - Pagination support
  - Admin/Super Admin only
  
- **`getUserById(req, res)`** - Gets specific user details
  - Includes school information
  - Admin/Super Admin only
  
- **`getMyProfile(req, res)`** - Gets current user's profile
  - No role restriction
  
- **`updateMyProfile(req, res)`** - Updates current user's profile
  - Can update: first_name, middle_name, last_name, birthdate
  - No role restriction
  
- **`updateUserDetails(req, res)`** - Updates another user's profile
  - Super Admin only
  
- **`updateUserRole(req, res)`** - Changes user role
  - Validates role is one of: SUPER_ADMIN, ADMIN, DATA_ENCODER
  - Records change in backlog
  - Sends email notification
  - Admin/Super Admin only
  
- **`updateUserStatus(req, res)`** - Activates/deactivates user
  - Sets is_active flag
  - Records change
  - Sends notification
  - Admin/Super Admin only
  
- **`adminResetPassword(req, res)`** - Admin resets user password
  - Generates temporary password
  - Sends credentials to user
  - Admin/Super Admin only
  
- **`deleteUser(req, res)`** - Deletes user account
  - Soft delete with is_active = 0
  - Records deletion
  - Admin/Super Admin only
  
- **`createDataEncoderByAdmin(req, res)`** - Creates new data encoder user
  - Admin creates user with school assignment
  - Generates temporary password
  - Sends credentials via email
  - Admin/Super Admin only

#### userModel.js
- **`getAll(filters, pagination)`** - Query builder for users
  - Filters: search, role, is_active, school_id, letter
  - Joins with schools table
  - Supports pagination
  
- **`getById(id)`** - Gets user by ID
  
- **`create(data)`** - Creates new user
  - Validates required fields
  - Hashes password with bcrypt
  
- **`update(id, data)`** - Updates user
  
- **`delete(id)`** - Soft deletes user

### Database Tables
- **users** - User accounts
  - Columns: id, first_name, middle_name, last_name, email, password_hash, role (super_admin/admin/data_encoder), school_id, birthdate, is_active, created_at, updated_at

### API Endpoints

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/users` | ✅ | admin/super | List all users |
| GET | `/users/me/profile` | ✅ | all | Get current user profile |
| GET | `/users/:id` | ✅ | admin/super | Get user details |
| PATCH | `/users/me/profile` | ✅ | all | Update own profile |
| PATCH | `/users/:id/details` | ✅ | super | Update user details |
| PATCH | `/users/:id/role` | ✅ | admin/super | Change user role |
| PATCH | `/users/:id/status` | ✅ | admin/super | Activate/deactivate user |
| PATCH | `/users/:id/password` | ✅ | admin/super | Reset password |
| POST | `/users/admin-create` | ✅ | admin/super | Create data encoder |
| DELETE | `/users/:id` | ✅ | admin/super | Delete user |

### Important Implementation Details

#### Role Management
- Valid roles: SUPER_ADMIN, ADMIN, DATA_ENCODER
- Role normalization: `toDbRole()` converts to snake_case
- Stored in database as: super_admin, admin, data_encoder
- API returns uppercase: SUPER_ADMIN, ADMIN, DATA_ENCODER

#### Email Notifications
- Role change notification
- Password reset notification
- Account status change notification
- Account created notification (with temp credentials)
- User details updated notification

#### Password Management
- Hashed with bcrypt (10 rounds)
- Admin can reset to temporary password
- Temporary password sent via email
- User must change on first login

#### User Activation
- is_active flag controls account status
- Inactive users cannot log in
- Can be reactivated by admin

#### Birthdate Handling
- Optional field
- Normalized to ISO 8601 format
- Validated during parsing

#### School Assignment
- Users can be assigned to a school (school_id)
- School-scoped users (admin, data-encoder) see only their school's data
- Super admin has no school scope

### Dependencies
- User Model
- Backlog Module (for audit trail)
- Mailer utility (for email notifications)
- bcryptjs (for password hashing)

---

## Registration Module

### File Structure
```
registration/
├── registrationRoutes.js        (Defines registration endpoints)
├── registrationController.js    (Implements approval/rejection logic)
├── registrationModel.js         (Database queries)
└── README.md
```

### Purpose
Manages user registration requests. Provides endpoints for users to request accounts and for admins to approve or reject registration requests.

### Key Functions

#### registrationController.js
- **`getAllRegistrations(req, res)`** - Lists all registration requests
  - Filters: status (PENDING/APPROVED/REJECTED), search, letter
  - Sorting options
  - Pagination
  - School-scoped for data-encoder/admin
  
- **`getPendingRegistrations(req, res)`** - Lists only pending requests
  - Quick access to requests awaiting review
  
- **`getRegistrationById(req, res)`** - Gets specific request details
  
- **`approveRegistration(req, res)`** - Approves registration request
  - Creates actual user account
  - Sets user role to requested_role or default DATA_ENCODER
  - Sends approval email with credentials
  - Records backlog entry
  - School-scoped enforcement
  
- **`rejectRegistration(req, res)`** - Rejects registration request
  - Requires rejection reason
  - Sends rejection email with reason
  - Records backlog entry

#### registrationModel.js
- **`getAll(filters, options, pagination)`** - Retrieves registration requests
  - Filters: status, search, letter, date range
  - Options: schoolName for school scoping
  - Supports pagination
  
- **`getById(id)`** - Gets specific request
  
- **`create(data)`** - Creates registration request (used during auth.register)
  
- **`updateStatus(id, status, reviewedBy, reviewedAt, approvedRole, rejectionReason)`** - Updates request status
  
- **`getSchoolNameById(schoolId)`** - Resolves school name
  
- **`getReviewerScopeById(userId)`** - Gets reviewer's assigned school

### Database Tables
- **registration_requests** - Pending/approved/rejected registration requests
  - Columns: id, first_name, middle_name, last_name, email, password_hash, school_name, requested_role, birthdate, approved_role, status (PENDING/APPROVED/REJECTED), rejection_reason, reviewed_by (user_id), reviewed_at, created_at

### API Endpoints

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/registrations` | ✅ | encoder/admin/super | List all requests |
| GET | `/registrations/pending` | ✅ | encoder/admin/super | List pending requests |
| GET | `/registrations/:id` | ✅ | encoder/admin/super | Get request details |
| POST | `/registrations/:id/approve` | ✅ | encoder/admin/super | Approve request |
| POST | `/registrations/:id/reject` | ✅ | encoder/admin/super | Reject request |

### Important Implementation Details

#### Registration Flow
1. User submits registration via `/auth/register` endpoint
2. Creates `registration_requests` record with PENDING status
3. Admin reviews the request
4. Admin approves → creates user account with credentials
5. Or admin rejects → sends rejection notification

#### Approval Process
- Validates email is not duplicate
- Creates user with requested_role (or DATA_ENCODER if not specified)
- Generates temporary password
- Sends credentials to new user
- Creates backlog record of action

#### Rejection Process
- Marks status as REJECTED
- Requires rejection reason
- Sends rejection email with reason
- Allows re-application after rejection

#### School Scoping
- Data Encoders and Admins see only their school's registrations
- Super Admin sees all registrations
- School name used for filtering (case-insensitive)

#### Email Notifications
- Registration received confirmation (during registration)
- Approval notification with credentials
- Rejection notification with reason

### Dependencies
- Registration Model
- User Module (for user creation)
- Backlog Module (for audit trail)
- Mailer utility (for notifications)
- Auth Module (registration flow starts there)

---

## School Module

### File Structure
```
school/
├── schoolRoutes.js        (Defines school endpoints)
├── schoolController.js    (Implements CRUD logic)
├── schoolModel.js         (Database queries)
└── README.md
```

### Purpose
Manages school records. Provides endpoints for CRUD operations on schools that are referenced by employees and users.

### Key Functions

#### schoolController.js
- **`getAllSchools(req, res)`** - Lists all schools
  - Search filter by school name
  - Sorting options (A-Z or Z-A)
  - Accessible by authenticated encoder/admin/super
  
- **`getSchoolById(req, res)`** - Gets specific school
  
- **`createSchool(req, res)`** - Creates new school
  - Requires school_name and school_code
  - Super Admin only
  - Records backlog entry
  
- **`updateSchool(req, res)`** - Updates school details
  - Super Admin only
  - Records change in backlog
  
- **`deleteSchool(req, res)`** - Deletes school
  - Validates no employees assigned to it
  - Super Admin only
  - Records deletion

#### schoolModel.js
- **`getAll(options)`** - Retrieves schools
  - Filters: search by name
  - Sorting: a-z or z-a
  - Handles schema variations
  
- **`getById(id)`** - Gets school details
  
- **`create(data)`** - Creates school
  - data: { school_name, school_code }
  
- **`update(id, data)`** - Updates school
  
- **`delete(id)`** - Deletes school
  
- **`countAssignedEmployees(id)`** - Counts employees assigned

### Database Tables
- **schools** - School records
  - Columns: id (or schoolId), school_name (or schoolName), school_code (optional)
  - Schema variations supported for legacy compatibility

### API Endpoints

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/schools/public/list` | ✅ | all | List schools (for registration) |
| GET | `/schools` | ✅ | encoder/admin/super | List all schools |
| GET | `/schools/config/list` | ✅ | super | List for config |
| GET | `/schools/:id` | ✅ | encoder/admin/super | Get school |
| POST | `/schools` | ✅ | super | Create school |
| PUT | `/schools/:id` | ✅ | super | Update school |
| DELETE | `/schools/:id` | ✅ | super | Delete school |

### Important Implementation Details

#### Schema Flexibility
- Supports two database schema variants:
  - Modern: schoolId, schoolName
  - Legacy: id, school_name
  - Resolves schema dynamically with `resolveSchoolSchemaInfo()`
  - Allows seamless migration between schemas

#### Deletion Constraints
- Cannot delete school if employees assigned
- Returns count of assigned employees in error response
- Backlog recorded before deletion

#### School Scoping
- Uses school_id to filter employee/user/leave records by school
- Public endpoint for registration allows school lookup
- Authenticated endpoint for configuration

### Dependencies
- School Model
- Backlog Module (for audit trail)
- Employee Module (for employee count checks)

---

## Backlog Module

### File Structure
```
backlog/
├── backlogRoutes.js        (Defines backlog endpoints)
├── backlogController.js    (Implements backlog logic)
├── backlogModel.js         (Database queries)
└── README.md
```

### Purpose
Audit trail and activity logging. Records all significant system actions (create, update, delete) for compliance, debugging, and audit purposes.

### Key Functions

#### backlogController.js
- **`getAllBacklogs(req, res)`** - Retrieves all backlog entries
  - Filters: user_id, school_id, action, search
  - Sorting by date/name
  - Pagination
  - Super Admin only
  
- **`getBacklogById(req, res)`** - Gets specific backlog entry
  
- **`getBacklogsByUser(req, res)`** - Gets entries for specific user
  
- **`getBacklogsBySchool(req, res)`** - Gets entries for specific school
  
- **`createBacklog(req, res)`** - Creates backlog entry (called from other modules)
  - data: { user_id, school_id, employee_id, leave_id, action, details, is_archived }
  - Super Admin only
  
- **`generateBacklogReport(req, res)`** - Generates CSV or PDF report
  - Date range filtering
  - User filtering
  - School filtering
  - Sorts and exports to CSV
  - Super Admin only
  
- **`archiveBacklogsByDateRange(req, res)`** - Archives old entries
  - Moves old entries to is_archived = 1
  - Optimizes query performance
  - Super Admin only

#### backlogModel.js
- **`getAll(pagination, options)`** - Retrieves backlog entries
  - Supports pagination with caching
  - Filters: search, role, school, letter, date range
  - Caching: 30-second TTL for read performance
  - Default: non-archived entries only
  
- **`getById(id)`** - Gets specific entry
  
- **`create(data)`** - Records action in backlog
  - Captures user, school, employee, leave, action, details
  
- **`getReport(filters, pagination)`** - Generates report
  - CSV export format
  - Includes all related data
  
- **`archiveOldEntries(dateBefore)`** - Archives entries before date

### Database Tables
- **backlogs** - Audit trail records
  - Columns: id, user_id, school_id, employee_id, leave_id, action, details, created_at, is_archived

### API Endpoints

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/backlogs` | ✅ | super | List all backlogs |
| GET | `/backlogs/:id` | ✅ | super | Get backlog entry |
| GET | `/backlogs/user/:user_id` | ✅ | super | Get user's backlogs |
| GET | `/backlogs/school/:school_id` | ✅ | super | Get school's backlogs |
| GET | `/backlogs/report` | ✅ | super | Generate report |
| POST | `/backlogs` | ✅ | super | Create backlog |
| PATCH | `/backlogs/archive` | ✅ | super | Archive old entries |

### Important Implementation Details

#### Common Actions Recorded
- EMPLOYEE_CREATED
- EMPLOYEE_UPDATED
- EMPLOYEE_DELETED
- EMPLOYEE_ARCHIVED
- EMPLOYEE_UNARCHIVED
- LEAVE_CREATED
- LEAVE_UPDATED
- LEAVE_DELETED
- USER_ROLE_CHANGED
- USER_STATUS_CHANGED
- USER_DELETED
- SCHOOL_CREATED
- SCHOOL_UPDATED
- SCHOOL_DELETED
- REGISTRATION_APPROVED
- REGISTRATION_REJECTED

#### Caching Strategy
- 30-second TTL for read operations
- Query cache stores results keyed by filters
- Cache invalidated on write operations
- Improves performance for frequently accessed reports

#### CSV Export Format
Headers:
- id, created_at, action, details
- user_id, user_name, user_role, email
- school_id, school_name
- employee_id, leave_id
- is_archived

#### Archiving Strategy
- Archives entries older than specified date
- Sets is_archived = 1
- Reduces query time on large backlog tables
- Archived entries excluded by default in queries

#### Pagination
- Default limit: 25 records
- Max limit: 200 records
- Cache-aware pagination

### Dependencies
- Backlog Model
- Called by: Employee, User, Leave, Registration, School modules

---

## Position Module

### File Structure
```
position/
├── positionModel.js
└── README.md
```

### Purpose
Manages job positions/designations. Provides lookup data for employee work information records.

### Key Functions

#### positionModel.js
- **`getAll()`** - Retrieves all positions
  - Returns: [{ id, position_name }, ...]
  - Ordered alphabetically
  
- **`getById(id)`** - Gets specific position
  
- **`getByName(name)`** - Looks up position by name
  
- **`create(positionName)`** - Creates new position
  
- **`bulkCreate(positionNames)`** - Creates multiple positions
  - Ignores duplicates
  - Returns affected row count
  
- **`delete(id)`** - Deletes position

### Database Tables
- **positions** - Position/designation records
  - Columns: id, position_name

### API Endpoints
No direct API endpoints. Used as lookup data by Employee module.

### Important Implementation Details

#### Bulk Import
- Used during system initialization
- Supports bulk creation with duplicate handling
- Ignores existing positions

#### Alphabetical Ordering
- Positions returned sorted A-Z
- Helps with UI dropdowns and reporting

### Dependencies
- Database pool only

---

## Session Module

### File Structure
```
session/
└── README.md
```

### Purpose
Reserved for session management functionality. Currently has documentation placeholder.

### Status
Not yet implemented. Planned for future use with session-based authentication features.

---

## EService Module

### File Structure
```
eservice/
├── eserviceRoutes.js        (Defines eservice endpoints)
├── eserviceController.js    (Implements eservice logic)
├── eserviceModel.js         (Database queries)
```

### Purpose
Manages employee personal information for eService (electronic services) system. Provides employee profile data for external systems or reporting.

### Key Functions

#### eserviceController.js
- **`getAllEmployeePersonalInfo(req, res)`** - Lists employee personal info
  - Filters: search, district, school, civilStatus, sex, employeeType, retirementStatus, letter
  - Pagination support
  - Super Admin only
  
- **`getEmployeePersonalInfoById(req, res)`** - Gets employee personal info
  
- **`getEmployeePersonalInfoCount(req, res)`** - Gets count of records
  
- **`getRetirementCounts(req, res)`** - Gets retirement status breakdown
  
- **`createEmployeePersonalInfo(req, res)`** - Creates employee record
  - Requires: firstName, lastName, district, school, gender, civilStatus
  
- **`updateEmployeePersonalInfo(req, res)`** - Updates employee personal info
  
- **`deleteEmployeePersonalInfo(req, res)`** - Deletes employee record
  
- **`getDistricts(req, res)`** - Gets list of districts
  - Super Admin only
  
- **`getSchools(req, res)`** - Gets list of schools
  - Super Admin only

#### eserviceModel.js
- **`getAll(filters)`** - Retrieves employee personal information
  - Uses separate database connection (dbcsjdm)
  - Filters: search, district, school, civilStatus, sex, employeeType, retirementStatus, letter
  - Pagination support
  - Excludes archived records

### Database Tables
- Uses separate database: `dbcsjdm` (eService specific)
- **emppersonalinfo** - Employee personal records
  - Columns: firstName, lastName, middleName, middle_initial, email, district, school, place, civilStatus, gender, birthday (or birthdate), is_archived
  - Various employee information fields

### API Endpoints

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/eservice/districts` | ✅ | super | List districts |
| GET | `/eservice/schools` | ✅ | super | List schools |
| GET | `/eservice/employees` | ✅ | super | List employee records |
| GET | `/eservice/employees/count` | ✅ | super | Get record count |
| GET | `/eservice/employees/:id` | ✅ | super | Get employee record |
| GET | `/eservice/retirement-counts` | ✅ | super | Get retirement counts |
| POST | `/eservice/employees` | ✅ | super | Create employee record |
| PUT | `/eservice/employees/:id` | ✅ | super | Update employee record |
| DELETE | `/eservice/employees/:id` | ✅ | super | Delete employee record |

### Important Implementation Details

#### Separate Database Connection
- Uses `dbcsjdm` connection (separate from main database)
- Allows integration with separate eService system
- May have different schema from main system

#### Data Normalization
- `normalizeOptionalText()` - Validates optional text fields
- `normalizeOptionalEmail()` - Normalizes and validates email
- `normalizeEmployeeType()` - Standardizes employee types
- `normalizeDateForStorage()` - Converts date formats (ISO to MM/DD/YYYY)

#### Filtering Capabilities
- **District**: Geographic filtering
- **School**: School-level filtering
- **Civil Status**: Marital status
- **Gender/Sex**: Gender classification
- **Employee Type**: Position/employment type
- **Retirement Status**: Retirement eligibility
- **Letter**: Name-based alphabetic filtering

#### Data Sync
- Maintains separate personal information records
- May sync with or feed external eService systems
- Complements main employee module

### Dependencies
- Separate database connection (dbcsjdm)
- Super Admin access only

---

## Cross-Module Patterns and Dependencies

### Authentication & Authorization
- **authMiddleware**: Validates JWT token on all protected routes
- **roleAuthMiddleware**: Checks user role matches endpoint requirements
- **School Scoping**: Data encoders/admins limited to their school
  - `getScopedSchoolId(req)` extracts from token
  - `isSameSchool(userSchoolId, targetSchoolId)` validates access

### Audit & Compliance
- **Backlog Module**: Records all significant actions
- Called by: Employee, User, Leave, Registration, School modules
- Captures: user_id, school_id, employee_id, leave_id, action, details

### Data Validation
- Central validation schemas in `/src/validation/schemas.js`
- **validateRequest** middleware enforces schemas
- Validates: body, params, query

### Error Handling Patterns
- Consistent HTTP status codes
- Meaningful error messages (without exposing internals)
- Proper logging for debugging

### Database Patterns
- Connection pooling via `/src/config/db.js`
- Separate connections for: main DB, eService DB (dbcsjdm)
- Query builders with filter/pagination support
- Caching for frequently accessed lookups (Backlog)

### Normalization Helpers
- **Roles**: Normalizes to snake_case for storage, uppercase for API
- **Dates**: Converts to ISO 8601 (YYYY-MM-DD) or MM/DD/YYYY as needed
- **Email**: Lowercase, trimmed
- **Text**: Trimmed, null handling for optional fields
- **Boolean**: Handles "true"/"1"/true/1 representations

### Rate Limiting
- **Login**: `authLimiter` (3 attempts, 60-second window)
- **Password Reset**: `passwordResetResendLimiter` + `passwordResetCooldown`

---

## Security Considerations

### Authentication
- JWT tokens with configurable TTL
- Password reset tokens tied to password hash (invalidated if password changes)
- Brute-force protection on login
- Session invalidation table for forced logouts

### Authorization
- Role-based access control (SUPER_ADMIN, ADMIN, DATA_ENCODER)
- School-scoped access for limited roles
- Endpoint-level role checks

### Data Protection
- Passwords hashed with bcrypt (10 rounds)
- Sensitive data (ID numbers) stored in work_information
- Audit trail for compliance

### Input Validation
- Schema validation on all endpoints
- Type checking and normalization
- Email format validation
- Date format validation

### CORS
- Configurable allowlist
- Production enforces strict allowlist
- Development allows localhost

---

## Performance Considerations

### Caching
- Backlog queries cached for 30 seconds
- School schema cached per request

### Query Optimization
- Selected columns only (avoid SELECT *)
- Indexed joins on foreign keys
- Pagination to limit result sets
- LIMIT clauses in queries

### Database Design
- Proper indexing on:
  - Foreign keys
  - Frequently filtered columns
  - Date ranges
  - User IDs, school IDs

### Async Email
- Fire-and-forget pattern for email sending
- Email failures don't block API responses

---

## Configuration Parameters

### Environment Variables

#### Authentication
- `LOGIN_MAX_ATTEMPTS` (default: 3)
- `LOGIN_LOCK_SECONDS` (default: 60)
- `LOGIN_ATTEMPT_WINDOW_SECONDS` (default: 60)
- `RESET_PASSWORD_TOKEN_TTL` (default: "2h")
- `JWT_SECRET` (from securityEnv.js)

#### Application
- `PORT` (default: 3000)
- `NODE_ENV` (production/development)
- `AUTO_MONTHLY_CREDIT` (default: true)

#### CORS
- `CORS_ORIGIN_ALLOWLIST` or `CORS_ALLOWED_ORIGINS`
- `FRONTEND_URL` or `APP_URL`

#### Request Limits
- `MAX_JSON_BODY_SIZE` (default: "100kb")
- `MAX_FORM_BODY_SIZE` (default: "100kb")

#### Email
- `SMTP_*` settings (in env config)

---

## Error Handling Patterns

### HTTP Status Codes
- `200`: Success with data
- `201`: Created successfully
- `204`: No content (delete)
- `400`: Bad request (validation error)
- `401`: Unauthorized (no token)
- `403`: Forbidden (insufficient role/permission)
- `404`: Not found
- `409`: Conflict (duplicate, constraint violation)
- `500`: Server error

### Error Response Format
```json
{
  "message": "User-friendly error message",
  "error": "Detailed error (optional, for debugging)",
  "data": {} // Additional context (optional)
}
```

### Validation Errors
Include field-specific validation messages when applicable

---

## Testing Considerations

### Unit Tests
- Test normalization helpers
- Test permission checks
- Test data validation

### Integration Tests
- Test CRUD operations
- Test permission enforcement
- Test email notifications
- Test leave calculations

### End-to-End Tests
- Test registration flow
- Test approval workflow
- Test role changes
- Test employee archiving

### Load Testing
- Test pagination performance
- Test concurrent requests
- Test backlog query performance with caching

---

## Future Enhancements

### Session Module
- Session-based authentication (currently reserved)
- Session tracking and management

### Additional Features
- Bulk employee import
- Advanced reporting
- Email template customization
- Audit report generation
- Two-factor authentication
- API rate limiting per user

---

## Quick Reference: Database Schema Variants

### Schools Table (Modern vs Legacy)

**Modern Schema:**
- Columns: `schoolId` (PK), `schoolName`, `school_code`

**Legacy Schema:**
- Columns: `id` (PK), `school_name`, (optional: `school_code`)

**Resolution:** `resolveSchoolSchemaInfo()` detects schema dynamically

### Employees Table (Modern vs Legacy)

**Modern Schema:**
- Columns: `id`, `first_name`, `last_name`, `employee_type`

**Legacy Schema:**
- Columns: `id`, `firstName`, `lastName`, `teacher_status`

**Resolution:** `resolveEmployeeTableName()` detects schema dynamically

---

## Integration Points

### Frontend Integration
- All endpoints require Authorization header with JWT token
- Token obtained from `/auth/login`
- Refresh token flow via `/auth/verify-password` pattern

### Email System
- Mailer utility sends notifications for:
  - Registration submitted
  - Registration approved/rejected
  - User role changed
  - Account status changed
  - Password reset
  - Password changed
  - Account created (with credentials)

### PDF Generation
- Leave cards: PDFKit
- Step increment notices: PDFKit

### Reporting
- Backlog reports: CSV export
- Leave cards: PDF
- Salary notices: PDF

---

**End of Module Analysis**
