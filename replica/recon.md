# AWS Console Recon Map

Target: AWS Management Console (console.aws.amazon.com) — Web
Slice: Full service catalogue (compute, storage, database, networking, security, management, application integration, analytics, ML, IoT, mobile, customer engagement, media, migration, blockchain, quantum, satellite)
Audience: Rebuild this project (`aws-console`, LocalStack/Ministack emulator backend) as a clean-room clone
Source of truth: The running emulator console itself (public pages, own account), AWS public documentation, AWS Architecture Service icons already vendored in `/public/icons/`

---

## Scope

1. **Which app / platform:** AWS Management Console, web SPA.
2. **Which slice:** Every service page in the navigation tree (~150 services), plus Console Home, login, region/account switching, global search, service detail pages, create wizards, and resource detail tabs. Core loop = list → create → view/edit → delete per service.
3. **Who it is for:** This project — a LocalStack/Ministack-backed AWS Console emulator. Replica is for the user's own business (emulator console), not for competing with AWS directly.

---

## Sources

| Source | What it gives you | URL / location |
|---|---|---|
| LocalStack/Ministack health endpoint | Which services the emulator serves, service names, status | `/api/health` |
| AWS public documentation | Feature lists, API shapes, console workflows | docs.aws.amazon.com |
| AWS Architecture Service icons (vendored) | Official service glyphs (32px/48px SVG/PNG) | `/public/icons/Architecture-Service/` |
| The emulator console source (this repo) | Current screens, flows, components, data model | `/src/app/*/page.tsx`, `/src/components/`, `/src/features/resource-table/` |
| AWS pricing pages | Which features are gated behind tiers | aws.amazon.com/pricing |

---

## Screen Inventory

| ID | Screen | Route / how to get there | Purpose | Key components | States seen |
|---|---|---|---|---|---|
| S01 | Console Home | `/` | Dashboard with service cards, health, resource summary | Service cards, health indicators, recent visited, favorites | empty, filled, loading |
| S02 | Login | `/login` | Auth entry (root/IAM user, MFA prompt) | Login form, MFA prompt, AuthShell | initial, mfa-required, error |
| S03 | Service list overlay | Top nav > Services button | Browse all services by category | Category groups, service links, disabled badges | open, closed |
| S04 | Search results | Top nav > Search field | Search services, features, docs | Search input, result cards, browse-all list | empty, results, disabled-services |
| S05 | Region selector | Top nav > Region button | Change AWS region | Region list, current region pill | open, closed |
| S06 | Account menu | Top nav > Account button | Account profile, sign out, provider label | Username, provider label (LocalStack/Ministack), sign out | open, closed |
| S07 | Service list page | `/<service>` | List resources of a service | ResourceTable (filter, pagination, selection, actions), create button, cross-service links | empty, loading, filled, error |
| S08 | Create wizard | `/<service>/create` | Multi-step resource creation | Stepper, form fields, review step, confirm | step 1..N, review, success, error |
| S09 | Resource detail | `/<service>/<id>` | View single resource | DetailLayout, tabs (Details, Tags, Monitoring, etc.), action buttons | loaded, loading, error |
| S10 | Edit resource | `/<service>/<id>/edit` | Modify resource attributes | Form fields, save/cancel | initial, saving, success, error |
| S11 | Confirm delete | Modal on list page | Confirm destructive action | ConfirmDialog, warning/error variant | open, closed |
| S12 | Notifications | Flashbar under top band | Status/toast messages | Flashbar items, dismiss buttons | visible, hidden |
| S13 | Terminal panel | Top nav > Terminal button | CLI shell to emulator | xterm terminal, command history | open, closed |

Service-specific screens (instantiated per service from S07–S10):

| ID | Service | Route | Notes |
|---|---|---|---|
| S14 | EC2 | `/ec2` | Instances list; launch wizard at `/ec2/launch`; instance detail at `/ec2/<id>` |
| S15 | S3 | `/s3` | Buckets list; create bucket at `/s3/create`; bucket detail at `/s3/<name>` |
| S16 | IAM | `/iam` | Users/roles/policies/groups tabs; create per tab; detail per resource |
| S17 | Lambda | `/lambda` | Functions list; create function; layers; monitoring |
| S18 | RDS | `/rds` | DB instances list; create database; detail per instance |
| S19 | DynamoDB | `/dynamodb` | Tables list; create table; detail per table |
| S20 | VPC | `/vpc` | VPCs list; create VPC; subnets, security groups, gateways |
| S21 | CloudWatch | `/cloudwatch` | Alarms, metrics, log groups; create alarm |
| S22 | CloudFormation | `/cloudformation` | Stacks list; create stack; stack detail with events/resources/outputs |
| S23 | KMS | `/kms` | Keys list; create key; key detail/rotation |
| S24 | Secrets Manager | `/secrets-manager` | Secrets list; store secret; secret detail/value |
| S25 | Route 53 | `/route53` | Hosted zones list; create zone; records |
| S26 | API Gateway | `/apigateway` | REST APIs list; create API; stages |
| S27 | SQS | `/sqs` | Queues list; create queue; send/receive/purge/delete messages |
| S28 | SNS | `/sns` | Topics list; create topic; publish; subscriptions |
| S29 | ECR | `/ecr` | Repositories list; create repository; images; lifecycle policies |

