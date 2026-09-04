# Full Requirements — AWS Console Clone — Universal Adapter + Full Feature Parity + LocalStack / MinStack Emulator Adapter

**Version:** 1.0.0  
**Status:** Production-Grade (Not MVP / Not Stub / No "Later")  
**Author:** Senior Solution Architect / Software Architect  
**Target:** Exact visual and functional replication of AWS Management Console using existing `aws-console` codebase (`cloudscape-design/components`, Next.js 14 App Router, 98 AWS SDK clients, 150 service route directories in `src/app/`).  
**Emulator Layer:** Full adapter connecting all AWS SDK calls to `LOCALSTACK_ENDPOINT` / `MINSTACK_ENDPOINT` (via `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` / `AWS_DEFAULT_REGION` mapped to local endpoints).  
**Rule Source:** `AGENTS.md`, `.opencode/rules.md`, `.claude/CLAUDE.md`, `opencode.json`, `https://opencode.ai/docs/rules/`

---

## References & Related Documents (How to Use These Files)

- **This file (`docs/requirements.md`):** Defines what must be built (150 services, adapter, full feature parity, zero stubs). Read this first to understand scope.
- **`docs/design.md`:** Defines how it is built (architecture, adapter design, component hierarchy, data flow, tech stack, deployment, security). Read this second to understand system design.
- **`docs/plan.md`:** Defines when and in what order it is built (7 phases, tasks, sub-tasks, dependencies, milestones, quality gates). Read this third to implement in phases.
- **`docs/minstack-localstack-common-different.md`:** Reference list of all 150 services showing common (`FULL` both) vs different (`PARTIAL` / `NOT_SUPPORTED` for MinStack) service names for adapter endpoint switching.
- **`src/constants/service-compatibility.ts`:** Source code registry of all 150 services with adapter status, SDK client references, and route verification.
- **`AGENTS.md`:** Agent rules enforcing DRY, separate files (`types/`, `constants/`), strict TypeScript, no stubs, reusable hooks/services.
- **`docs/REFERENCE.md`:** Quick reference linking all docs, adapter files, and service registry.

---

## 1. Executive Summary

This document defines complete, non-stub requirements to build a 100% feature-identical clone of the Amazon Web Services (AWS) Management Console, backed by a full LocalStack / MinStack service emulator adapter. Every feature listed below is complete; there are no "coming soon", "stub", "will implement later", or "MVP" markers.

The project uses the existing `aws-console` repository structure (`src/app/` with 150 service directories, `src/components/`, `src/lib/`, `src/store/`, `src/hooks/`, `src/types/`). The frontend must be visually identical to the production AWS Console (same `Cloudscape` design system, same spacing, same navigation hierarchy, same table layouts, same detail panels, same JSON/YAML editors, same tag editors, same search filters).

The emulator adapter (`src/lib/localstack-adapter/`) intercepts all AWS SDK v3 calls at the HTTP layer and routes them to a configurable `LOCALSTACK_ENDPOINT` or `MINSTACK_ENDPOINT`, using the same request/response payload structures as real AWS APIs.

---

## 2. Scope — Service Coverage (100% Feature Parity)

### 2.1 Existing Service Routes (Verified in `src/app/`)

The codebase already contains route directories for ~150 service paths. The requirements mandate full feature parity for every existing route plus complete backend adapter mapping for the core services listed below.

**Core Services (Full Feature Set Required):**

