# Implementation Plan

## Overview

Build a pixel-perfect, fully-functional AWS Console clone running against LocalStack/Ministack. The implementation is broken into sequential phases: foundation (shared infrastructure), core high-traffic services, extended services, and polish/testing. Each task builds on the previous to avoid circular dependencies, with shared components and the AWS client factory established first so every service page can rely on them.

## Tasks

- [x] 1. Project foundation and AWS client factory
  - Verify/update `src/lib/aws-clients.ts` to include all 34 SDK clients (17 existing + 17 new) using the `getClient()` factory pattern
  - Ensure `.env.local` has `AWS_ENDPOINT_URL`, `AWS_DEFAULT_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`
  - Add missing `@aws-sdk/*` packages to `package.json` and install
  - **Files:** `src/lib/aws-clients.ts`, `.env.local`, `package.json`

- [ ] 2. Shared components — ResourceTable, ConfirmModal, JsonEditor, TagEditor
  - Implement `ResourceTable<T>` with multi-select, client-side filtering, sortable columns, pagination, column preferences persisted to `localStorage["prefs_{serviceKey}"]`
  - Implement `ConfirmModal` requiring exact resource name before enabling confirm
  - Implement `JsonEditor` with JSON validation and auto-format on blur
  - Implement `TagEditor` with dynamic key-value rows
  - **Files:** `src/components/ResourceTable.tsx`, `src/components/ConfirmModal.tsx`, `src/components/JsonEditor.tsx`, `src/components/TagEditor.tsx`

- [ ] 3. Zustand settings store
  - Implement `useSettingsStore` with `region`, `theme`, `provider` fields, persisted in `localStorage`
  - **Files:** `src/stores/settings.ts`

- [ ] 4. NotificationContext and useAwsApi hook
  - Implement `NotificationContext` with `addNotification` / `dismissNotification`; success auto-dismiss after 5 s, errors persistent
  - Implement `useAwsApi<T>` hook: auto-fetch on mount, injects `x-aws-region` header from Zustand settings store (task 3), surfaces errors via NotificationContext, exposes `mutate()` for writes
  - **Files:** `src/context/NotificationContext.tsx`, `src/hooks/useAwsApi.ts`

- [ ] 5. AppShell — layout, SideNavigation, TopNavigation, BreadcrumbGroup
  - Build `AppShell` wrapping Cloudscape `AppLayout`
  - `SideNavigation`: 11 categories, 130+ service links, active href from `usePathname()`, expanded state per category in localStorage
  - `TopNavigation`: AWS logo, GlobalSearch (3+ char dropdown), RegionSelector (Cloudscape Select), ProviderBadge, notifications, theme toggle, account menu
  - `BreadcrumbGroup`: auto-generated from pathname segments
  - Health check polling on mount via `GET /api/health` → sets `useSettingsStore().provider`
  - **Files:** `src/components/AppShell.tsx`, `src/app/layout.tsx`

- [ ] 6. Health API route
  - Implement `GET /api/health` — pings Ministack then LocalStack health endpoints, returns `{ provider, status }`
  - **Files:** `src/app/api/health/route.ts`

- [ ] 7. S3 — buckets and object browser
  - API route: `GET/POST/DELETE /api/s3` (buckets), `/api/s3/objects`, `/api/s3/policy`, `/api/s3/cors`, `/api/s3/lifecycle`, `/api/s3/versioning`, `/api/s3/presigned`
  - Bucket list page: ResourceTable with Create (6-step Wizard) and Delete (ConfirmModal)
  - Bucket detail page (`/s3/[bucket]`): Tabs — Objects (hierarchical browser, upload/download/delete/presigned), Properties, Permissions (Block Public Access, Bucket Policy via JsonEditor, CORS), Management (lifecycle rules)
  - Object browser page (`/s3/[bucket]/[...prefix]`): prefix navigation, drag-and-drop upload modal
  - **Files:** `src/app/api/s3/route.ts`, `src/app/s3/page.tsx`, `src/app/s3/[bucket]/page.tsx`, `src/app/s3/[bucket]/[...prefix]/page.tsx`