Additional service screens follow the same S07–S11 pattern for every service in `src/constants/navigation.ts` (~150 total).

---

## User Flows

```
F01  Browse and open a service
     S01 (Home) -> S03 (Services overlay) -> S07 (Service list)
     clicks: 3

F02  Search for a service
     S04 (Search) -> type -> select result -> S07
     clicks: 2

F03  List resources, then create one
     S07 (list) -> click Create -> S08 (wizard) -> submit -> S07 (list, new item present)
     clicks: 4 + wizard steps

F04  View a resource detail
     S07 (list, select row) -> S09 (detail) -> tabs switch (Details/Tags/Monitoring)
     clicks: 3

F05  Delete one or more resources
     S07 (list, select rows) -> Actions > Delete -> S11 (confirm) -> S07 (list, removed)
     clicks: 4

F06  Change region
     S05 (Region selector) -> pick region -> all pages re-render in new region
     clicks: 2

F07  Sign out
     S06 (Account menu) -> Sign out -> S02 (Login)
     clicks: 2

F08  Add to favorites
     S03 / S04 -> favorite star -> item appears in Favorites section on S01
     clicks: 2
```

Happy-path click count for core loop (F03): 4 clicks plus wizard steps. Target to beat: ≤4 clicks to create.

---

## Components

| Component | Variants | States | Screens used |
|---|---|---|---|
| Top band | dark `#232f3e`, sticky | light/dark theme | All |
| AWS logo | smiling arrow + "Console" wordmark | hover | S01, S07 |
| Services button | opens overlay overlay | open/closed | S03 |
| Search field | 32px, magnifying glass, Alt+S hint | empty/focused/results | S04 |
| Region selector | pin icon + region + dropdown | open/closed | S05 |
| Account menu | user icon + name + provider label | open/closed | S06 |
| BreadcrumbGroup | Home > Service > Resource | current-page highlighted | S07–S10 |
| AwsServiceHeader | icon + name + counter + create button + actions | default | S07 |
| ResourceTable | multi-select, filter, pagination, sorting, column preferences, actions dropdown | empty/loading/filled/error | S07 |
| Create wizard | stepper with review step | step N / review / success | S08 |
| DetailLayout | tabs (Details, Tags, Monitoring...) | active tab highlighted | S09 |
| ConfirmDialog | warning / error variants | open/closed | S11 |
| Flashbar | success/error/warning/info | dismissible | S12 |
| Terminal | xterm, command history | open/closed | S13 |
| Side rail | contextual nav + Additional services | expanded/collapsed | S07–S10 |
| CrossServiceLinks | dependent-service create menu | open/closed | S07 |
| StatusBadge | success/warning/error/info | colored | S07, S09 |
| EmptyState | title + description + create action | empty | S07 |
| ErrorState | message + retry/dismiss | error | S07 |

---

## Inferred Data Model

```
Service  id, name, href, category, icon, status (full|partial|not-supported), description
evidence: src/constants/navigation.ts, src/constants/service-compatibility.ts, /api/health
confidence: high

Resource  id, name, arn, state, region, created_at, service, tags (json), attributes (json)
evidence: S07 tables, /api/<service> endpoints, AWS public API docs
confidence: high

Account  id, username, provider (localstack|ministack|localemu), region, access_key_id
evidence: S06, AuthContext, /api/auth
confidence: high

HealthCheck  service, status (healthy|degraded|starting|unreachable), adapter_mode
evidence: /api/health, Dashboard
confidence: high

AuditEvent  event_name, service, resource_id, user, timestamp, outcome (success|failure)
evidence: CloudTrail (/api/cloudtrail), S09 detail tabs
confidence: medium
```

---

## What Cannot Be Cloned

| Item | Reason | Priority |
|---|---|---|
| Real AWS network and users | The emulator talks to LocalStack/Ministack, not AWS | skip |
| AWS-owned data (public IPs, real ARN prefixes) | Emulator generates synthetic IDs | skip |
| Partner deals / AWS Marketplace | Not part of emulator scope | skip |
| Regulated licenses (banking, health) | Not applicable to local emulator | skip |
| Hardware (physical servers, edge locations) | Emulated only | skip |

---

## Size Estimate

Screens: ~20 unique templates, instantiated across ~150 services  
User flows: 8 core flows  
Entities: 5 (Service, Resource, Account, HealthCheck, AuditEvent)  
Hard parts: multi-step wizards with validation, detail tabs per service, real-time terminal, global search across all services  
Size: **M** (a few weeks) — the shell and table patterns are already built; remaining work is per-service wiring.

---

## Five-Line Summary

Core loop: list resources → create via wizard → view detail → edit → delete, repeated across ~150 AWS services.  
Screen count: ~20 unique templates, service-specific instances for EC2, S3, IAM, Lambda, RDS, DynamoDB, VPC, CloudWatch, CloudFormation, KMS, Secrets Manager, Route 53, API Gateway, SQS, SNS, ECR, plus ~134 more.  
Flow count: 8 core flows (browse, search, create, view, delete, change region, sign out, favorite).  
Hardest parts: per-service create wizards with validation, detail tab sets per resource type, global search ranking, terminal emulator.  
Out of scope: real AWS network/users, AWS-owned data, partner marketplace, regulated licenses, physical hardware.  
Next step: `/replica-architect` to plan stack, database schema, and API routes.