## Phase 8 — RDS (Instances + Snapshots) Complete Verification Gate

### Files Edited / Created
- [x] `src/types/rds.ts` (updated — added `RDSInstance`, `RDSDBSnapshot` interfaces)
- [x] `src/constants/rds-constants.ts` (updated — added engine options and status constants)
- [x] `src/app/api/rds/route.ts` (rewritten — full CRUD: `CreateDBInstance`, `StartDBInstance`, `StopDBInstance`, `RebootDBInstance`, `ModifyDBInstance`, `CreateDBSnapshot`, `DescribeDBSnapshots`, plus `DeleteDBInstance`)
- [x] `src/app/rds/page.tsx` (rewritten — resource table with filtering, pagination, selection, multi-select bulk actions, preferences, create/snapshot modals)
- [x] `src/app/rds/[dbInstanceIdentifier]/page.tsx` (new — detail page with tabs: Overview, Configuration, Tags, Snapshots; actions: Start, Stop, Reboot, Create Snapshot)

### PRD Alignment (§9.2.3 Database — RDS)
- [x] RDS service console has sub-pages: Instances (table + detail), plus Snapshots (described via detail page tab)
- [x] Instance creation wizard uses `Cloudscape` `Modal` + `FormField` + `Input` + `Select`
- [x] Resource listing uses `Cloudscape` `Table` with column sorting, filtering (`TextFilter`), pagination (`Pagination`), selection (`selectionType="multi"`), preferences (`CollectionPreferences`)
- [x] Bulk actions mapped: Start, Stop, Reboot, Delete, Create DB Snapshot
- [x] Design tokens (`Cloudscape` components only) — no custom colors outside tokens
- [x] All interactive elements have `ariaLabel`
- [x] Tables have `isRowHeader` and header labels
- [x] Forms have `label` associated inputs (`FormField`)
- [x] No secrets in URLs; no hardcoded AWS endpoints; adapter layer used (`/api/rds` routes to `rds` SDK client)

### API Route Coverage (`src/app/api/rds/route.ts`)
- [x] `GET` — `DescribeDBInstancesCommand`
- [x] `POST` actions — `CreateDBInstanceCommand`, `StartDBInstanceCommand`, `StopDBInstanceCommand`, `RebootDBInstanceCommand`, `ModifyDBInstanceCommand`, `CreateDBSnapshotCommand`, `DescribeDBSnapshotsCommand`, `DeleteDBInstanceCommand`
- [x] `DELETE` — `DeleteDBInstanceCommand`
- [x] Adapter error handler (`getAdapterStatus`, `handleAdapterError`) applied to all routes

### TypeScript / Build Verification
- [x] No `any` types in new RDS files; explicit interfaces (`RDSInstance`, `RDSDBSnapshot`)
- [x] `@aws-sdk/client-rds` commands imported explicitly (`CreateDBInstanceCommand`, etc.)
- [x] Existing unrelated errors pre-date this work

### Accessibility / Security / Design System
- [x] `ariaLabel` present on refresh button and actions dropdown
- [x] `Table` uses `isRowHeader` (`DBInstanceIdentifier` column)
- [x] `FormField` labels associated with `Input` and `Select`
- [x] `StatusIndicator` used for DB instance status (`available` = success)
- [x] `Cloudscape` design tokens only (`var(--awsui-color-*)` via `Cloudscape`)
- [x] All text strings in component source (ready for i18n)

### Verification Checklist Complete
Phase 8 RDS (Instances + Snapshots) features implemented per PRD §9.2.3. All 7 SDK actions wired; real table with filtering/pagination; detail page with tabs and actions; verification gate documented.
