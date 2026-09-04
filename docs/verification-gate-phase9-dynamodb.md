## Phase 9 — DynamoDB (Tables + Items — Complete) Verification Gate

### Files Edited / Created
- [x] `src/app/api/dynamodb/route.ts` (rewritten — full item CRUD + Query + Scan + describe)
- [x] `src/app/dynamodb/[tableName]/page.tsx` (new — table detail with Overview and Items tabs)
- [x] `docs/verification-gate-phase9-dynamodb.md` (this file)

### PRD Alignment (§9.2.3 Database, §15.8 DynamoDB Workflow)
- [x] DynamoDB service console has sub-pages: Tables (list), Table detail (`[tableName]`)
- [x] Table detail has Overview tab (table info, status, item count, key schema, billing mode) and Items tab (Scan/Query results, Add/Edit/Delete via JSON editor)
- [x] Items tab uses Cloudscape `Table`, `TextFilter`, `Modal`, `Tabs`, `ServiceLayout`, `Header`, `Button`, `StatusIndicator`
- [x] Add/Edit uses `JsonEditor` component with native DynamoDB JSON format (`{"S":"..."}`)
- [x] Delete uses confirmation `Modal` with warning `Alert`
- [x] Design tokens (`Cloudscape` components, `var(--awsui-color-*)`) — no custom CSS colors outside tokens
- [x] All interactive elements have `ariaLabel`
- [x] Tables have `header` labels
- [x] Forms/modal actions have associated labels (`label` on `FormField` or `header` on `Modal`)

### API Route Coverage (`src/app/api/dynamodb/route.ts`)
- [x] `GET` — `ListTables` (existing), `DescribeTable` (`?tableName=X`), `Scan` (`?tableName=X&action=scan`), `Query` (`?tableName=X&action=query`)
- [x] `POST` — `CreateTable` (backward-compatible), `Scan` (`action: "scan"`), `Query` (`action: "query"`), `PutItem` (`action: "putItem"`), `GetItem` (`action: "getItem"`), `DeleteItem` (`action: "deleteItem"`), `UpdateItem` (`action: "updateItem"`)
- [x] `DELETE` — `DeleteTable` (existing)
- [x] All actions use `@aws-sdk/client-dynamodb`
- [x] Adapter error handler (`getAdapterStatus`, `handleAdapterError`) applied to all routes

### TypeScript / Build Verification
- [x] No TypeScript errors in new/updated DynamoDB files (`npx tsc --noEmit` clean for `dynamodb/` and `api/dynamodb/`)
- [x] Existing unrelated errors in other service pages pre-date this work

### Accessibility / Security / Design System
- [x] All buttons have `ariaLabel`
- [x] `Modal` components have `header` and `footer` with clear actions
- [x] `TextFilter` has `filteringAriaLabel`
- [x] `Table` has `ariaLabels`
- [x] `ServiceLayout` provides breadcrumbs and consistent service console layout
- [x] No secrets in URLs (table names encoded with `encodeURIComponent`)
- [x] No hardcoded AWS endpoints (uses `process.env.AWS_ENDPOINT_URL` via adapter layer)
- [x] All text strings are in component source (ready for i18n)

### Feature Completeness Checklist (Per PRD §9.2.3 & §15.8)
- [x] Table creation: name, partition key, sort key, capacity mode (`PAY_PER_REQUEST` / `PROVISIONED`), tags — handled by existing `dynamodb/page.tsx`
- [x] Table details: Overview tab shows `TableName`, `TableStatus`, `ItemCount`, `KeySchema`, `BillingModeSummary`
- [x] Items tab: Scan results displayed in `Table` with dynamic columns
- [x] Items tab: Add item via JSON editor (`JsonEditor`)
- [x] Items tab: Edit item (opens same JSON editor with current item data)
- [x] Items tab: Delete item with confirmation modal
- [x] Items tab: Filter/search (`TextFilter`) applied to scan results
- [x] Refresh button reloads both table info and items
- [x] Back navigation (`Back to Tables`) links to `/dynamodb`

### Verification Checklist Complete
Phase 9 DynamoDB Tables + Items implemented per PRD §9.2.3 and §15.8.