- [ ] 8. EC2 — instances, security groups, key pairs, volumes, elastic IPs, AMIs, snapshots
  - API routes: `/api/ec2`, `/api/ec2/security-groups`, `/api/ec2/key-pairs`, `/api/ec2/volumes`, `/api/ec2/elastic-ips`, `/api/ec2/amis`, `/api/ec2/snapshots`
  - Dashboard summary cards + instance ResourceTable with Start/Stop/Reboot/Terminate/Connect actions
  - Launch Instances 7-step Wizard; Connect modal (SSH / EC2 Instance Connect / Session Manager tabs)
  - Sub-pages: `/security-group`, `/key-pair`, `/volume`, `/elastic-ip`, `/ami`, `/snapshot`
  - **Files:** `src/app/api/ec2/route.ts`, `src/app/ec2/page.tsx`, `src/app/ec2/[instanceId]/page.tsx`, and sub-page files

- [ ] 9. VPC and networking
  - API routes: `/api/vpc`, `/api/vpc/subnets`, `/api/vpc/route-tables`, `/api/vpc/internet-gateways`, `/api/vpc/nat-gateways`, `/api/vpc/network-acls`, `/api/vpc/endpoints`, `/api/vpc/peering`
  - Pages: `/vpc`, `/subnet`, `/route-table`, `/internet-gateway`, `/nat-gateway`, `/network-acl`, `/ec2-vpc-endpoint`, `/ec2-vpc-peering`
  - Network ACL page includes inbound/outbound rules sub-tables with rule editor
  - Route table page includes inline route editor and subnet association editor
  - **Files:** `src/app/api/vpc/route.ts` (and sub-routes), service page files

- [ ] 10. IAM — users, groups, roles, policies, access keys, password policy
  - API routes: `/api/iam` (users/groups/roles/policies CRUD), `/api/iam/access-keys`, `/api/iam/password-policy`
  - Dashboard with summary row + 5-tab layout (Users, Groups, Roles, Policies, Identity providers)
  - User detail (`/iam/users/[userName]`): Permissions, Groups, Tags, Security credentials tabs; access key creation shows secret once with CSV download
  - Wizards: Create user (5-step), Create role (4-step), Create policy (JSON editor)
  - Sub-pages: `/iam-access-key`, `/iam-group`, `/iam-instance-profile`, `/iam-saml`, `/iam-openid-connect`, `/iam-password-policy`
  - **Files:** `src/app/api/iam/route.ts`, `src/app/iam/page.tsx`, `src/app/iam/users/[userName]/page.tsx`, sub-page files

- [ ] 11. Lambda — functions, layers, aliases, versions
  - API routes: `/api/lambda` (CRUD, invoke), `/api/lambda/versions`, `/api/lambda/aliases`, `/api/lambda/layers`, `/api/lambda/config`
  - Function list with Create (3-option wizard) and Delete
  - Function detail tabs: Code (Textarea editor + Deploy), Test (JSON payload + Invoke + response display), Monitor, Configuration (General, Permissions, Environment variables, VPC, Layers, Concurrency), Aliases, Versions
  - Sub-pages: `/lambda-layer`, `/lambda-alias`
  - **Files:** `src/app/api/lambda/route.ts`, `src/app/lambda/page.tsx`, `src/app/lambda/[functionName]/page.tsx`

- [ ] 12. DynamoDB — tables and item explorer
  - API routes: `/api/dynamodb` (tables), `/api/dynamodb/items`, `/api/dynamodb/indexes`
  - Table list with Create modal (partition key, sort key, billing mode, GSIs, encryption)
  - Table detail tabs: Explore items (Scan/Query toggle, JSON editor for create/edit, ConfirmModal for delete), Indexes (GSI/LSI), Monitor, Global tables, Additional settings
  - **Files:** `src/app/api/dynamodb/route.ts`, `src/app/dynamodb/page.tsx`, `src/app/dynamodb/[tableName]/page.tsx`

