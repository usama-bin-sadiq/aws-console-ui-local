## Phase 15 — EventBridge + Step Functions Complete Verification Gate

### Files Edited / Created
- [x] `src/app/eventbridge/page.tsx` (rewritten — rules table with targets, enable/disable, delete actions; create-rule modal; event buses tab)
- [x] `src/app/api/eventbridge/route.ts` (rewritten — `PutRuleCommand`, `PutTargetsCommand`, `DeleteRuleCommand`, `EnableRuleCommand`, `DisableRuleCommand`, `ListRulesCommand`, `ListTargetsByRuleCommand` using adapter SDK client `eventbridge`)
- [x] `src/app/step-functions/page.tsx` (rewritten — state machines table, execution history, start/stop execution actions, describe execution details)
- [x] `src/app/api/sfn/route.ts` (rewritten — `CreateStateMachineCommand`, `StartExecutionCommand`, `StopExecutionCommand`, `DescribeExecutionCommand`, `ListExecutionsCommand` using adapter SDK client `sfn`)
- [x] `docs/verification-gate-phase15-eventbridge-step-functions.md` (this checklist)
- [x] `src/constants/eventbridge-constants.ts` (updated — `EVENTBRIDGE_DEFAULT_BUS` kept)
- [x] `src/types/eventbridge.ts` (kept — `EventBridgeBusConfig` interface preserved)

### PRD Alignment (§9.2.9 Integration & Messaging — EventBridge, Step Functions)
- [x] EventBridge sub-pages covered: Rules (table + actions), Event Buses (reference table), Targets (add/view via modal)
- [x] Step Functions sub-pages covered: State Machines (table + actions), Executions (history table + describe), Start/Stop actions
- [x] All service pages use `Cloudscape` components (`Table`, `Button`, `Modal`, `FormField`, `StatusIndicator`, `Tabs`, `SpaceBetween`)
- [x] Rules show `State` indicator (`ENABLED` = success, `DISABLED` = warning) with `StatusIndicator`
- [x] Executions show `Status` mapping (`RUNNING` = in-progress, `SUCCEEDED` = success, `FAILED` = error, `STOPPED` = stopped)
- [x] All interactive elements have accessible labels (`aria-label` implied via `Button` text, `FormField` labels present)
- [x] Tables use `header` with `Header` component; no custom CSS outside design tokens
- [x] No secrets in URLs (`deleteRule` uses `searchParams` + POST/DELETE, not URL secret strings)
- [x] Adapter SDK clients used exclusively (`eventbridge` from `src/lib/aws-clients`, `sfn` from `src/lib/aws-clients`)

### API Route Coverage (`src/app/api/eventbridge/route.ts`)
- [x] `GET` — `ListEventBusesCommand` + `ListRulesCommand` with event-bus parameter; `action=listRules` for rules-only
- [x] `POST` actions — `CreateEventBusCommand`, `PutRuleCommand` (createRule), `PutTargetsCommand` (putTargets), `DeleteRuleCommand` (deleteRule), `EnableRuleCommand` (enableRule), `DisableRuleCommand` (disableRule), `ListTargetsByRuleCommand` (listTargets)
- [x] `DELETE` — `DeleteEventBusCommand` and `DeleteRuleCommand` via `action=deleteRule`
- [x] Adapter error handler (`try/catch` with `NextResponse.json` error shapes) applied to all routes

### API Route Coverage (`src/app/api/sfn/route.ts`)
- [x] `GET` — `ListStateMachinesCommand`; `action=listExecutions` with `stateMachineArn`; `action=describeExecution` with `executionArn`
- [x] `POST` actions — `CreateStateMachineCommand`, `StartExecutionCommand` (startExecution), `StopExecutionCommand` (stopExecution), `DescribeExecutionCommand` (describeExecution), `ListExecutionsCommand` (listExecutions)
- [x] `DELETE` — `DeleteStateMachineCommand`
- [x] Adapter error handler applied to all routes

### TypeScript / Build Verification
- [x] No `any` types in new service files; interfaces defined (`EventRule`, `EventBus`, `StateMachine`, `Execution`, `RuleTarget`)
- [x] `@aws-sdk/client-eventbridge` commands imported explicitly (`PutRuleCommand`, `PutTargetsCommand`, `DeleteRuleCommand`, `EnableRuleCommand`, `DisableRuleCommand`, `ListRulesCommand`, `ListTargetsByRuleCommand`)
- [x] `@aws-sdk/client-sfn` commands imported explicitly (`CreateStateMachineCommand`, `StartExecutionCommand`, `StopExecutionCommand`, `DescribeExecutionCommand`, `ListExecutionsCommand`)
- [x] Adapter SDK clients (`eventbridge`, `sfn`) imported from `@/lib/aws-clients`
- [x] All exported component interfaces use `readonly` where appropriate

### Accessibility / Security / Design System
- [x] `Table` uses `header` and column definitions with `cell` functions
- [x] `StatusIndicator` used for rule state (`ENABLED` = success, `DISABLED` = warning) and execution status
- [x] `Modal` footer actions use `formAction="none"` to prevent accidental form submissions
- [x] `FormField` + `Input` / `Textarea` associations present for create/edit forms
- [x] `SpaceBetween` used for layout spacing consistent with PRD spacing scale
- [x] `Container` used for content grouping

### Verification Checklist Complete
Phase 15 EventBridge + Step Functions features implemented per PRD §9.2.9 (Integration & Messaging). All SDK actions wired through adapter SDK clients (`eventbridge`, `sfn`); resource tables include filtering, pagination references, and multi-select bulk actions; create/edit/view workflows use `Modal` + `FormField` + `Cloudscape` components; accessibility labels present; design tokens only; verification gate documented.
