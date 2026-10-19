# Cross-Cutting Principles

1. **Cloudscape First** — All UI uses `@cloudscape-design/components`; no custom CSS layouts.
2. **Server-Side Security** — Authorization (`isSuperAdmin`) must be resolved from DB, never from client headers.
3. **Per-User Isolation** — All API routes enforce data isolation via `getUserPermissionsAsync`.
4. **Environment-Driven Config** — No hardcoded credentials; env vars with `console.warn` fallbacks.
5. **Accessible by Default** — All components include `aria-label` and keyboard support.
6. **Real SDK, Real Endpoint** — Use real `@aws-sdk/client-*` v3 clients against LocalStack/MinStack.
7. **Verified Before Merge** — TypeScript (`tsc --noEmit`), lint (`pnpm lint`), and coverage (`pnpm test:coverage`) must pass.
