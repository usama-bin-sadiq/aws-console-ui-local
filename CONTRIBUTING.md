# Contributing

Local AWS Emulator Console is an open-source project for inspecting and managing services provided by local AWS-compatible emulators.

## Development principles

- Keep the console emulator-only. Never add real AWS credential collection or silently target a production AWS account.
- Use Cloudscape components and tokens for user-facing UI.
- Expose only services and operations confirmed by active provider capability data.
- Keep cross-service links capability-aware; do not fabricate resources, metrics, events, or success states.
- Preserve accessible keyboard, focus, loading, error, and responsive behavior.

## Development workflow

- Before writing code: read `PRD.md` and check `types/`, `constants/`, `components/`, and `hooks/` for existing patterns.
- Separate files required: `types/`, `constants/`, `enums/`, `components/`, `hooks/`, `services/`, `lib/`.
- Strict TypeScript: no `any`, explicit return types, interfaces preferred over type aliases.
- DRY enforced: no duplicate adapter initialization; reuse `localstack-adapter/`, `sdk-factory.ts`, `hooks/`.
- Do not add fake data or placeholder success states. Unsupported provider operations should be explicit.
- Adapter rules: all SDK clients route through adapter middleware (`sdk-adapter-middleware.ts`); endpoint/auth/headers injected by `endpoint-resolver` + `auth-injector`.
- Validation: run `npm run build` and `npm run lint` for code changes. Add focused tests for behavior changes when appropriate.
- Production Docker build: multi-stage `Dockerfile` builds successfully; `docker-compose up` connects adapter.
