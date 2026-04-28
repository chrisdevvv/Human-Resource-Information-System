# Employee Module

Base route: `/api/employees`

## Purpose
Manages employee records and exposes school-based employee listings.

## Endpoints
All routes require authentication.
- `GET /`: Get all employees.
- `GET /school/:school_id`: Get employees by school.
- `GET /:id`: Get one employee by id.
- `POST /`: Create employee.
- `PUT /:id`: Update employee.
- `DELETE /:id`: Delete employee.

## Behavior Notes
- Create, update, and delete operations also write activity logs to the backlog module.
- Employee data includes school association, employee type (teaching/non-teaching/teaching-related), and identity fields like TIN, GSIS BP#, GSIS CRN#, PAG-IBIG#, and PhilHealth.
- Deleting an employee may cascade to related leave records depending on database constraints.
