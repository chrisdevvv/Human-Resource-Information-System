# Backend Source Overview

This folder contains the Express backend application source code.

## Entry Points
- `app.js`: Express app bootstrap, middleware registration, route mounting, startup checks, and monthly leave-credit scheduler.
- `seed.js`: Seeds or updates default test accounts and sample school records.

## Core Folders
- `config/`: Infrastructure setup (database connection pool).
- `middleware/`: Shared request middleware (authentication, authorization helpers).
- `modules/`: Feature-based modules with routes, controllers, and models.
- `utils/`: Shared helpers (mailer and utility functions).

## API Route Prefixes
Mounted in `app.js`:
- `/api/auth`
- `/api/leave`
- `/api/employees`
- `/api/schools`
- `/api/backlogs`
- `/api/registrations`
- `/api/users`

## Runtime Behaviors
- Initializes `revoked_tokens` table for JWT logout revocation.
- Ensures `leaves.entry_kind` schema support.
- Runs auto monthly leave credit unless disabled with `AUTO_MONTHLY_CREDIT=false`.
