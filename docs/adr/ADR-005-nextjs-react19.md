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