- [ ] 13. RDS — databases and snapshots
  - API route: `/api/rds`
  - 7-tab page: Databases (Create 4-step Wizard: engine → template → settings → connectivity), Query Editor, Snapshots, Parameter groups, Option groups, Events, Recommendations
  - DB detail tabs: Connectivity & security, Configuration, Monitoring, Logs & events, Maintenance & backups, Tags
  - **Files:** `src/app/api/rds/route.ts`, `src/app/rds/page.tsx`, `src/app/rds/[dbId]/page.tsx`

- [ ] 14. SQS — queues and messages
  - API route: `/api/sqs`
  - Queue list with Create modal (type, configuration, encryption, access policy, DLQ, tags)
  - Queue detail tabs: Messages (Send modal, Poll for messages, Purge), Monitoring, Configuration, Access policy, Encryption, DLQ, Tags
  - **Files:** `src/app/api/sqs/route.ts`, `src/app/sqs/page.tsx`, `src/app/sqs/[queueName]/page.tsx`

- [ ] 15. SNS — topics, subscriptions, publish
  - API route: `/api/sns`
  - Topics list with 3 tabs (Topics, Subscriptions, Mobile push credentials); Create topic modal; Publish message modal
  - Topic detail tabs: Subscriptions, Access policy, Delivery status, Encryption, Tags; Create subscription modal
  - **Files:** `src/app/api/sns/route.ts`, `src/app/sns/page.tsx`, `src/app/sns/[topicArn]/page.tsx`

- [ ] 16. CloudWatch — alarms, metrics, dashboards, logs, Log Insights
  - API routes: `/api/cloudwatch`, `/api/cloudwatch-logs`
  - CloudWatch home with navigation cards; Alarms page (Create 3-step Wizard: metric → conditions → actions + name); Log groups list and log stream browser with paginated events
  - Log Insights: query editor + DateRangePicker + "Run query" with polling
  - Metrics: namespace browser + metric selection + Cloudscape LineChart
  - **Files:** `src/app/api/cloudwatch/route.ts`, service page files for `/cloudwatch`, `/cloudwatch/alarms`, `/cloudwatch-logs`, `/cloudwatch-logs/[logGroup]`, `/cloudwatch/metrics`, `/cloudwatch/log-insights`

- [ ] 17. CloudFormation — stacks, StackSets, exports
  - API route: `/api/cloudformation`
  - Stack list with 3 tabs (Stacks, StackSets, Exports); Create 4-step Wizard (template → parameters → options → review)
  - Stack detail tabs: Events (auto-poll every 5 s during active status), Resources, Outputs, Parameters, Template, Change sets, Drift results; Update and Delete actions
  - **Files:** `src/app/api/cloudformation/route.ts`, `src/app/cloudformation/page.tsx`, `src/app/cloudformation/[stackName]/page.tsx`

- [ ] 18. Step Functions — state machines and executions
  - API route: `/api/step-functions`
  - State machine list (Tabs: State machines, Activities); Create 2-step Wizard (ASL JsonEditor → settings)
  - State machine detail tabs: Definition, Executions, Logging, Monitoring, Tags; Start execution modal
  - Execution detail: Input/Output JSON, status, step trace, events table
  - **Files:** `src/app/api/step-functions/route.ts`, `src/app/step-functions/page.tsx`, `src/app/step-functions/[arn]/page.tsx`, `src/app/step-functions/[arn]/executions/[execArn]/page.tsx`

- [ ] 19. KMS — keys and key policy
  - API route: `/api/kms`
  - Key list with 3 tabs (Customer managed, AWS managed, Custom key stores); Create 4-step Wizard
  - Key detail tabs: General config, Cryptographic config, Aliases, Key policy (JsonEditor), Tags, Key rotation (toggle + status)
  - **Files:** `src/app/api/kms/route.ts`, `src/app/kms/page.tsx`, `src/app/kms/[keyId]/page.tsx`

- [ ] 20. Secrets Manager — secrets CRUD and rotation
  - API route: `/api/secrets-manager`
  - Secret list with Create 4-step Wizard (type → value → name/description → rotation)
  - Secret detail tabs: Overview, Secret value (Retrieve button with show/hide toggle), Rotation, Tags, Permissions
  - **Files:** `src/app/api/secrets-manager/route.ts`, `src/app/secrets-manager/page.tsx`, `src/app/secrets-manager/[secretId]/page.tsx`

