# Auth Module

Base route: `/api/auth`

## Purpose
Handles account access, registration request intake, password verification/change, logout token revocation, and reset-password flow.

## Endpoints
- `POST /register`: Submit a registration request.
- `POST /login`: Authenticate user and issue JWT.
- `POST /verify-password` (auth required): Verify current user password.
- `PATCH /change-password` (auth required): Change current user password.
- `POST /logout` (auth required): Revoke current JWT session.
- `POST /forgot-password`: Send password reset link.
- `POST /verify-old-password`: Verify old password through reset token flow.
- `POST /reset-password`: Complete password reset using token.

## Security Notes
- JWT payload includes a `jti` for revocation tracking.
- Logout stores `jti` in `revoked_tokens` until expiry.
- Reset tokens are signed with `JWT_SECRET + password_hash` so old links become invalid after password changes.
- Reset link token lifetime is currently 2 hours.
