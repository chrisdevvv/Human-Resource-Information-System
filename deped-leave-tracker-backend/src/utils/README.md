# Utils Folder

This folder contains shared helper utilities used by backend modules.

## Files
- `mailer.js`: SMTP-based notification service (registration, role updates, password events).
- `helpers.js`: Generic helper stubs for response formatting and error handling.

## Mailer Environment Variables
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`
- `FRONTEND_URL` or `APP_URL`

## Mailer Behavior
- If SMTP configuration is incomplete, email sending is skipped safely with warning logs.
- Email functions are designed to be fire-and-forget from controllers.

## Caution
- `helpers.js` currently includes placeholder logic and should be expanded before use in production workflows.
