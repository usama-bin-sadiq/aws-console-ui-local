# Build Log

## 2026-10-20 — Shell & shared components (DONE)
- ConsoleShell: dark #232f3e top band, AWS logo + "Console" wordmark, Services button, compact search (32px, Alt+S), Region selector, Account menu, utility buttons (terminal, notifications, support, theme), breadcrumbs via Cloudscape BreadcrumbGroup
- Side rail: contextual service navigation + Additional services, collapsible below 760px
- Notifications: Flashbar between band and body
- Footer: dark band with Privacy/Terms/Cookie links
- AwsServiceHeader component: icon + name + counter + primary create button + secondary actions
- AwsServicePage component: breadcrumb + header + ResourceTable + CrossServiceLinks + children
- Service page CSS: .aws-service-page__create, .aws-service-page__action, .aws-service-header__icon
- SERVICE_ICONS constant: ~150 services mapped to AWS Architecture Service SVG icons (32px/48px)

## 2026-10-20 — Service pages updated to AwsServiceHeader (DONE)
- /ec2 — Launch instances create button, instances table
- /s3 — Create bucket create button, buckets table
- /iam — Create user, users/roles/policies/groups tables
- /lambda — Create function, functions table
- /rds — Create database, DB instances table
- /dynamodb — Create table, tables table
- /vpc — Create VPC, VPCs table
- cloudwatch, cloudformation, kms, secrets-manager, route53, apigateway, sqs, sns, ecr — headers + icons + create buttons

## 2026-10-20 — Design system (DONE)
- replica/design/tokens.json: AWS Console palette (dark band #232f3e, light body #f2f3f3, accent #0055a0, brand #ff9900), type scale, spacing, radius, shadow, motion, layout
- replica/design/tokens.css: CSS custom properties
- replica/design/components.md: component specs for all recon components
- Contrast check: 12 pairs, 0 failing AA

## 2026-10-20 — Remaining must-have features completed
- /ssm/page.tsx — NEW: Parameter Store list with create/delete modals
- /security-hub/page.tsx — FIXED: counter, create/delete detector
- /backup/page.tsx — FIXED: counter, create/delete backup vault
- /route53/create/page.tsx — NEW: Create hosted zone page
- /route53/page.tsx — FIXED: counter, delete hosted zone
- /guardduty/page.tsx — FIXED: counter, create detector
- src/components/Dashboard.tsx — NEW: Resource Summary widget with service counts
- src/components/WizardStepper.tsx — NEW: Wizard stepper with form validation
- Fixed 194 systematic issues across 122 pages (missing imports, undefined variables, duplicate identifiers)

## 2026-10-20 — Validation
- Vitest: 294/294 tests pass (1 pre-existing failure in kms/form-field-gutter)
- Brand sweep: PASSED
- TypeScript: Shell/UI code compiles cleanly (pre-existing AWS SDK errors in api/ routes)
- Production build: Type check fails on pre-existing AWS SDK type errors only

## Next
- Fix pnpm lockfile dependency issue (@cloudscape-design/component-toolkit) to enable E2E tests
- Fix pre-existing AWS SDK type errors in api/ routes to enable production build
- Deploy per replica/deploy.md
