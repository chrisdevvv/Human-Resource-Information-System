# Session Module

## Status
This module folder is currently reserved and does not yet contain implementation files.

## Suggested Future Scope
Potential session-related features that can live here:
- Refresh token rotation.
- Session listing per user.
- Manual session revocation by admin.
- Device-level session metadata.

## Current Session Handling
At present, session lifecycle is handled primarily by:
- JWT issuance in auth module.
- JWT revocation via `revoked_tokens` checks in auth middleware.
