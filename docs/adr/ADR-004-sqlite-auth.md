# ADR-004: SQLite for Local Authentication

## Status
Accepted (Needs Hardening)

## Context
Need local user management without real AWS IAM.

## Decision
SQLite database with users table, seeded with root/admin/readonly users. Passwords currently stored in plaintext.

## Consequences
### Positive
- Zero-config local development
- Persistent across restarts
- MFA support built-in

### Negative
- **CRITICAL**: Plaintext passwords (must fix with bcrypt/argon2)
- No rate limiting on auth endpoints
- Session management via localStorage (not secure)