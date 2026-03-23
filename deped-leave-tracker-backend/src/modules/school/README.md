# School Module

Base route: `/api/schools`

## Purpose
Provides CRUD operations for school master records.

## Endpoints
- `GET /`: Get all schools.
- `GET /:id`: Get school by id.
- `POST /`: Create school.
- `PUT /:id`: Update school.
- `DELETE /:id`: Delete school.

## Current Access Note
- Routes are currently public in the route file (no auth middleware attached).
- Consider adding authentication and role-based restrictions for production security.
