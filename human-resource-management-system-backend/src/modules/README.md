# Modules Folder

This folder contains feature-based backend modules.

## Module List
- `auth/`: Login, registration request submission, password and session endpoints.
- `backlog/`: System activity logs and audit trail retrieval.
- `employee/`: Employee CRUD operations and school-scoped queries.
- `leave/`: Leave ledger CRUD and monthly crediting logic.
- `registration/`: Approval/rejection workflow for registration requests.
- `school/`: School CRUD endpoints.
- `session/`: Reserved for future session-related logic.
- `user/`: User management, role/status updates, admin-created accounts.

Each implemented module generally follows:
- `*Routes.js`: Endpoint definitions.
- `*Controller.js`: Request handlers and business logic.
- `*Model.js`: Database queries.
