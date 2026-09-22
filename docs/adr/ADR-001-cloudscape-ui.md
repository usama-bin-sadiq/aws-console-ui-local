# ADR-001: Cloudscape Design System for UI

## Status
Accepted

## Context
We need a UI component library that matches AWS Console exactly. The AWS Console uses Cloudscape Design System internally.

## Decision
Use Cloudscape Design System (@cloudscape-design/components) for all visible UI.

## Consequences
### Positive
- Exact visual parity with AWS Console
- AWS-maintained, production-tested
- Built-in accessibility, responsiveness, theming
- Design tokens match AWS Console exactly

### Negative
- Large bundle size (~500KB gzipped)
- Learning curve for Cloudscape patterns
- Version lock-in to Cloudscape release cycle

---

# ADR-002: Adapter Pattern for Multi-Backend Support

## Status
Accepted

## Context
Need to support both LocalStack and MiniStack with different capability profiles.

## Decision
Implement adapter pattern with factory (createAdapter) that provides endpoint resolution, auth injection, request mapping, response normalization per backend.

## Consequences
### Positive
- Clean separation of backend concerns
- Easy to add new backends
- Capability-aware navigation built on adapter metadata

### Negative
- Additional abstraction layer
- Request/response mapping complexity

---

# ADR-003: Capability-Aware Navigation

## Status
Accepted

## Context
Services must only be visible when the active emulator supports them.

## Decision
Navigation items filtered through getAvailableNavigationItems() which checks SERVICE_REGISTRY against active provider health/capability.

## Consequences
### Positive
- Honest UI - no fake working services
- Automatic catalog refresh on provider switch
- Clear disabled states with reasons

### Negative
- Complex filtering logic
- Requires accurate emulator capability reporting

---

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

---

# ADR-005: Next.js App Router with React 19

## Status
Accepted

## Context
Modern React framework with server components, streaming, and improved DX.

## Decision
Use Next.js 15+ App Router, React 19, TypeScript strict mode.

## Consequences
### Positive
- Server components reduce client bundle
- Streaming SSR for perceived performance
- Modern React patterns (use, useActionState)

### Negative
- Hydration complexity with Cloudscape
- Client/Server boundary management
- Learning curve for App Router patterns