<!-- AGENT_RULES_START -->
# Universal Agent Rules — Mandatory for All Editors (AWS Console Clone)

> **Auto-Learn Protocol:** Every agent, AI editor, and code assistant MUST read this file and the `.opencode/` / `.claude/` rules BEFORE making any edit. If rules change, update this file and notify.

> **PRD MASTER REFERENCE:** The authoritative product requirements are in `docs/prd-aws-management-console.md`. Every feature, workflow, UI spec, security requirement, and non-functional target is defined there. All code changes must align with that PRD.

---

## 1. Auto-Learn / Load Order
- **Step 1:** Read `/AGENTS.md` (this file).
- **Step 2:** Read `docs/prd-aws-management-console.md` (master PRD — feature specs, workflows, design tokens, accessibility, i18n, service catalog).
- **Step 3:** Load `.opencode/rules.md` and `.claude/CLAUDE.md`.
- **Step 4:** Apply all instructions below automatically. Do not skip.
- **Step 5:** If the agentic editor generates code that violates any rule, correct it immediately before presenting to the user.

---

## 2. File Organization & Folder Structure (Per PRD Section 4 + 5)
- Separate by **concern**, not by type alone.
- Preferred folders: `components/`, `hooks/`, `utils/`, `types/`, `constants/`, `enums/`, `interfaces/`, `services/`, `lib/`.
- **Service consoles** must live in `src/app/[service]/` with full feature parity per PRD Appendix A.
- Keep components thin; logic belongs in hooks/services/utils.
- Do not dump everything into `pages/` or `app/` without separation.
- All service routes (200+) must be present and functional per `docs/prd-aws-management-console.md` Appendix A.

---

## 3. Best Practices — DRY, Reusable, Separate (Per PRD Section 16 + 18)
### 3.1 Constants / Enums / Interfaces / Types — ALWAYS Separate
- **Constants:** Extract into `constants.ts` (or `constants/`) — never inline magic numbers/strings. Every AWS service must have `constants/[service]-constants.ts` (see PRD service catalog).
- **Enums:** Create `enums.ts` or `enums/` — never use loose union strings where an enum is better.
- **Interfaces / Types:** Create `types.ts`, `interfaces.ts`, or `types/` — never define inline types inside components/pages unless temporary. Every resource (`EC2Instance`, `S3Bucket`, `LambdaFunction`, `IAMUser`, etc.) must be exported from `src/types/`.
- **Reuse:** If an interface is used in >1 file, export it from a shared file; never redeclare.

### 3.2 Reusable Code (Per PRD Section 9 + 10 + 14)
- Extract duplicated logic into shared utilities (`utils/`), hooks (`hooks/`), or services (`services/`).
- One source of truth per rule, per data shape, per business logic.
- Before writing new code, search existing files for reusable patterns (hooks, components, constants) in `src/lib/`, `src/hooks/`, `src/services/`.
- Every service console must reuse the universal adapter layer (`src/lib/localstack-adapter/`) — no duplicate SDK initialization.

### 3.3 DRY (Don't Repeat Yourself)
- No copy-paste logic across files.
- No duplicate state shapes; use shared interfaces from `src/types/`.
- No duplicate URLs / endpoints; use constants or service files (`constants/navigation.ts`, `constants/regions.ts`).
- If you encounter duplication, refactor into a shared module immediately.

---

## 4. Naming & Style (Per PRD Section 4.3 + 16.4)
- **Types / Interfaces:** PascalCase (`UserProfile`, `ApiResponse`).
- **Constants:** `SCREAMING_SNAKE_CASE` (`MAX_RETRY_COUNT`, `API_BASE_URL`).
- **Functions / Variables:** descriptive `camelCase` (`fetchUserData`, `isLoading`).
- **Components:** PascalCase (`UserCard`, `LoginForm`).
- **Files / Folders:** `kebab-case` for service directories, `PascalCase` for components.
- No abbreviations unless universally known (`API`, `ID`, `UI`, `EC2`, `S3`).
- Prefer explicit names over `data`, `item`, `value`.

---

## 5. TypeScript / Code Quality (Per PRD Section 5 + 18)
- **Strict mode:** No implicit `any`. Use `unknown` when needed, then narrow.
- **Explicit return types** on public functions and exported components.
- **No inline `any`:** If you don't know the type, define an interface or use generics.
- **Prefer interfaces** over type aliases for object shapes when extension is likely.
- **Use `const` assertions** and `readonly` where appropriate.
- All adapter middleware interfaces exported (`AdapterConfigShape`, `MappedRequest`, `NormalizedResponse`).

