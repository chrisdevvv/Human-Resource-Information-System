# Middleware Folder

This folder contains reusable request middleware.

## Files
- `authMiddleware.js`: Verifies bearer JWT and blocks revoked sessions.

## Authentication Flow
1. Reads `Authorization: Bearer <token>` header.
2. Verifies JWT using `JWT_SECRET`.
3. If token has `jti`, checks `revoked_tokens` table.
4. Attaches decoded payload to `req.user` and token string to `req.token`.

## Typical Failure Responses
- `401 No token provided`
- `401 Session has ended. Please log in again.`
- `401 Unauthorized`
