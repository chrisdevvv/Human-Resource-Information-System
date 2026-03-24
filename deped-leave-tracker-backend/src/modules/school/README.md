# School Module

Base route: `/api/schools`

## Purpose
Provides CRUD operations for school master records.

## Endpoints
- `GET /`: Get all schools. Requires authenticated user (`DATA_ENCODER`, `ADMIN`, `SUPER_ADMIN`).
- `GET /:id`: Get school by id. Requires authenticated user (`DATA_ENCODER`, `ADMIN`, `SUPER_ADMIN`).
- `POST /`: Create school. Requires `ADMIN` or `SUPER_ADMIN`.
- `PUT /:id`: Update school. Requires `ADMIN` or `SUPER_ADMIN`.
- `DELETE /:id`: Delete school. Requires `ADMIN` or `SUPER_ADMIN`.

## Access Control
- Route-level authorization is enforced using `authMiddleware` and `roleAuthMiddleware`.
- Read access is available to authenticated users.
- Write access is restricted to admin-level roles.