- [ ] 21. Route 53 — hosted zones and records
  - API route: `/api/route53`
  - Hosted zones list with Create modal (domain, comment, type, VPC for private)
  - Zone detail: Records ResourceTable; Create record modal (type, routing policy, TTL, value)
  - **Files:** `src/app/api/route53/route.ts`, `src/app/route53/page.tsx`, `src/app/route53/[zoneId]/page.tsx`

- [ ] 22. ECS — clusters, services, tasks, Fargate
  - API route: `/api/ecs`
  - Cluster list with Create Wizard (name, infrastructure, networking, monitoring, tags)
  - Cluster detail tabs: Services, Tasks, Scheduled tasks, Infrastructure, Metrics, Tags; Create service Wizard
  - Sub-pages: `/ecs-service`, `/fargate`
  - **Files:** `src/app/api/ecs/route.ts`, `src/app/ecs-cluster/page.tsx`, `src/app/ecs-cluster/[clusterName]/page.tsx`, sub-page files

- [ ] 23. Systems Manager Parameter Store
  - API route: `/api/ssm`
  - Parameter list with Create form (name, description, tier, type, KMS key, value, tags)
  - Parameter detail: version history table; Edit via `PutParameterCommand` with Overwrite
  - **Files:** `src/app/api/ssm/route.ts`, `src/app/systems-manager-parameter-store/page.tsx`, `src/app/systems-manager-parameter-store/[name]/page.tsx`

- [ ] 24. Kinesis Streams — streams and data viewer
  - API route: `/api/kinesis`
  - Stream list with Create form (name, capacity mode, shard count, tags)
  - Stream detail tabs: Details, Monitoring, Data viewer (shard selector, starting position, Get records), Consumer, Tags
  - **Files:** `src/app/api/kinesis/route.ts`, `src/app/kinesis/page.tsx`, `src/app/kinesis/[streamName]/page.tsx`

- [ ] 25. EventBridge — buses, rules, pipes, scheduler
  - API route: `/api/eventbridge`
  - Main page with tabs: Buses, Rules, Pipes, Scheduler, Schema registry, Replay
  - Rules tab: Create rule Wizard (detail → pattern → target → tags)
  - Pipes page (`/eventbridge-pipe`): ResourceTable with Create/Delete
  - Scheduler page (`/eventbridge-scheduler`): ResourceTable with Create/Delete
  - **Files:** `src/app/api/eventbridge/route.ts`, `src/app/eventbridge-schema/page.tsx`, `src/app/eventbridge-pipe/page.tsx`, `src/app/eventbridge-scheduler/page.tsx`

- [ ] 26. Cognito — user pools
  - API route: `/api/cognito`
  - User pool list with Create 5-step Wizard (sign-in → security → sign-up → messaging → app client)
  - Pool detail tabs: Users (create/disable/reset password/delete), Groups, App clients, Triggers, Attributes, Policies, MFA, Messaging, Domain, UI
  - **Files:** `src/app/api/cognito/route.ts`, `src/app/cognito/page.tsx`, `src/app/cognito/[poolId]/page.tsx`

- [ ] 27. Remaining service pages (stub + full where SDK exists)
  - Full implementations: ACM (`/acm`), EKS clusters (`/eks-cluster`), ECR repos (`/ecr-repo`), EFS (`/efs`), Backup (`/backup`), Firehose (`/firehose`), Glue catalog + jobs (`/glue-catalog`, `/glue-job`), Athena workgroups (`/athena-workgroup`), CodeBuild (`/codebuild`), CodePipeline (`/codepipeline`), CodeDeploy (`/code-deploy`), CloudTrail (`/cloudtrail`), CloudWatch Logs (`/cloudwatch-logs`)
  - Stub pages (not supported by LocalStack/Ministack): ElastiCache (`/elasticache`), WAF/Shield/GuardDuty/Macie/Inspector/Security Hub/Detective, Global Accelerator, Direct Connect, Trusted Advisor, Cost Explorer, Billing, Budgets, Support — render "Not supported in local emulator" empty state
  - **Files:** one `page.tsx` per route listed above

