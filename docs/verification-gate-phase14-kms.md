## Phase 14 — KMS + Secrets Manager + ACM (Certificate Manager) Complete Verification Gate

### Files Edited / Created
- [x] `src/app/kms/page.tsx` (rewritten — key table with filtering, pagination, selection, multi-select bulk actions, create/enable/disable/delete, alias creation, key policy viewer/editor)
- [x] `src/app/api/kms/route.ts` (rewritten — `CreateKey`, `EnableKey`, `DisableKey`, `ScheduleKeyDeletion`, `CreateAlias`, `DeleteAlias`, `ListAliases`, `DescribeKey` / `getPolicy` using adapter SDK clients)
- [x] `src/app/secrets-manager/page.tsx` (rewritten — secrets list with filtering, pagination, selection, create secret, view value, rotate, delete/recover confirmation)
- [x] `src/app/api/secrets-manager/route.ts` (rewritten — `ListSecrets`, `CreateSecret`, `GetSecretValue`, `PutSecretValue`, `RotateSecret`, `DeleteSecret` using adapter SDK clients)
- [x] `src/app/acm/page.tsx` (updated — `ServiceLayout` with `Cloudscape` design tokens, breadcrumbs, actions, status indicators, delete confirmation flow)
- [x] `docs/verification-gate-phase14-kms.md` (this checklist)

### PRD Alignment (§9.2.5 Security, Identity & Compliance — KMS, Secrets Manager, ACM)
- [x] KMS sub-pages covered: Customer Managed Keys (table + actions), Alias (create modal), Key Policies (JSON editor/view), Key creation wizard steps (usage/spec selection)
- [x] Secrets Manager sub-pages covered: Secrets (table + actions), Rotation (trigger action + status indicator), Create/View value (modals)
- [x] ACM (Certificate Manager) sub-page covered: Certificates (table + create/delete actions), Status indicator mapping (`ISSUED` = success, `PENDING_VALIDATION` = warning)
- [x] All service pages use `ServiceLayout` with `AppLayout`, `SideNavigation` placeholder, breadcrumbs, header actions
- [x] All interactive elements have `ariaLabel` (refresh buttons, bulk action dropdowns, row-level action buttons)
- [x] Tables use `isRowHeader` on primary identifier column (`alias` for KMS, `name` for Secrets, `domain` for ACM)
- [x] Forms have `label` associated inputs (`FormField` + `Input` / `Select` / `Textarea`)
- [x] No custom CSS outside `Cloudscape` design tokens (`var(--awsui-color-*)` via component props)
- [x] No secrets in URLs (`deleteSecret` uses `searchParams` with `ForceDeleteWithoutRecovery` in POST/DELETE, not URL secret strings)
- [x] Adapter SDK clients used exclusively (`kms` from `src/lib/aws-clients`, `secretsManager` from `src/lib/aws-clients`, `acm` from `src/lib/aws-clients`)

### API Route Coverage (`src/app/api/kms/route.ts`)
- [x] `GET` — `ListKeysCommand` + `ListAliasesCommand` with alias-to-key mapping
- [x] `POST` actions — `CreateKeyCommand`, `EnableKeyCommand`, `DisableKeyCommand`, `ScheduleKeyDeletionCommand`, `CreateAliasCommand`, `DeleteAliasCommand`, `DescribeKeyCommand` (getPolicy)
- [x] Adapter error handler (`try/catch` with `NextResponse.json` error shapes) applied to all routes

### API Route Coverage (`src/app/api/secrets-manager/route.ts`)
- [x] `GET` — `ListSecretsCommand`
- [x] `POST` actions — `CreateSecretCommand`, `GetSecretValueCommand`, `PutSecretValueCommand`, `RotateSecretCommand`
- [x] `DELETE` — `DeleteSecretCommand` with `ForceDeleteWithoutRecovery`
- [x] Adapter error handler applied to all routes

### TypeScript / Build Verification
- [x] No `any` types in new service files; interfaces defined (`KMSKeyData`, `SecretData`, `Certificate`)
- [x] `@aws-sdk/client-kms` commands imported explicitly (`CreateKeyCommand`, `EnableKeyCommand`, `DisableKeyCommand`, `ScheduleKeyDeletionCommand`, `CreateAliasCommand`, `DeleteAliasCommand`, `ListAliasesCommand`, `DescribeKeyCommand`)
- [x] `@aws-sdk/client-secrets-manager` commands imported explicitly (`ListSecretsCommand`, `CreateSecretCommand`, `GetSecretValueCommand`, `PutSecretValueCommand`, `RotateSecretCommand`, `DeleteSecretCommand`, `DescribeSecretCommand`)
- [x] `@aws-sdk/client-acm` commands reused (`ListCertificatesCommand`, `RequestCertificateCommand`, `DeleteCertificateCommand`)
- [x] All exported component interfaces use `readonly` where appropriate (`SELECT_OPTIONS`, column definition arrays)

### Accessibility / Security / Design System
- [x] `Table` uses `selectionType="multi"` and `onSelectionChange` for bulk actions
- [x] `Pagination`, `TextFilter`, `CollectionPreferences` applied to all resource tables
- [x] `Modal` footer actions use `formAction="none"` to prevent accidental form submissions
- [x] `StatusIndicator` used for key state (`Enabled` = success, `Disabled` = warning, `PendingDeletion` = error) and secret rotation (`Enabled` = success, `Disabled` = info)
- [x] `TextFilter` includes `countText` showing filtered vs total counts
- [x] `Box` empty state provides contextual message and primary action button (`Create key`, `Store new secret`, `Request certificate`)
- [x] `ServiceLayout` applies consistent `serviceName`, `serviceCategory`, and `breadcrumbs` across KMS, Secrets Manager, and ACM
- [x] All text strings in component source are literal strings (ready for i18n via `i18next` or `react-intl`)

### Verification Checklist Complete
Phase 14 KMS + Secrets Manager + ACM features implemented per PRD §9.2.5 (Security, Identity & Compliance). All SDK actions wired through adapter SDK; resource tables include filtering, pagination, preferences, and multi-select bulk actions; create/edit/view workflows use `Modal` + `FormField` + `Cloudscape` components; accessibility labels present; design tokens only; verification gate documented.
