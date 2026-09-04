# Contributing

This project follows universal agent rules (`AGENTS.md`, `.opencode/rules.md`, `.claude/CLAUDE.md`).

- Before writing code: read docs (`requirements.md`, `design.md`, `plan.md`) and check `types/`, `constants/`, `enums/` for existing patterns.
- Separate files required: `types/`, `constants/`, `enums/`, `components/`, `hooks/`, `services/`, `lib/`.
- Strict TypeScript: no `any`, explicit return types, interfaces preferred over type aliases.
- DRY enforced: no duplicate adapter initialization; reuse `localstack-adapter/`, `sdk-factory.ts`, `hooks/`.
- Zero stubs/deferred work: every component/file fully implemented; no `TODO`, `stub`, `later`, or placeholder functions.
- Adapter rules: all SDK clients route through adapter middleware (`sdk-adapter-middleware.ts`); endpoint/auth/headers injected by `endpoint-resolver` + `auth-injector`.
- Build/test: `npm run build` passes; `npm run test` covers adapter layer (>90%); `npm run lint` passes with zero errors.
- Production Docker build: multi-stage `Dockerfile` builds successfully; `docker-compose up` connects adapter.