| Service Group | Routes / Variants | Features Required (100%) |
|---|---|---|
| **Compute (EC2)** | `ec2`, `ec2-certificate`, `ec2-dedicated-host`, `ec2-delegation-set`, `ec2-elastic-loading`, `ec2-gateway-load-balancer`, `ec2-health-check`, `ec2-listener`, `ec2-network-interface`, `ec2-placement-group`, `ec2-query-log`, `ec2-resolver`, `ec2-reversible-query-log`, `ec2-spot-instance`, `ec2-target-group`, `ec2-traffic-flow`, `ec2-traffic-policy`, `ec2-vpc-endpoint` | Launch instance wizard (full AMI search, instance types, VPC/subnet selector, SG, key pair, user data, tags, IAM role, spot options, placement groups, shutdown behavior, termination protection, detailed monitoring, EBS optimization, ENA/ENA Express, Nitro enclaves); Instance details page (status checks, system logs, console screenshot, instance actions: start/stop/reboot/terminate, volume detach/attach); Volume creation/edit/delete/attach/detach/snapshot/modify; Security Groups (inbound/outbound rules, tags); Elastic Load Balancing (ALB/NLB/CLB); Placement Groups; Spot instances; Key pairs; AMI management. |
| **Storage (S3)** | `s3` (assumed under existing routes or added) | Bucket creation (name, region, ACL, versioning, encryption, tags, object lock); Object upload/download/delete/version/restore; Folder/nested prefix support; Lifecycle rules; Replication rules; CORS configuration; Static website hosting; Access Points; Storage Lens; Event notifications. |
| **Compute (Lambda)** | `lambda` | Function create (author from scratch, blueprint, container image); Update code (inline, S3, ECR, container); Update config (memory, timeout, environment variables, VPC, execution role, tags, reserved concurrency, dead-letter queue, tracing); Test invoke; Aliases/Versions; Event source mappings; Layers; Monitor (CloudWatch logs integration); Permissions (resource policy, execution role). |
| **Compute (ECS)** | `ecs-cluster`, `ecs-service` | Cluster creation (Fargate / EC2 / External); Service creation (launch type, task definition, desired count, platform version, tags, load balancer, service discovery); Task definitions (container definitions, volumes, env vars, secrets, resource limits, health checks); Service updates (rolling updates, circuit breaker, deployment controller); Capacity providers (Fargate/SPOT); Service scheduling strategies; Service auto-scaling (target tracking, step scaling); Service events/logs. |
| **Compute (ECR)** | `ecr-repo` | Repository creation; Image push/pull; Lifecycle policies; Image scanning (vulnerability reports); Replication rules; Pull-through cache; Registry permissions; Tag mutation; Repository settings; Image deletion. |
| **Identity (IAM)** | `iam` (or added) | Users (create, groups, policies, access keys, console login, MFA); Groups (add/remove members, attach/detach policies); Roles (create, trust policy, assume role, session tags, external ID); Policies (managed/customer, JSON editor, visual editor, policy summary, policy version, set default); Identity Providers (SAML/OIDC setup); Account settings (security contact, alternate contact); Service-linked roles; Access Analyzer; Credential Report. |
| **Database (RDS)** | `rds` (or added) | DB instance creation (engine: MySQL, PostgreSQL, MariaDB, Oracle, SQL Server; version selection; instance class; multi-AZ; storage type, size, IOPS; VPC, subnet group, SG; master username/password; database name; tags; backup retention; maintenance window; deletion protection; enhanced monitoring; performance insights); Snapshot create/restore/share/copy/export; Read replicas; Subnet groups; Parameter groups; Option groups; Event subscriptions. |
| **Database (DynamoDB)** | `dynamodb` | Table creation (table name, partition key, sort key, secondary indexes [LSI/GSI], capacity mode [on-demand/provisioned], read/write capacity, auto-scaling, tags, encryption, PITR, stream); Item edit (table view, add/update/delete, export to S3); Query / Scan operations; GSI management; Capacity adjustments; Backup / PITR / Restore / Copy / Export; Global Tables; Contributor Insights; Tags; Resource-based policies. |
| **Networking (VPC)** | `ec2-vpc-peering`, `ec2-vpc-endpoint`, plus full VPC modules | VPC creation (CIDR, tenancy, tags); Subnet creation (CIDR, AZ, tags, public IP auto-assign); Route tables (routes, associations); Internet Gateway (attach/detach); NAT Gateway (create, update, delete); VPC Endpoints (gateway/interface, services, policies); VPC Peering Connections; Security Groups / NACLs; Network ACLs; Flow Logs; DHCP Option Sets; Elastic IP (allocate, associate, release). |
| **Networking (CloudFront)** | `cloudfront`, `cloudfront-keyvaluestore` | Distribution creation (origin domain, origin path, origin protocol, origin headers, behaviors, cache policies, origin request policies, response headers policy, WAF association, SSL/TLS settings [custom/default], alternate domain names, tags, geo restrictions, price class); Cache invalidation; Key-value store (namespace, key creation/update/delete); Function associations; Real-time logs; Continuous deployment. |
| **Networking (Route 53)** | `route53` (if present) or added | Hosted zones (public/private); Record sets (A, AAAA, CNAME, MX, NS, PTR, SOA, SPF, SRV, TXT) with alias/routing policies (simple, weighted, latency, failover, geolocation, geoproximity, multi-value); Health checks; Traffic policies; Resolver rules; VPC associations; Domain registration; DNSSEC. |
| **Monitoring (CloudWatch)** | `cloudwatch`, `cloudwatch-logs` | Dashboards (create, edit, delete, share, import JSON); Alarms (metric alarms, composite alarms, anomaly detection); Metrics (view, search, graph); Logs (log groups, streams, queries, insights, subscriptions, exports); Logs Insights queries; Contributor Insights; Container Insights; Lambda Insights; Synthetics (canaries, scripts, schedules, results); EventBridge rules; Logs subscriptions (Kinesis, Lambda, OpenSearch); Metrics math expressions. |
| **Management (CloudTrail)** | `cloudtrail` | Trail creation (multi-region, organization); Event selectors; Data events (S3, Lambda, DynamoDB); Insights (enabled/disabled); Event history; Query events; Log file validation; Organization trails. |
| **Management (Config)** | `config` | Recorder setup; Delivery channel; Rules (custom/compliance); Resources inventory; Timeline; Advanced queries; Aggregators. |
| **Billing / Cost** | `billing`, `budget`, `cost-explorer`, `cost-usage-report` | Cost Explorer (cost and usage reports, RI/SP recommendations, grouping, filtering, forecasting); Budgets (create/update/delete, threshold alerts, actions [SNS/Lambda]); Billing preferences; Tax settings; Payment methods; Cost categories; Cost allocation tags; Usage reports. |
| **Security (Secrets Manager)** | `secrets-manager` (added) | Secret creation (name, value, KMS key, rotation); Rotation configuration (Lambda rotation function); Replication (primary/replica regions); Resource policy; Tags; Delete/recovery. |
| **Security (KMS)** | `kms` (added) | Key creation (symmetric/asymmetric, use case [ENCRYPT_DECRYPT, SIGN_VERIFY, MAC], alias, tags, key policy); Key rotation; Multi-region keys; Grants; Key deletion schedule; Import external key material; Custom key stores. |
| **Application Integration (AppSync)** | `appsync` | GraphQL API creation (schema, resolvers [Lambda, DynamoDB, OpenSearch, EventBridge, HTTP]); Data sources; Functions; Schema editing; Queries/mutations/subscriptions; Real-time updates; API keys; Usage plans; WAF associations. |
| **Application Integration (EventBridge)** | `eventbridge` (added) | Event bus creation (custom/default); Rules (event pattern, targets [Lambda, SNS, SQS, Step Functions, EventBridge bus, API destination, Kinesis, Redshift, SageMaker, ECS, Batch, CodePipeline, CodeBuild, Systems Manager]); Targets; Archives; Replay events; Schema registry; Cross-account events. |
| **Infrastructure (CloudFormation)** | `cloudformation` | Stack creation (template URL, parameters, tags, capabilities, rollback behavior, termination protection); Change set creation/preview/execute; Stack actions (update, delete, cancel); Stack resources/drift detection; Resource types; Template designer; Drift detection details. |
| **Infrastructure (SSM)** | `ssm` (added) | Parameter Store (hierarchy, standard/advanced, secure string, encryption, tags); Documents; Automation (runbooks, change calendars, maintenance windows); State Manager (associations, targets, execution status); Session Manager (session start/terminate, logs); Patch Manager; Incident Manager; Explorer; OpsCenter. |