---

## 6. Before Writing / Changing Code
1. Search repo for existing constants, enums, interfaces.
2. Check `types/`, `constants/`, `enums/` first.
3. Check `docs/prd-aws-management-console.md` for feature spec (workflows, table columns, wizard steps, design tokens).
4. If reusable component/hook exists (`AppShell`, `ResourceTable`, `ResourceDetails`, `ResourceWizard`, `PropertyFilter`, `Tags`), extend it rather than duplicating.
5. Write tests or types first when possible.

---

## 7. Agentic Editor Protocol (Automatic) (Per PRD Section 6 + 7 + 17)
When running inside any agentic code editor (Claude Code, GitHub Copilot, Cursor, Windsurf, Aider, etc.):
- **Auto-load:** Editor must load `AGENTS.md`, `.opencode/rules.md`, `.claude/CLAUDE.md`, and `docs/prd-aws-management-console.md`.
- **Auto-apply:** All rules in Section 3 (DRY, separate files, reusable) must be applied to every generated snippet.
- **Auto-correct:** If generated code uses inline interfaces/constants, duplicates logic, skips types, or deviates from PRD design tokens (`Cloudscape` components only), fix it before returning output.
- **Never skip:** Do not omit `types/` or `constants/` files, adapter middleware, or PRD workflow steps to save time.
- **Visual parity:** All UI components must use `Cloudscape` (`@cloudscape-design/components`) with exact AWS design tokens. No custom CSS outside tokens. No custom colors.

---

## 8. Documentation & Maintenance (Per PRD Section 2 + 24)
- Update this `AGENTS.md` when team rules change.
- Keep `.opencode/` and `.claude/` in sync with root rules.
- Reference `docs/prd-aws-management-console.md` as the master feature/design document.
- If a new best practice is adopted, add it here first.
- Before finalizing any edit, verify with the project's build/test commands (`npm run lint`, `npm run test`, `npm run build`) as defined in this file or `opencode.json`.
- If plan mode is available (`Tab` in opencode), create a plan first when the task is complex; switch back to build mode (`Tab`) when approved.
- All edits must reference `docs/prd-aws-management-console.md`: which feature ID (F-001 to F-035), which service category, which workflow section, which design token, which accessibility standard.

---

## 9. OpenCode / Agent Standard Rules (From Official Docs)
> Source: https://opencode.ai/docs/rules/ — apply these to all agent sessions.

### 9.1 AGENTS.md Purpose & Init
- This file (`AGENTS.md`) is the standard instruction file for opencode (similar to Cursor rules). **Commit it to Git.**
- Run `/init` in opencode to automatically scan your repo and create/update `AGENTS.md` with concise project-specific guidance.
- `/init` focuses on: build/lint/test commands; command order and verification steps; architecture/repo structure not obvious from filenames; project-specific conventions, setup quirks, operational gotchas; references to Cursor / Copilot rules.
- **Post-init:** Reference `docs/prd-aws-management-console.md` for service-specific architecture.

### 9.2 Project vs Global vs Claude Compatibility
- **Project:** `AGENTS.md` in repo root applies when working in this directory or sub-directories.
- **Global:** `~/.config/opencode/AGENTS.md` applies across all sessions (personal rules; not shared).
- **Claude Code fallback:** `CLAUDE.md` in project directory and `~/.claude/CLAUDE.md` are used if no `AGENTS.md` exists. To disable: `export OPENCODE_DISABLE_CLAUDE_CODE=1` (or partial vars).

### 9.3 Precedence Order (First Matching Wins)
When an agent starts, it looks for rules in this order:
1. **Local files** traversing up from current directory (`AGENTS.md`, then `CLAUDE.md`)
2. **Global file:** `~/.config/opencode/AGENTS.md`
3. **Claude Code file:** `~/.claude/CLAUDE.md` (unless disabled)
- If both `AGENTS.md` and `CLAUDE.md` exist locally, **only `AGENTS.md` wins**.
- If `~/.config/opencode/AGENTS.md` exists, it takes precedence over `~/.claude/CLAUDE.md`.

### 9.4 Custom Instructions & External References
- Use `opencode.json` (repo root) to reference external instruction files:
  ```json
  {
    "$schema": "https://opencode.ai/config.json",
    "instructions": [
      "AGENTS.md",
      ".opencode/rules.md",
      ".claude/CLAUDE.md",
      "docs/prd-aws-management-console.md"
    ]
  }
  ```
