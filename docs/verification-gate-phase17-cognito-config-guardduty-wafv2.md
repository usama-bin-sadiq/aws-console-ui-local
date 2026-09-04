## Phase 17 — Cognito + Config + GuardDuty + WAFv2 Complete Verification Gate

### Files Edited / Created
- [x] `src/app/cognito/page.tsx` (updated — User Pools table + App Clients tab with create/delete clients, User list modal)
- [x] `src/app/api/cognito/route.ts` (updated — `ListUserPoolClients`, `CreateUserPoolClient`, `UpdateUserPoolClient`, `DeleteUserPoolClient`, `DescribeUserPoolClient` using adapter SDK clients)
- [x] `src/app/config/page.tsx` (updated — Configuration recorder table with create/delete actions, recorder creation modal, Config rules with actions)
- [x] `src/app/api/config/route.ts` (updated — `PutConfigurationRecorder`, `DescribeConfigurationRecorderStatus`, `DeleteConfigurationRecorder`, `StartConfigurationRecorder`, `StopConfigurationRecorder` using adapter SDK clients)
- [x] `src/app/guardduty/page.tsx` (updated — Findings table with severity/status indicators + archive action, Detectors table with enable/delete, Tabs layout)
- [x] `src/app/api/guardduty/route.ts` (updated — `ListFindings`, `ArchiveFindings`, `UnarchiveFindings`, `UpdateFindingsFeedback` using adapter SDK clients)
- [x] `src/app/wafv2/page.tsx` (updated — Web ACLs table with Rules button, Rules modal showing embedded rules, Create Web ACL modal)
- [x] `src/app/api/wafv2/route.ts` (updated — `GetWebACL` (rules retrieval), `UpdateWebACL`, `ListIPSets`, adapter error handler applied)
- [x] `docs/verification-gate-phase17-cognito-config-guardduty-wafv2.md` (this checklist)

### PRD Alignment (§9.2.5 Security, Identity & Compliance — Cognito, Config, GuardDuty, WAFv2)
- [x] Cognito sub-pages covered: User Pools (table + actions), App Clients (tab + create/delete clients), Users (list per pool)
- [x] Config sub-pages covered: Configuration Recorders (table + create/delete), Config Rules (table + create/delete), Recorder status actions
- [x] GuardDuty sub-pages covered: Findings (table + archive, severity indicator), Detectors (enable/delete)
- [x] WAFv2 sub-pages covered: Web ACLs (table + create/delete), Rules (modal per ACL), Basic IP set retrieval
- [x] All service pages use `Tabs` with consistent `SpaceBetween` layout; interactive elements have `ariaLabel` (delete buttons, refresh buttons)
- [x] Tables use `Table` with `items`, `loading`, `empty` states; `StatusIndicator` used for GuardDuty severity (`High/Medium/Low` mapping)
- [x] Forms have `label` associated inputs (`FormField` + `Input`) for pool name, client name, recorder name, ACL name
- [x] No custom CSS outside `Cloudscape` design tokens; all styling via component props and `SpaceBetween`
- [x] Adapter SDK clients used exclusively (`cognitoIdp`, `configService`, `guardduty`, `wafv2` from `src/lib/aws-clients`)
- [x] Adapter error handler (`getAdapterStatus`, `handleAdapterError`) applied to all updated API routes (Config, GuardDuty, WAFv2)

### API Route Coverage (`src/app/api/cognito/route.ts`)
- [x] `GET` — `ListUserPoolsCommand` (user pools list) + `ListUserPoolClientsCommand` (clients per pool)
- [x] `POST` actions — `CreateUserPoolClient`, `UpdateUserPoolClient`, `DeleteUserPoolClient` (via POST body actions) + existing `CreateUserPool`, `ListUsers`, `AdminCreateUser`
- [x] Adapter SDK clients (`cognitoIdp`) used; adapter middleware headers (`x-adapter-mode`) preserved via `fetch` call patterns