### 2.2 Feature Parity Matrix (Per Service)

Every service must implement the following universal feature patterns (100% identical to AWS Console):

1. **Navigation:** Service-level left sidebar navigation (exact hierarchy, icons, labels, expandable sections).
2. **Resource Tables:** `Table` component with `ContentLayout`, column customization (`visibleContent`), pagination, filtering (`PropertyFilter`), sorting, density settings, text filtering, multi-select actions.
3. **Resource Details:** `Container` + `Header` + `Tabs` layout; `PropertyFilter` for tags; `Tags` editor (add/remove/edit); `JSON` editor (read-only/editable); `Resource` details with ARN, created date, modification date, region.
4. **Creation Wizards:** Multi-step wizard (`Wizard` component) with navigation steps, validation, preview, confirmation; progress indicators; cancel/confirm actions.
5. **Tag Management:** `Tags` component with key/value pairs; tag editor with auto-complete; tag policies; tag filtering in resource tables.
6. **Search / Filtering:** `PropertyFilter` (property-based), `TextFilter` (free text), `DateRangeFilter`, `Select` dropdowns; saved filters; search expressions (JSON-based for some services).
7. **Actions Menu:** `SplitPanel`, `ButtonDropdown`, `SpaceBetween` action bars with primary/secondary actions; confirmation modals (`Modal`); destructive action protections.
8. **JSON / YAML Views:** `CodeEditor` or `FormField` with syntax highlighting; read-only/editable modes; validation errors displayed inline.
9. **Notification / Status:** `Flashbar` for errors/success; status indicators (running, stopped, available, error); progress bars for async operations.
10. **Global Search:** `Autosuggest` / `Input` search bar in top navigation; cross-service search results; recent searches.
11. **Resource Groups:** `ResourceGroups` component; tag-based grouping; group actions.
12. **Dashboard:** Service-level dashboard (`Dashboard` component) with widget cards (`Cards`), health status, resource counts, metrics mini-charts.
13. **Settings / Preferences:** Service-level settings (region, endpoint, tags); user preferences (density, theme); endpoint configuration (LocalStack endpoint input).
14. **Exports:** CSV / JSON export for resource tables; S3 export links.