- [ ] 28. Dashboard home page
  - `/` page: summary cards for all major services (instance counts, bucket counts, function counts, etc.) fetched via parallel `useAwsApi` calls; Recent activity feed; Quick navigation links grid
  - **Files:** `src/app/page.tsx`

- [ ] 29. Unit and integration tests
  - Vitest + React Testing Library: `ResourceTable`, `ConfirmModal`, `JsonEditor`, `useAwsApi`, `NotificationContext`
  - MSW integration tests for S3, Lambda, EC2, DynamoDB service pages (fixture → render → create → delete → verify endpoint + body)
  - **Files:** `src/components/__tests__/`, `src/hooks/__tests__/`

- [ ] 30. End-to-end tests and final polish
  - Playwright E2E against live LocalStack: smoke suite per service, S3 object browser flow, Lambda invoke flow, cross-service SQS→SNS flow
  - Final accessibility audit: verify all `FormField` labels, page `<title>` metadata, focus management in Modals/Wizards
  - Performance: add `React.memo` / `useCallback` / `useMemo` where missing; verify code splitting per route
  - **Files:** `e2e/s3.spec.ts`, `e2e/lambda.spec.ts`, `e2e/ec2.spec.ts`, `e2e/dynamodb.spec.ts`, `e2e/smoke.spec.ts`

## Task Dependency Graph

```
1 (foundation + SDK clients)
└── 2 (shared components: ResourceTable, ConfirmModal, JsonEditor, TagEditor)
    └── 3 (NotificationContext + useAwsApi hook)
        └── 4 (Zustand settings store)
            └── 5 (AppShell + navigation)
                └── 6 (health API route)
                    ├── 7  (S3)
                    ├── 8  (EC2)
                    ├── 9  (VPC)
                    ├── 10 (IAM)
                    ├── 11 (Lambda)
                    ├── 12 (DynamoDB)
                    ├── 13 (RDS)
                    ├── 14 (SQS)
                    ├── 15 (SNS)
                    ├── 16 (CloudWatch)
                    ├── 17 (CloudFormation)
                    ├── 18 (Step Functions)
                    ├── 19 (KMS)
                    ├── 20 (Secrets Manager)
                    ├── 21 (Route 53)
                    ├── 22 (ECS)
                    ├── 23 (SSM Parameter Store)
                    ├── 24 (Kinesis)
                    ├── 25 (EventBridge)
                    ├── 26 (Cognito)
                    └── 27 (remaining service pages / stubs)
                         └── 28 (Dashboard home)
                              └── 29 (unit + integration tests)
                                   └── 30 (E2E tests + final polish)
```

Tasks 7–27 are independent of each other and can be implemented in parallel once tasks 1–6 are complete.

## Notes

- All AWS SDK calls must run exclusively inside Next.js API routes (Node.js runtime). No SDK imports in browser-side components or hooks.
- Every API route must read the `x-aws-region` request header and pass it to `getClient()`. Never use a global region singleton.
- Use `forcePathStyle: true` on all S3 clients for LocalStack/Ministack path-style URL compatibility.
- `AWS_ENDPOINT_URL` in `aws-clients.ts` is the single source of truth for the emulator address. Do not hard-code `localhost:4566` elsewhere.
- `refetch()` must be called after every write mutation before the success notification is shown — no optimistic UI.
- All Wizard and Modal forms must reset to defaults on dismiss to prevent state bleed between sessions.
- `ConfirmModal` confirmation input must be case-sensitive and whitespace-sensitive exact match.
- Success notifications auto-dismiss after 5 s; error notifications are persistent and manually dismissible.
- Column visibility and page size preferences are persisted per service in `localStorage["prefs_{serviceKey}"]`.
- SideNavigation expanded state per category is persisted in `localStorage["nav_{category}"]`.
- Dark mode applied via `applyMode('dark' | 'light')` from `@cloudscape-design/global-styles`; do not use custom CSS variables for component-level colors.
- Services not supported by LocalStack/Ministack (ElastiCache, WAF, Shield, etc.) should render a clear "Not supported in local emulator" empty state rather than failing silently.
- Coverage target: ≥ 80% on shared components and hooks; service pages covered by integration and E2E tests.