- Remote URLs are fetched with a 5-second timeout.
- All instruction files are combined with `AGENTS.md`.
- For modular reusable rules (monorepos / shared standards), prefer `opencode.json` with glob patterns (e.g., `packages/*/AGENTS.md`) over duplicating rules into every package.

### 9.5 Lazy External File Loading in AGENTS.md
- If you reference external files (e.g., `@docs/react-patterns.md`, `@rules/general.md`), include explicit lazy-loading instructions:
  - Do NOT preemptively load all references; load on need-to-know basis.
  - When loaded, treat content as mandatory instructions that override defaults.
  - Follow references recursively when needed.
- **For PRD references:** When you encounter `@prd/section.md` or `docs/prd-aws-management-console.md`, load that section before implementing any service feature.

### 9.6 Verification & Build Commands
- Before finalizing any edit, verify with the project's build/test commands (`npm run lint`, `npm run test`, `npm run build`, `npm run test:coverage`) as defined in this file or `opencode.json`.
- Coverage target: >85% for adapter layer (`src/lib/localstack-adapter/`), >85% for new service components.
- **PRD verification:** Confirm implemented feature matches PRD workflow steps, component names, table columns, wizard steps, design tokens, and accessibility requirements.

---

## 10. PRD-Aligned Implementation Rules (From `docs/prd-aws-management-console.md`)

### 10.1 Feature IDs & Service Catalog
- Every feature must reference its Feature ID: F-001 (Auth), F-002 (Dashboard), F-003 (Service Nav), ..., F-035 (Cross-Service Search).
- Every service must follow the full service catalog in PRD Appendix A (200+ services with sub-pages).
- Every workflow must follow the exact multi-step wizard patterns defined in PRD Section 15.

### 10.2 Design Tokens & Visual Identity
- All colors must come from `Cloudscape` design tokens (`var(--awsui-color-*)`).
- All spacing must use the PRD spacing scale (xs: 4px, s: 8px, m: 16px, l: 24px, xl: 32px, xxl: 48px).
- All typography: `Open Sans`, `Helvetica Neue`, sans-serif.
- All components must use `Cloudscape` APIs exactly (`AppLayout`, `SideNavigation`, `TopNavigation`, `Table`, `Tabs`, `Wizard`, `Form`, `PropertyFilter`, `Tags`, `Modal`, `SplitPanel`, `Container`, `Header`, `Button`, `ButtonDropdown`, `SpaceBetween`, `StatusIndicator`, `Flashbar`).

### 10.3 Accessibility Requirements
- **WCAG 2.1 AA compliance mandatory.**
- All interactive elements must have `aria-label`.
- All tables must have `th` headers and `scope`.
- All forms must have associated `<label>`.
- Focus management visible on all interactive elements.
- Screen reader announcements (`aria-live`) for dynamic updates.
- Color contrast minimum 4.5:1.
- Reduced motion support (`prefers-reduced-motion`).

### 10.4 Security Requirements
- TLS 1.2+ for all connections.
- No secrets in URLs, localStorage (except adapter settings if user opts in), or logs.
- CSRF protection on all POST/PUT/DELETE.
- CSP headers configured.
- XSS prevention (React default escaping + CSP).
- Adapter dummy credentials (`test`/`test`) never transmitted to real AWS endpoints.

### 10.5 Internationalization (i18n)
- All text strings must use `i18next` or `react-intl` (or similar) — never hardcoded English.
- All date/time formats locale-aware.
- RTL layout support (`dir="rtl"`) for Arabic (`ar`) and Hebrew (`he`).
- Number formats locale-aware.

---

**Reference:** `docs/requirements.md`, `docs/design.md`, `docs/plan.md`, `docs/minstack-localstack-common-different.md`, `docs/prd-aws-management-console.md`, `AGENTS.md`, `.opencode/rules.md`, `.claude/CLAUDE.md`, `opencode.json`, `https://opencode.ai/docs/rules/`, `src/constants/service-compatibility.ts`

`after reading references complete your task in plan.md`

`make sure in all services and in app/ folder must be look like and have same flow as on original aws web console and also for icons used at aws are also available here public/icons make sure this app same replica of aws web console and have same feature including instruction or other dialoge as well same to same aws web console like everything and you are senior software full stack engineer, technical architect, solution and software architect`

<!-- AGENT_RULES_END -->

---

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