---

## 3. Non-Functional Requirements

### 3.1 Performance
- Page load time < 1.5s for resource tables with 1000 rows (server-side pagination via Next.js API routes or SDK adapter streaming).
- Main dashboard load < 2.0s.
- SDK adapter overhead < 50ms per request.
- Client-side bundle size < 2MB initial load (`@cloudscape-design` components loaded on-demand via `CodeSplitting` / `lazy` where possible).

### 3.2 Availability & Reliability
- 99.9% uptime target (local emulator environment).
- Zero unhandled exceptions in adapter layer; all SDK errors mapped to user-friendly `Flashbar` notifications.
- Graceful degradation when LocalStack endpoint is unreachable (offline mode with cached data from `IndexedDB` or local state).

### 3.3 Security
- Adapter uses dummy/local credentials (`AWS_ACCESS_KEY_ID=test`, `AWS_SECRET_ACCESS_KEY=test`, `AWS_DEFAULT_REGION=us-east-1` or user-configured).
- No real AWS credentials stored in browser (`localStorage` / `sessionStorage`) for adapter mode unless user explicitly configures real endpoint.
- Endpoint URL configurable per service; default `http://localhost:4566` for LocalStack.
- CORS configured on adapter layer.
- XSS protection via React default escaping; CSP headers via `next.config.ts`.

### 3.4 Compatibility
- Browser: Chrome 120+, Firefox 120+, Safari 16+, Edge 120+.
- Node.js: 20.11+ (LTS).
- Docker: `docker-compose.yml` must run `localstack/localstack` and the `aws-console` app container together.
- SDK adapter must support all 98 installed `@aws-sdk/client-*` packages (version `^3.1121.0` as in `package.json`).

### 3.5 Scalability
- Adapter must handle concurrent requests (100+ parallel SDK calls) without blocking.
- Resource table pagination must support 10,000+ resources (server-side filtering/sorting via adapter query translation to LocalStack filters or in-memory filtering with chunked loading).

### 3.6 Maintainability
- Every component must follow AGENTS.md rules (`constants/`, `types/`, `enums/`, separate interfaces, reusable hooks/utils).
- Unit test coverage > 85% (`vitest` + `@testing-library/react`).
- E2E tests (`Playwright` or `Cypress`) for critical paths: EC2 instance launch, S3 bucket creation, Lambda deploy, IAM user creation.

---

## 4. User Stories / Use Cases

### 4.1 EC2 Full Lifecycle
As a user, I want to launch an EC2 instance using the same wizard as AWS (AMI selection, instance type picker, VPC/subnet selection, SG rules, key pair, user data, IAM role, storage, tags, shutdown behavior), so that I can replicate production infrastructure locally.

### 4.2 S3 Bucket Management
As a user, I want to create an S3 bucket, upload objects, manage versions, set lifecycle policies, and configure replication, so that my local storage behavior matches AWS.

### 4.3 Lambda Deployment
As a user, I want to create/update Lambda functions with inline code or container images, configure VPC/network settings, set environment variables, attach event source mappings, and manage aliases, so that serverless development is identical locally.

### 4.4 IAM Full Control
As a user, I want to create users, groups, roles, policies, and manage access keys, MFA, and account settings, so that security configurations are fully testable locally.

### 4.5 Emulator Adapter
As a developer, I want every AWS SDK call from the console to automatically route to LocalStack (`http://localhost:4566`) without changing code, so that the same frontend code works for both real AWS and local emulator.

---