### API Route Coverage (`src/app/api/config/route.ts`)
- [x] `GET` — `DescribeConfigurationRecordersCommand` + `DescribeConfigRulesCommand` + `DescribeConfigurationRecorderStatusCommand` (action=describeRecorderStatus)
- [x] `POST` actions — `PutConfigurationRecorderCommand` (createRecorder), `StartConfigurationRecorderCommand`, `StopConfigurationRecorderCommand`, `PutConfigRuleCommand`
- [x] `DELETE` — `DeleteConfigurationRecorderCommand` (action=deleteRecorder) + `DeleteConfigRuleCommand`
- [x] Adapter error handler (`getAdapterStatus`, `handleAdapterError`) applied to all routes

### API Route Coverage (`src/app/api/guardduty/route.ts`)
- [x] `GET` — `ListDetectorsCommand` + `ListFindingsCommand` (action=listFindings)
- [x] `POST` actions — `CreateDetectorCommand` (enable), `ArchiveFindingsCommand`, `UnarchiveFindingsCommand`, `UpdateFindingsFeedbackCommand`
- [x] `DELETE` — `DeleteDetectorCommand`
- [x] Adapter error handler applied to all routes

### API Route Coverage (`src/app/api/wafv2/route.ts`)
- [x] `GET` — `ListWebACLsCommand` + `GetWebACLCommand` (action=getWebAcl for rules retrieval) + `ListIPSetsCommand`
- [x] `POST` actions — `CreateWebACLCommand` + `UpdateWebACLCommand` (rules update)
- [x] `DELETE` — `DeleteWebACLCommand`
- [x] Adapter error handler applied; endpoint rewrite handled by adapter SDK layer (`wafv2` singleton)

### TypeScript / Build Verification
- [x] No inline `any` types added; interfaces defined (`UserPoolClient`, `Finding`, `WAFv2Rule`, `ConfigurationRecorder` updates)
- [x] `@aws-sdk/client-cognito-identity-provider` commands imported explicitly
- [x] `@aws-sdk/client-config-service` commands imported explicitly (`PutConfigurationRecorderCommand`, `DeleteConfigurationRecorderCommand`, etc.)
- [x] `@aws-sdk/client-guardduty` commands imported explicitly (`ListFindingsCommand`, `ArchiveFindingsCommand`, etc.)
- [x] `@aws-sdk/client-wafv2` commands imported explicitly (`GetWebACLCommand`, `UpdateWebACLCommand`, etc.)
- [x] Adapter SDK clients (`cognitoIdp`, `configService`, `guardduty`, `wafv2`) reused from `src/lib/aws-clients`
- [x] Adapter config (`ADAPTER_CONFIG`) and adapter middleware types (`AdapterConfigShape`, `MappedRequest`) referenced correctly

### Accessibility / Security / Design System
- [x] `Modal` footer actions use `formAction="none"` (WAFv2 rules modal, Config recorder modal, Cognito client modal)
- [x] `Alert` components used for errors and info messages (`GuardDuty not enabled`, `Select a user pool` info)
- [x] `StatusIndicator` mapped correctly: `High` = error, `Medium` = warning, `Low` = info (GuardDuty findings)
- [x] All buttons have descriptive `ariaLabel` patterns via `formAction="none"` and contextual labels
- [x] All service pages reference adapter SDK exclusively; no direct SDK initialization without adapter layer
- [x] `ServiceLayout` not required per service; `Tabs` layout provides consistent service-level navigation

### Verification Checklist Complete
Phase 17 Cognito (User Pools + Clients) + Config (Recorders + Rules) + GuardDuty (Findings + Detectors) + WAFv2 (Web ACLs + Rules) implemented per PRD §9.2.5 (Security, Identity & Compliance). All SDK actions wired through adapter SDK; resource tables include filtering, pagination, and action buttons; create/edit/view workflows use `Modal` + `FormField` + `Cloudscape` components; adapter error handler (`handleAdapterError`) applied to Config, GuardDuty, and WAFv2 APIs; verification gate documented.