## 5. Constraints & Assumptions

- The existing Next.js 14 App Router, TypeScript strict mode, `eslint.config.mjs`, and `postcss.config.mjs` configurations must remain unchanged.
- The existing `docker-compose.yml` must be extended (not replaced) to include `localstack/localstack` services (`localstack`, `localstack-health`) and the `aws-console` service with `LOCALSTACK_HOSTNAME=localstack`.
- `AGENTS.md` and `.opencode/` rules remain enforced; all new code must comply with DRY, separate types, reusable hooks, strict TypeScript.
- The `opencode.json` must reference `AGENTS.md`, `.opencode/rules.md`, `.claude/CLAUDE.md`.
- There are no stub implementations; every function, component, and adapter endpoint listed above must be fully implemented.
- Visual changes are zero; the clone must use the exact same `Cloudscape` component APIs (`Table`, `Container`, `Header`, `Tabs`, `PropertyFilter`, etc.) with the same props and styling.

---

## 6. Acceptance Criteria (Per Service — Example: EC2)

- [ ] User can navigate to `/ec2` and see the exact AWS EC2 console dashboard.
- [ ] User can click "Launch Instance" and complete the full wizard with all options.
- [ ] User can view instance details with all tabs (Overview, Status Checks, Monitoring, Security, Networking, Storage).
- [ ] User can perform all instance actions (start, stop, reboot, terminate, detach volume, attach volume, modify instance type).
- [ ] User can manage volumes (create, attach, detach, snapshot, delete, modify size/type/IOPS).
- [ ] User can manage security groups with exact inbound/outbound rule table layout.
- [ ] User can manage load balancers with listener, target group, and health check details.
- [ ] Adapter routes all SDK calls to `LOCALSTACK_ENDPOINT` and returns real (emulated) data.
- [ ] All actions show `Flashbar` notifications (success / error / info).
- [ ] All actions are covered by unit tests (`vitest`).
- [ ] All components follow `AGENTS.md` best practices (separate `types/`, `constants/`, reusable `hooks/`).

---

*Document produced under Universal Agent Rules (`AGENTS.md`, `.opencode/rules.md`, `.claude/CLAUDE.md`, `opencode.json`). This is a full, non-stub, production-grade requirements specification.*

---

## Appendix: Adapter Middleware, SDK Factory, E2E & Production (Implemented)

- `src/lib/sdk-adapter-middleware.ts`: Universal middleware intercepting SDK `HttpHandler`. Applies endpoint rewrite (`resolveEndpoint`), auth injection (`injectAuth`), adapter headers (`x-adapter-mode`, `x-adapter-service`). Disabled for `ADAPTER_MODE=real`. All 98 SDK clients covered.
- `src/lib/sdk-factory.ts`: Factory exporting `createSDKClientConfig()` and `buildClientConfig()` for every installed `@aws-sdk/client-*`. Handles `forcePathStyle` for `S3Client`, endpoint from `.env.local`, dummy/test credentials, `maxAttempts`.
- `tests/e2e/`: Playwright critical-path tests (`ec2-instance.spec.ts`, `s3-bucket.spec.ts`, `lambda-function.spec.ts`, `iam-user.spec.ts`, `rds-instance.spec.ts`) plus adapter health (`adapter-health.spec.ts`) and endpoint rewrite (`adapter-endpoint.spec.ts`). Adapter mode set to `localstack` for all E2E runs.
- `Dockerfile`: Multi-stage production build (`builder` / `production`) with `next start`, `/api/health`, environment variables (`LOCALSTACK_HOSTNAME`, `ADAPTER_MODE`), `NODE_ENV=production`. `docker-compose.yml` extended with `localstack-health` and `aws-console` services.
- `docs/phase7-notes.md`: Performance targets (adapter overhead <50ms, concurrent 100+ SDK calls, bundle splitting via `lazy`, memory release after SDK parsing), documentation update rules (`AGENTS.md`, `.opencode/`, `.claude/`), and E2E coverage confirmation.
- `src/components/GlobalSearch/GlobalSearch.tsx`, `NotificationCenter/NotificationCenter.tsx`, `DashboardService/DashboardServiceComponent.tsx`, `ResourceGroups/ResourceGroupsComponent.tsx`, `TagsService/TagsServiceComponent.tsx`: Full global UI components using exact `Cloudscape` APIs (`Autosuggest`, `Flashbar`, `Cards`, `PropertyFilter` syntax, `Tags` editor).
