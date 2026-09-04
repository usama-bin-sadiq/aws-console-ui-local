# AWS Management Console (Local Emulator Edition) — Product Requirements Document (PRD)

> **Version:** 1.1  
> **Last Updated:** September 2026  
> **Document Owner:** Product Engineering Team  
> **Status:** Active

### Changelog

| Version | Date | Change |
|---------|------|--------|
| 1.0 | Sep 2026 | Initial PRD — full UI/UX scope of a real AWS Console replica |
| 1.1 | Sep 2026 | **Gap-closure revision.** v1.0 specified pixel-level UI/UX for a *real* AWS Console but never stated the product is actually a **local-development console UI backed by AWS emulators (LocalStack and MiniStack)**, so it had no requirements for emulator wiring, endpoint routing, credential handling, service-parity gating, environment/DevOps setup, or how "pixel-perfect" would be verified and enforced. This revision adds: §0 Scope Clarification, updated §4 Architecture, updated Goals/Glossary/Risk Register, and four new appendices — **Appendix D (Emulator Compatibility), Appendix E (Local Dev Environment), Appendix F (Pixel-Perfect Hardening Rules), Appendix G (Codebase Audit Protocol & Feature Checklist), Appendix H (Testing Strategy & Definition of Done)**. Nothing in v1.0 was removed; all additions are backward-compatible. |
| 1.2 | Sep 2026 | **Third backend added: real AWS.** §4 now describes a 3-way `ACTIVE_BACKEND` (LocalStack \| MiniStack \| AWS) behind one Backend Adapter Layer, with a new §4.3 evaluating **NestJS** as a recommended (not mandatory) backend framework for this exact adapter/module/guard shape. Appendix D was rewritten with real-AWS endpoint/credential handling and a new **§D.5 Real-AWS Safety Guardrails** (target indicator, structural block on reset/seed against AWS, typed-confirm for destructive actions, opt-in `ALLOW_REAL_AWS_TARGET` flag). Appendix E's env vars, and Appendix G/H's audit and DoD checklists, were updated to cover all three backends. |

---

## 0. Scope Clarification — What This Product Actually Is

**This is not a clone of real AWS.** It is a **local-development web UI** that looks and behaves exactly like the real AWS Management Console, but every "AWS API call" it makes is routed to a **local AWS emulator** — either **[LocalStack](https://localstack.cloud)** or **[MiniStack](https://ministack.dev)**-compatible endpoints — running on the developer's machine or in a docker-compose/CI environment. There is no real AWS account, no real billing, no real IAM authority, and no real cloud resources behind this console. Every prior section of this PRD (visual design, navigation, wizards, tables, workflows) still applies **as the front-end contract**, but it must now be read together with §4 (updated), and Appendices D–H, which define:

- How the console talks to LocalStack/MiniStack instead of `*.amazonaws.com`
- What happens when the emulator doesn't support an action LocalStack/MiniStack doesn't implement (must never silently pretend to succeed)
- How "pixel-perfect vs. the real AWS console" is defined, measured, and enforced as an engineering gate, not just a design aspiration
- The mandatory process for auditing an existing codebase against this PRD — checking real internal logic, not just "does the file exist"

If any requirement elsewhere in this document conflicts with §0 or Appendices D–H (e.g., a workflow step implies calling a real AWS-only feature with no emulator equivalent), **Appendices D–H take precedence**, and the gap must be logged per Appendix D's parity matrix rather than silently dropped or silently faked.

---

## Table of Contents

0. [Scope Clarification — What This Product Actually Is](#0-scope-clarification--what-this-product-actually-is)
1. [Executive Summary](#1-executive-summary)
2. [Product Vision & Goals](#2-product-vision--goals)
3. [User Personas](#3-user-personas)
4. [Architecture Overview](#4-architecture-overview)
5. [Core Features](#5-core-features)
6. [Authentication & Access Management](#6-authentication--access-management)
7. [Service Navigation & Discovery](#7-service-navigation--discovery)
8. [Dashboard & Home](#8-dashboard--home)
9. [Service-Specific Consoles](#9-service-specific-consoles)
10. [Resource Management & CRUD](#10-resource-management--crud)
11. [Search & Command Palette](#11-search--command-palette)
12. [Billing, Cost & Account Management](#12-billing-cost--account-management)
13. [Settings & Preferences](#13-settings--preferences)
14. [Console Shell & Global UI](#14-console-shell--global-ui)
15. [Workflows (End-to-End)](#15-workflows-end-to-end)
16. [UI/UX Design System](#16-uiux-design-system)
17. [Security & Compliance](#17-security--compliance)
18. [Non-Functional Requirements](#18-non-functional-requirements)
19. [Accessibility](#19-accessibility)
20. [Internationalization (i18n)](#20-internationalization-i18n)
21. [Integrations](#21-integrations)
22. [Analytics & Observability](#22-analytics--observability)
23. [Metrics & KPIs](#23-metrics--kpis)
24. [Phased Rollout Plan](#24-phased-rollout-plan)
25. [Risk Register](#25-risk-register)
26. [Glossary](#26-glossary)
27. [Appendix A — Full Service Catalog](#appendix-a--full-service-catalog)
28. [Appendix B — Keyboard Shortcuts](#appendix-b--keyboard-shortcuts)
29. [Appendix C — AWACS (AWS Console Design System)](#appendix-c--awacs-design-system)
30. [Appendix D — LocalStack, MiniStack & Real AWS Compatibility](#appendix-d--localstack-ministack--real-aws--multi-backend-compatibility)
31. [Appendix E — Local Development Environment & DevOps](#appendix-e--local-development-environment--devops)
32. [Appendix F — Pixel-Perfect Fidelity & Hardening Rules](#appendix-f--pixel-perfect-fidelity--hardening-rules)
33. [Appendix G — Codebase Audit Protocol & Feature Completeness Checklist](#appendix-g--codebase-audit-protocol--feature-completeness-checklist)
34. [Appendix H — Testing Strategy & Definition of Done](#appendix-h--testing-strategy--definition-of-done)

---

## 1. Executive Summary

The **AWS Management Console** is the web-based interface that enables customers to interact with Amazon Web Services. It provides a unified, browser-based portal to provision, configure, monitor, and manage 200+ cloud services across compute, storage, databases, networking, AI/ML, analytics, security, and more.

This PRD defines the **complete scope** of the AWS Console as a product — including all user-facing features, workflows, design system, accessibility, security, and non-functional requirements — so that a team can build a faithful replica matching the original AWS web console's capabilities and user experience.

---

## 2. Product Vision & Goals

### Vision
To provide the most comprehensive, secure, and intuitive cloud management interface that empowers customers to innovate faster on AWS.

### Goals
| # | Goal | Success Metric |
|---|------|---------------|
| G1 | Complete service coverage | All 200+ AWS services accessible via console |
| G2 | 99.99% availability | Console uptime SLA |
| G3 | Task completion rate > 90% | Users complete resource creation without abandonment |
| G4 | Page load < 3s (P95) | Initial dashboard and service pages load fast |
| G5 | WCAG 2.1 AA compliance | Full accessibility support |
| G6 | Support 26 languages | Full i18n coverage |
| G7 | Sub-second search | Command palette returns results < 1s |
| G8 | Full multi-backend parity | Every "Supported" service in Appendix D's compatibility matrix works end-to-end against every backend the build supports (LocalStack, MiniStack, and real AWS where enabled), with identical UI behavior |
| G9 | Pixel-perfect visual fidelity | Automated visual-regression diff vs. reference AWS Console screenshots stays under the tolerance defined in Appendix F, per component, per release |
| G10 | Zero silent failures against any backend | No action ever shows a false "success" state when the underlying LocalStack/MiniStack/real-AWS call failed or the feature is unimplemented (see Appendix D §D.3) |
| G11 | Real AWS is never touched carelessly | Every guardrail in Appendix D §D.5 is present and verified before any build ships with `ALLOW_REAL_AWS_TARGET=true` |

---

## 3. User Personas

### 3.1 Cloud Administrator (Admin)
- **Role:** Manages entire AWS account, billing, IAM, compliance
- **Goals:** Control access, optimize costs, ensure security
- **Pain Points:** Complex IAM policies, multi-account management

### 3.2 Cloud Engineer / DevOps
- **Role:** Builds and deploys infrastructure (EC2, ECS, Lambda, VPC)
- **Goals:** Rapid provisioning, automation, monitoring
- **Pain Points:** Console navigation depth, cross-service configuration

### 3.3 Developer
- **Role:** Writes application code, uses Lambda, API Gateway, DynamoDB
- **Goals:** Quick prototyping, testing, deployment
- **Pain Points:** Too many clicks to deploy, complex permission setup

### 3.4 Data Engineer / Scientist
- **Role:** Manages data pipelines, analytics, ML workloads (S3, Glue, SageMaker)
- **Goals:** Data processing, model training, notebook management
- **Pain Points:** Data transfer complexity, cost estimation

### 3.5 Security / Compliance Officer
- **Role:** Audits access, enforces policies, manages KMS/WAF
- **Goals:** Compliance posture, threat detection, audit trails
- **Pain Points:** Policy drift, lack of visibility

### 3.6 Finance / FinOps
- **Role:** Monitors costs, allocates budgets, reviews invoices
- **Goals:** Cost optimization, budget alerts, chargeback
- **Pain Points:** Unexpected charges, complex pricing

### 3.7 Startup / Solo Developer
- **Role:** First-time AWS user, small team
- **Goals:** Quick onboarding, simple workflows
- **Pain Points:** Steep learning curve, service overload

---

## 4. Architecture Overview

### 4.1 High-Level Architecture (Multi-Backend Edition)

```
┌──────────────────────────────────────────────────────────────────┐
│                         BROWSER CLIENT                           │
│  ┌─────────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐ │
│  │  React SPA   │  │ AWACS UI │  │Monaco Ed.│  │ Monaco Editor│ │
│  │  (Next.js)   │  │  Library │  │(Console  │  │ (Policy Ed.) │ │
│  │              │  │          │  │  Shell)   │  │              │ │
│  └──────┬───────┘  └──────────┘  └──────────┘  └──────────────┘ │
└─────────┼────────────────────────────────────────────────────────┘
          │ HTTPS / WebSocket
          ▼
┌──────────────────────────────────────────────────────────────────┐
│              CONSOLE BACKEND (NestJS BFF — see §4.3)              │
│  ┌────────────┐  ┌──────────────┐  ┌──────────────────────┐     │
│  │  Console    │  │  Service     │  │  Auth Module          │     │
│  │  Service    │  │  Router      │  │  (local creds for     │     │
│  │  Proxy      │  │  (per-service│  │   emulators; real     │     │
│  │             │  │   endpoint   │  │   IAM/STS/SSO when     │     │
│  │             │  │   map)       │  │   target = AWS)        │     │
│  └──────┬─────┘  └──────┬───────┘  └──────────────────────┘     │
│         │               │           ┌──────────────────────┐     │
│         │               │           │  Safety Guard Layer   │     │
│         │               │           │  (blocks reset/seed/  │     │
│         │               │           │  destructive-without-  │     │
│         │               │           │  confirm when target   │     │
│         │               │           │  = AWS — Appendix D.5) │     │
│         │               │           └──────────────────────┘     │
│         ▼               ▼                                        │
│  ┌──────────────────────────────────────────────┐               │
│  │       Backend Adapter Layer (Appendix D)      │               │
│  │  Normalizes SDK calls + error shapes so the   │               │
│  │  same frontend works against ANY of the 3     │               │
│  │  targets below, selected by ACTIVE_BACKEND    │               │
│  └──────┬─────────────────┬─────────────────┬────┘               │
└─────────┼─────────────────┼─────────────────┼────────────────────┘
          ▼                 ▼                 ▼
 ┌──────────────────┐ ┌──────────────────┐ ┌────────────────────────┐
 │  LocalStack        │ │  MiniStack         │ │  Real AWS Account       │
 │  localhost:4566    │ │  localhost:<port>  │ │  *.amazonaws.com        │
 │  (edge port, all   │ │  (per its own      │ │  Real STS/IAM, real     │
 │   services)         │ │   port map)        │ │  billing, real regions  │
 └──────────────────┘ └──────────────────┘ └────────────────────────┘
```

### 4.2 Key Architectural Rules

1. **No hardcoded `*.amazonaws.com` endpoints anywhere in the frontend.** Every AWS SDK / API call goes through the Console Backend's Service Router, which resolves the target base URL — LocalStack, MiniStack, **or real AWS** — from configuration (see Appendix E), never from a literal hostname baked into a component.
2. **The frontend must be backend-agnostic.** UI components never branch on "is this LocalStack, MiniStack, or real AWS" — that logic lives entirely in the Backend Adapter Layer, which presents one normalized interface (consistent success/error/pagination shapes) to the frontend regardless of target.
3. **Region is backend-dependent.** LocalStack/MiniStack default to `us-east-1` only; **real AWS must show the full real region list** (§14.2) with live per-region service availability, since region behavior genuinely differs when `ACTIVE_BACKEND=aws`.
4. **Credentials are backend-dependent, never faked toward a real target.** Sign-in (§6) authenticates against a local user store for the two emulators; when `ACTIVE_BACKEND=aws`, the console must use the developer's **real** AWS credential chain (profile / SSO / env vars) — it must never invent, store, or auto-generate credentials that could be mistaken for real ones, and never let a real AWS session start silently.
5. **Every unsupported/partial feature must be explicit**, not hidden. See Appendix D §D.3 for the required UI treatment (disabled state, "Not supported by \<target\>" badge) — silently swallowing an error is a defect per Goal G10, and this applies to real AWS too (e.g., a permissions error must surface exactly like an emulator gap would).
6. **Real AWS is a privileged, guarded target.** Anything destructive, any auto-seed/auto-reset script, and any dev-only toggle must be structurally incapable of running against `ACTIVE_BACKEND=aws` — see Appendix D §D.5 for the mandatory guardrails. This is a safety requirement, not a nice-to-have.

### 4.3 Backend Framework — Is NestJS Required?

**No framework is "required" by this PRD** — the console backend just needs to be a BFF that does service routing, per-request credential/endpoint resolution, and (for real AWS) safety gating. That said, **NestJS is a strong, recommended fit** for exactly the shape of backend described in §4.1–4.2, for concrete reasons rather than popularity:

| Backend need (from §4.1–4.2) | Why NestJS fits |
|---|---|
| Swappable backend targets (LocalStack / MiniStack / AWS) behind one interface | NestJS's dependency-injection + provider pattern maps directly to a `BackendAdapter` interface with `LocalStackAdapter`, `MiniStackAdapter`, `AwsAdapter` classes, selected at runtime by a factory provider — clean strategy-pattern fit |
| One module per AWS service (EC2, S3, IAM, Lambda…) mirroring Appendix A's catalog | NestJS's module system naturally maps 1:1 to `Ec2Module`, `S3Module`, `IamModule`, etc., each wrapping the relevant AWS SDK v3 client — keeps the 200+-service surface organized instead of one giant router file |
| Blocking destructive/reset/seed actions when `ACTIVE_BACKEND=aws` (Appendix D.5) | NestJS **Guards** are a natural fit for a single `RealAwsSafetyGuard` applied via decorator to every risky route, rather than scattering `if (target === 'aws')` checks through business logic |
| Live features — CloudFormation stack events (§15.11), CloudShell terminal (§14.6) | NestJS **Gateways** (built on socket.io/ws) give first-class WebSocket support |
| Config-driven endpoint/credential resolution (Appendix E) | `@nestjs/config` gives typed, validated env-var config out of the box |
| Testing per Appendix H's test pyramid | NestJS's testing module + built-in Jest integration make unit/integration tests for each service module straightforward |
| API contract clarity for the frontend team | Built-in Swagger/OpenAPI decorators auto-document the BFF's own API surface |

**If NestJS isn't already the team's stack**, a plain Express/Fastify BFF with a hand-rolled adapter interface and a manual guard/middleware for the AWS-safety rule achieves the same requirements — NestJS just removes boilerplate for this specific shape (many small per-service modules + a guarded, swappable adapter + WebSockets). Treat §4.3 as a recommendation the team can accept or override; the **hard requirements are §4.2's six rules**, not the framework.

---

## 5. Core Features

### 5.1 Feature Inventory

| Feature ID | Feature | Priority |
|-----------|---------|----------|
| F-001 | Authentication (Root / IAM / SSO / Federated) | P0 |
| F-002 | Console Home / Dashboard | P0 |
| F-003 | Service Navigation (Sidebar + Search) | P0 |
| F-004 | Region Selector | P0 |
| F-005 | Account Menu | P0 |
| F-006 | Service-Specific Consoles (200+ services) | P0 |
| F-007 | Resource Creation Wizards | P0 |
| F-008 | Resource Listing & Detail Pages | P0 |
| F-009 | Global Search (Command Palette) | P0 |
| F-010 | CloudShell (Browser Terminal) | P1 |
| F-011 | Billing & Cost Management | P0 |
| F-012 | IAM Console | P0 |
| F-013 | CloudWatch Integration | P1 |
| F-014 | CloudFormation / IaC Integration | P1 |
| F-015 | Resource Groups & Tag Editor | P1 |
| F-016 | Support Center | P1 |
| F-017 | Notifications & Health Dashboard | P1 |
| F-018 | Console Settings (Theme, Language, Shortcuts) | P1 |
| F-019 | Documentation Tooltips | P1 |
| F-020 | Multi-Account Management (Organizations) | P1 |
| F-021 | Cross-Account Role Switching | P1 |
| F-022 | Policy Editor (Visual + JSON) | P0 |
| F-023 | Resource Status & Health Indicators | P1 |
| F-024 | Cost Implications on Resource Creation | P1 |
| F-025 | Export / Download Capabilities | P2 |
| F-026 | Activity History / Recent Items | P2 |
| F-027 | Pinning / Favorites | P2 |
| F-028 | Service Health Status Indicators | P1 |
| F-029 | EventBridge Integration | P2 |
| F-030 | Guided Tours / Walkthroughs | P2 |
| F-031 | User Feedback Widget | P2 |
| F-032 | Service Quotas Display | P1 |
| F-033 | CLI Command Generation (copy as CLI) | P2 |
| F-034 | CloudTrail Activity Viewer | P1 |
| F-035 | Cross-Service Search Results | P1 |

---

## 6. Authentication & Access Management

### 6.1 Sign-In Page

**Route:** `https://console.aws.amazon.com/`

#### 6.1.1 Root User Sign-In
- Email address input (IAM root user email)
- Password input with show/hide toggle
- "Remember me" checkbox (stores email in localStorage)
- "Sign in" button
- "Create a new AWS account" link → redirects to signup flow
- "Forgot password?" link → password recovery via email
- "Sign in using AWS IAM Identity Center" link
- Regional AWS logo (changes based on selected region)

#### 6.1.2 IAM User Sign-In
- Account ID (12-digit) or alias input
- IAM user name input
- Password input
- Sign in button
- "Sign in options" to switch to root user or SSO

#### 6.1.3 Federated Sign-In
- Redirect to Identity Provider (SAML/OIDC)
- Callback to AWS Console with session token
- Role selection if multiple roles available

#### 6.1.4 Multi-Factor Authentication (MFA)
- Virtual MFA (TOTP-based authenticator app)
- Hardware MFA (YubiKey, etc.)
- SMS-based MFA (legacy)
- MFA device setup wizard
- MFA challenge on sign-in (6-digit code input)
- "Trust this device" option

### 6.2 Session Management
- Session timeout: configurable (default 12 hours)
- Idle timeout: 30 minutes of inactivity (configurable)
- Concurrent session control
- Session token refresh mechanism
- Forced re-authentication for sensitive actions (root access)

### 6.3 Console Login URL Patterns
```
Root User:    https://signin.aws.amazon.com/console
IAM User:     https://<account-id>.signin.aws.amazon.com/console
SSO:          https://<domain>.awsapps.com/start#/console
Federated:    Custom IdP redirect
```

---

## 7. Service Navigation & Discovery

### 7.1 Sidebar Navigation

#### 7.1.1 Collapsed State (Icon-only)
- AWS logo (top)
- "Services" expand icon
- "Favorites" section (pinned services)
- "Recently visited" section
- Collapse/expand toggle (bottom)

#### 7.1.2 Expanded State
- AWS logo + "Console Home" link
- **Search input** — "Find services" with keyboard shortcut ( `/` or `.`)
- **Favorites** — User-pinned services (drag to reorder)
- **History** — Last 10 visited services
- **All Services** — Grouped by category:
  - Favorites
  - Compute
  - Storage
  - Database
  - Networking & Content Delivery
  - Machine Learning
  - Analytics
  - Management & Governance
  - Security, Identity & Compliance
  - Integration & Messaging
  - Customer Engagement
  - Business Applications
  - Frontend Web & Mobile
  - IoT
  - Developer Tools
  - Media Services
  - Game Development
  - AR & VR
  - Quantum Technologies
  - Satellite
  - Migration & Transfer
  - Hybrid Applications
  - Blockchain
  - Robots
  - Desktop & App Streaming
  - Economics
  - Containers
  - Cloud Financial Management
  - End User Computing

### 7.2 Favorites
- Add/remove service from sidebar (star icon)
- Drag-and-drop reorder
- Persist to user preferences (stored in DynamoDB or localStorage)
- Maximum 20 favorites

### 7.3 Recently Visited
- Auto-tracked per session
- Displayed with timestamp
- Last 10 services with clickable links
- Stored per-user, persisted across sessions

---

## 8. Dashboard & Home

### 8.1 Console Home Page

**Route:** `/console/home`

#### 8.1.1 Welcome Section
- Personalized greeting: "Welcome, [DisplayName]"
- Account ID display
- Current region selector (inline)
- AWS News & announcements banner (collapsible)

#### 8.1.2 Quick Access Cards
- "Welcome to AWS" — Getting started guide
- "Workloads" — Jump to deployed resources
- "Cost and usage" — Billing overview
- "Health dashboard" — Service health

#### 8.1.3 Getting Started Section (New Users)
- Interactive tutorials
- Sample projects
- AWS Free Tier banner
- "Complete your account setup" checklist

#### 8.1.4 Service Health
- Service Health Dashboard integration
- Current outages and maintenance windows
- Color-coded status indicators (green/yellow/red/gray)

#### 8.1.5 Cost & Usage Summary
- Month-to-date spend
- Forecasted spend
- Budget utilization bar
- Quick link to Cost Explorer

#### 8.1.6 Recently Visited
- Cards showing last 10 services visited
- Clickable to navigate directly

#### 8.1.7 Recommended Services
- ML-powered service recommendations based on usage patterns
- "Try new services" promotional cards

#### 8.1.8 Documentation & Learning
- Links to AWS documentation
- AWS Skill Builder integration
- Latest blog posts and tutorials

### 8.2 Service Dashboard (Per-Service Home)

Each service has its own dashboard accessible at `/console/<service-name>`:
- Service name and icon
- Overview/description
- Key metrics summary
- Resource count
- "Launch" or "Create" primary CTA
- Getting started guides
- Pricing information link
- API documentation link

---

## 9. Service-Specific Consoles

### 9.1 Service Console Structure

Every service console follows a consistent layout:

```
┌────────────────────────────────────────────────────┐
│ < Services > [EC2 Dashboard] [Instances] [Volumes]│
│                              [Security Groups] ...│
├────────────┬───────────────────────────────────────┤
│            │  ┌─────────────────────────────────┐  │
│  Service   │  │  Page Header                     │  │
│  Sidebar   │  │  (Breadcrumb, Title, Actions)    │  │
│  Nav       │  ├─────────────────────────────────┤  │
│            │  │  Content Area                    │  │
│  - Items   │  │  (Table / Form / Dashboard /     │  │
│  - Rules   │  │   Resource Detail / Wizard)      │  │
│  - Config  │  │                                  │  │
│  - Tags    │  └─────────────────────────────────┘  │
│            │  ┌─────────────────────────────────┐  │
│            │  │  Pagination / Summary Bar        │  │
│            │  └─────────────────────────────────┘  │
└────────────┴───────────────────────────────────────┘
```

### 9.2 Major Service Console Catalog

Below is the **complete service console list** with sub-pages:

#### 9.2.1 Compute
| Service | Sub-Pages |
|---------|-----------|
| **EC2** | Dashboard, Instances, Images (AMIs), Elastic Block Store, Snapshots, Network & Security, Load Balancing, Auto Scaling, Placement Groups, Key Pairs, Resource Pools, Dedication |
| **Lambda** | Functions, Layers, Code Signing Config, Destinations, File System, Monitor, Configuration |
| **ECS** | Clusters, Task Definitions, Task Definitions (Fargate), Task Definitions (EC2), Container Insights, Task Sets, Service Connect, Deployments, Service |
| **EKS** | Clusters, Add-ons, Configurations, IDP, Fargate Profiles, Compute, Secrets, Identity, Operator, Kubernetes Dashboard |
| **Lightsail** | Instances, Containers, Databases, Networking, Storage, Snapshots, Domains & SSL, DNS, Email, Distributions, Usage, Tags, Account |
| **App Runner** | Services, Domains, Observability, Connectors |
| **Batch** | Compute Environments, Job Queues, Job Definitions, Jobs, Scheduling Policies |
| **Elastic Beanstalk** | Applications, Environments, Configuration |
| **Outposts** | Outposts, Orders, racks, Capacity |
| **Serverless Application Repository** | Applications, Settings |
| **SimSpace Weaver** | Environments, Worlds, Snapshots |
| **Wavelength** | Zones, Instance, Carrier Gateways, VPC attachments |

#### 9.2.2 Storage
| Service | Sub-Pages |
|---------|-----------|
| **S3** | Buckets, Access Points, Access Grants, Batch Operations, Storage Lens, Storage Class Analysis, Metrics, Logging, Inventory, Replication, Tags, Permissions, Regions, Storage Management |
| **EBS** | Volumes, Snapshots, Elastic Block Store |
| **EFS** | File Systems, Access Points, File System Policies, Replication |
| **FSx** | Windows File Server, Lustre, NetApp ONTAP, OpenZFS, File Cache |
| **Storage Gateway** | Gateway (File, Volume, Tape), Volumes, Tape Libraries, Stored Volumes, Cached Volumes |
| **Backup** | Jobs, Vaults, Restore Jobs, Protected Resources, Backup Plans, Settings, Jobs, Reports |
| **AWS DataSync** | Locations, Tasks, Task Executions |
| **Snow Family** | Jobs, Devices, Local Endpoints |

#### 9.2.3 Database
| Service | Sub-Pages |
|---------|-----------|
| **RDS** | Dashboard, Instances, Parameter Groups, Option Groups, Subnet Groups, Replication Snapshots, Event Subscriptions, Proxies, Resources |
| **DynamoDB** | Tables, Indexes (Global, Local), Backups, Continuous Backups, Imports, Exports, Metrics, Capacity Planner |
| **ElastiCache** | Clusters, Parameter Groups, Subnet Groups, Replication Groups |
| **MemoryDB** | Clusters, Parameter Groups, Subnet Groups |
| **Neptune** | Clusters, Parameter Groups, Subnet Groups, Snapshots |
| **DocumentDB** | Clusters, Parameter Groups, Subnet Groups, Snapshots |
| **Keyspaces** | Tables, Workgroups |
| **QLDB** | Ledgers |
| **Timestream** | Databases, Scheduled Queries, Managed Writes |
| **Aurora** | (via RDS) Clusters, Backtracks, Global Database |
| **Amazon Redshift** | Clusters, Snapshots, Reserved Nodes, Parameter Groups, Subnet Groups, Workgroups, Queues, Data Sharing |

#### 9.2.4 Networking & Content Delivery
| Service | Sub-Pages |
|---------|-----------|
| **VPC** | Your VPCs, Subnets, Route Tables, Internet Gateways, NAT Gateways, Network ACLs, Security Groups, VPC Peering, VPN Gateways, Customer Gateways, Endpoints, Flow Logs, Reachability Analyzer, IPAM |
| **CloudFront** | Distributions, Origin Access Control, Function, Key Groups, Public Keys, Real-time Logs |
| **Route 53** | Hosted Zones, Resolver Rules, Resolver Endpoints, Health Checks, Domain Registration, DNSSEC |
| **API Gateway** | APIs, Custom Domain Names, Usage Plans, API Keys, WAF, Resource Policies |
| **ELB** | Load Balancers, Target Groups, Listeners, Rules |
| **Direct Connect** | Connections, Virtual Interfaces, Gateways, Direct Connect Gateway |
| **Global Accelerator** | Accelerators, Endpoints, Endpoint Groups, Listeners |
| **Transit Gateway** | Transit Gateways, Attachments, Peering Attachments, Route Tables, Multicast |
| **VPN** | Customer Gateways, Site-to-Site VPN Connections, Target Gateways |
| **Cloud Map** | Namespaces, Services, Instances |
| **PrivateLink** | Endpoints, Endpoint Services |

#### 9.2.5 Security, Identity & Compliance
| Service | Sub-Pages |
|---------|-----------|
| **IAM** | Dashboard, Users, Groups, Roles, Policies, Identity Providers, Account Settings, Credential Reports, Access Analyzer, Policy Evaluation |
| **Cognito** | User Pools, Federated Identities, Identity Pools, App Integration, App Client Settings |
| **KMS** | Customer Managed Keys, AWS Managed Keys, Grants, Key Policies, Alias, External Key Store |
| **Secrets Manager** | Secrets, Rotation, Resource Policies |
| **WAF** | Web ACLs, Rules, Rule Groups, IP Sets, Regex Pattern Sets, Managed Rule Groups |
| **Shield** | Standard (auto), Advanced (Proactive engagement, Health checks, Protected resources) |
| **GuardDuty** | Findings, Settings, Threat Lists, IP Sets, Admin, Detector |
| **Inspector** | Findings, Settings, Assessments, Account Management |
| **Detective** | Graph, Settings, Sources, Investigate |
| **Security Hub** | Overview, Security Standards, Insights, Security Events, Settings |
| **Macie** | Findings, Settings, S3 buckets, Job definitions, Custom data identifiers |
| **Config** | Dashboard, Rules, Conformance Packs, Resources, Relationships, Aggregators, Settings, Organizations |
| **Certificate Manager** | Certificates, Managed renewals, Private CA, Settings |
| **CloudTrail** | Trails, Event History, Settings, Lake, Insights |
| **IAM Identity Center** | Dashboard, Settings, Permission sets, Account assignments, Applications, External identity providers, Trust relationships, Groups, Users |
| **Verified Permissions** | Policy stores, Policies, Policy templates, Settings |
| **Resource Explorer** | Settings, Views, Aggregators |

#### 9.2.6 Machine Learning
| Service | Sub-Pages |
|---------|-----------|
| **SageMaker** | Domains, Studio, Notebooks, Experiments, Training Jobs, Endpoints, Models, Model Registry, Pipelines, Data Wrangler, Feature Store, JumpStart, Canvas, Ground Truth, Monitor, Workspaces |
| **Bedrock** | Getting started, Custom models, Provisioned throughput, Knowledge bases, Agents, Flows, Evaluation, Playground, Model access |
| **Rekognition** | (API-only, no console) |
| **Comprehend** | (API-only, console for custom models) |
| **Lex** | Bots, Slot types, Intents |
| **Polly** | (API-only) |
| **Translate** | (API-only, custom terminology) |
| **Textract** | (API-only) |
| **Personalize** | Datasets, Dataset groups, Campaigns, Recipes, Interactions |
| **Forecast** | (API-only) |
| **Lookout for Equipment** | (API-only) |
| **Lookout for Metrics** | (API-only) |
| **Lookout for Vision** | (API-only) |
| **Monitron** | Systems, Gateways, Sensors, ML models |
| **Dev Guru** | (API-only) |

#### 9.2.7 Analytics
| Service | Sub-Pages |
|---------|-----------|
| **Athena** | Query editor, Workgroups, Named queries, Data catalogs, Prepared queries, Saved queries, Notebook |
| **EMR** | Clusters, Studios, Notebooks, Applications, Security configurations |
| **Kinesis Data Streams** | Data streams, Analytics, Firehose, Video Streams |
| **Glue** | ETL Jobs, Crawlers, Data Catalog, Databases, Tables, Connections, Dev Endpoints, Registries |
| **Lake Formation** | Data lake permissions, Grant/transferred permissions, Data lakes, Settings |
| **QuickSight** | Dashboards, Analyses, Data sets, Data sources, SPICE, Themes, Custom visuals, Q |
| **OpenSearch Service** | Domains, Pipelines |
| **Data Pipeline** | (API-only) |
| **CloudSearch** | (API-only) |
| **Data Exchange** | (API-only) |
| **Data Firehose** | Delivery streams |

#### 9.2.8 Management & Governance
| Service | Sub-Pages |
|---------|-----------|
| **CloudWatch** | Dashboards, Alarms, Metrics, Logs, Log groups, Log streams, Insights, Synthetics, Application Signals, Service Level Objectives, Experiments, Anomaly Detection, Contributor Insights, X-Ray |
| **CloudFormation** | Stacks, Stack sets, Type registries, Change sets, Recovers, Drift, Settings, Designer, Guard |
| **Systems Manager** | Fleet Manager, Application Manager, Change Manager, OpsCenter, Explorer, Parameter Store, Patch Manager, Session Manager, State Manager, Run Command, Distributor, Automation, Compliance, Inventory, Maintenance Windows, Node Management, Document Manager |
| **AWS Service Catalog** | Portfolios, Products, Constraints, TagOptions, Settings |
| **AWS Control Tower** | Account Factory, Guardrails, Account Factory configurable controls, Landing zone, Dashboard |
| **Trusted Advisor** | Dashboard, Security, Performance, Cost optimization, Fault tolerance, Service limits |
| **AWS Health** | Dashboard, Account events, Service health, Organizations events, Event log |
| **Auto Scaling** | Auto Scaling groups, Scheduled actions, Launch configurations |
| **AWS License Manager** | Licenses, Settings, Manager, Accounts |
| **AWS RoboMaker** | (Limited) |

#### 9.2.9 Integration & Messaging
| Service | Sub-Pages |
|---------|-----------|
| **SQS** | Queues, Dead-letter queues, Monitoring |
| **SNS** | Topics, Subscriptions, Platform applications, Text messaging |
| **EventBridge** | Rules, Schedules, Pipes, Event buses, Schema registry, Archives, Replay |
| **Step Functions** | State machines, Workflows, Activity |
| **AppSync** | GraphQL APIs, Schema, Resolvers, Data sources, Functions, Pipeline resolvers |
| **MQ** | Brokers, Configurations |
| **Amazon MSK** | Clusters, Configurations, Connections |

#### 9.2.10 Developer Tools
| Service | Sub-Pages |
|---------|-----------|
| **CodeCommit** | Repositories, Settings, Triggers, Event triggers |
| **CodeBuild** | Build projects, Batch builds, Report groups, Build history |
| **CodeDeploy** | Applications, Deployment configurations, Deployment groups, Deployments, Custom deployment configurations |
| **CodePipeline** | Pipelines, Views, Settings |
| **Cloud9** | Environments |
| **CodeGuru** | (Limited console) |
| **X-Ray** | Service map, Traces, Groups, Insights, Sampling rules, Configuration |
| **CloudShell** | Terminal (in-console) |

#### 9.2.11 Mobile
| Service | Sub-Pages |
|---------|-----------|
| **Amplify** | Apps, Build settings, Domain management, Environment variables |
| **AppSync** | (see Integration) |
| **Device Farm** | Projects, Device pools, Runs, Remote access |

#### 9.2.12 Frontend Web & Mobile
| Service | Sub-Pages |
|---------|-----------|
| **Amplify** | (see Mobile) |
| **App Runner** | (see Compute) |

#### 9.2.13 IoT
| Service | Sub-Pages |
|---------|-----------|
| **IoT Core** | Things, Certificates, Policies, Rules, Tunnels, Jobs, Device Defender, Fleet Hub, SiteWise, Fleet Indexing |
| **IoT Analytics** | Datasets, Pipelines, Channels, Data stores, Queries, Resources |
| **IoT Events** | Detectors, Inputs, Actions, Logs |
| **IoT SiteWise** | Assets, Asset models, Gateways, Measurements, Portals, Projects, Dashboards |
| **IoT TwinMaker** | Workspaces, Entities, Components, Scenarios, Dashboards |
| **Greengrass** | Components, Deployments, Core devices, Groups, Subscriptions, Functions |

#### 9.2.14 Container Services
| Service | Sub-Pages |
|---------|-----------|
| **ECS** | (see Compute) |
| **EKS** | (see Compute) |
| **ECR** | Private repositories, Public repositories, Lifecycle policies |
| **App Runner** | (see Compute) |

#### 9.2.15 Customer Engagement
| Service | Sub-Pages |
|---------|-----------|
| **Connect** | Instances, Phone numbers, Contact flows, Queues, Hours of operation, Prompts, Security profiles, Users, Channels, Queues, Agent status |
| **Pinpoint** | Projects, Campaigns, Journeys, Segments, A/B testing, Message templates, APNs, FCM, Email |
| **SES** | Configurations, Identities, Domains, Email templates, Receiving email, Mailbox simulator |
| **SNS** | (see Integration) |
| **SQS** | (see Integration) |

#### 9.2.16 Business Applications
| Service | Sub-Pages |
|---------|-----------|
| **WorkMail** | Organizations, Users, Groups, Resources, Domains, Mobile devices |
| **WorkDocs** | (Limited) |
| **Connect** | (see Customer Engagement) |
| **Chime** | (Limited) |
| **WorkSpaces** | WorkSpaces, Images, WorkSpace bundles, IP groups, Directories |
| **AppStream 2.0** | Fleets, Stacks, Images, Usage Reports, Application Settings Persistence |
| **WorkSpaces Web** | Portals, Network settings, Browser settings |

#### 9.2.17 End User Computing
| Service | Sub-Pages |
|---------|-----------|
| **WorkSpaces** | (see Business Applications) |
| **AppStream 2.0** | (see Business Applications) |
| **WorkSpaces Web** | (see Business Applications) |
| **Amazon WorkLink** | (Limited) |

#### 9.2.18 Migration & Transfer
| Service | Sub-Pages |
|---------|-----------|
| **Application Migration Service (MGN)** | Source servers, Templates, Launch templates, Waves, Recovery instances |
| **DMS** | Replication instances, Endpoints, Replication tasks, Migration projects, Data providers, Table mappings |
| **Migration Hub** | Portfolios, Journeys, Settings |
| **AWS Data Migration Service** | (see DMS) |
| **AWS Snow Family** | (see Storage) |
| **AWS DataSync** | (see Storage) |
| **AWS Transfer Family** | Servers, Users, Workflows |
| **AWS Migration Evaluator** | (Limited) |
| **AWS Migration Hub Refactor Spaces** | Environments, Services, Routes, Resource policies |

#### 9.2.19 AR & VR
| Service | Sub-Pages |
|---------|-----------|
| **Sumerian** | (Limited) |
| **Managed Graph** | (Limited) |

#### 9.2.20 Game Tech
| Service | Sub-Pages |
|---------|-----------|
| **GameLift** | GameLift, Resources, Hosting, Matchmaking |
| **GameSparks** | (Limited) |

#### 9.2.21 Satellite
| Service | Sub-Pages |
|---------|-----------|
| **Ground Station** | Contacts, Antennas, Configurations, Dataflow endpoint groups |

#### 9.2.22 Quantum Technologies
| Service | Sub-Pages |
|---------|-----------|
| **Braket** | Quantum computing resources |

#### 9.2.23 Blockchain
| Service | Sub-Pages |
|---------|-----------|
| **Managed Blockchain** | Networks, Members, Peers, Memberships, Voting policies |

#### 9.2.24 Robots
| Service | Sub-Pages |
|---------|-----------|
| **RoboMaker** | (Limited) |

#### 9.2.25 Cloud Financial Management
| Service | Sub-Pages |
|---------|-----------|
| **Cost Explorer** | Reports, Savings, Reservations, Rightsizing |
| **Budgets** | Budgets, Actions, Preferences, Cost and Usage Reports |
| **Billing Conductor** | Billing groups, Custom line items, Pricing rules, Assignments |
| **Compute Optimizer** | Recommendations, Preferences, Export |
| **Savings Plans** | Savings Plans, Utilization, Coverage, Recommendations |
| **Reserved Instance Reporting** | Purchases, Modifiable RIs |

---

## 10. Resource Management & CRUD

### 10.1 Resource Creation Wizard Pattern

Every AWS resource creation follows a **multi-step wizard** pattern:

#### Step Structure
```
┌─────────────────────────────────────────────────────┐
│  [Step 1: Basics] → [Step 2: Configure] → [Review] │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │  Section: General Configuration             │   │
│  │                                             │   │
│  │  Name *                                     │   │
│  │  ┌─────────────────────────────────────┐   │   │
│  │  │ my-resource-name                    │   │   │
│  │  └─────────────────────────────────────┘   │   │
│  │                                             │   │
│  │  Description                                │   │
│  │  ┌─────────────────────────────────────┐   │   │
│  │  │ Optional description...             │   │   │
│  │  └─────────────────────────────────────┘   │   │
│  │                                             │   │
│  │  Tags                                       │   │
│  │  ┌───────────┬───────────────────────┐     │   │
│  │  │ Key       │ Value                 │     │   │
│  │  ├───────────┼───────────────────────┤     │   │
│  │  │ Environment│ production           │     │   │
│  │  └───────────┴───────────────────────┘     │   │
│  │  [+ Add tag]                                │   │
│  │                                             │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │  ⚠ Estimated monthly cost: $45.00 - $120.00 │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│              [Cancel]  [Next: Configure →]          │
└─────────────────────────────────────────────────────┘
```

#### Wizard Features
- **Step indicator** — Shows progress (Step 1 of N)
- **Navigation** — Previous/Next buttons, clickable step numbers
- **Validation** — Real-time field validation with error messages
- **Required fields** — Marked with asterisk (*)
- **Help tooltips** — Inline help icons with popover explanations
- **Cost estimation** — Running monthly cost estimate updates as options change
- **Tags** — Every resource supports key-value tag pairs
- **Review step** — Summary of all selections before final creation
- **Launch button** — Triggers resource creation with progress indicator
- **View creation progress** — Link to resource status/logs after launch

### 10.2 Resource Listing Page

#### Table View
```
┌────────────────────────────────────────────────────────────────┐
│ [Search: ___________] [Filter ▼] [Actions ▼] [Refresh] [⚙]   │
├────────────────────────────────────────────────────────────────┤
│ ☐ Name       │ Status   │ Type      │ AZ       │ Created      │
├──────────────┼──────────┼───────────┼──────────┼──────────────┤
│ ☑ my-server  │ ✅ Running│ t3.medium │ us-e-1a  │ 2026-01-15   │
│ ☐ web-server │ ⏹ Stopped│ t2.micro  │ us-e-1b  │ 2026-01-10   │
│ ☐ db-server  │ ⏹ Stopped│ m5.large  │ us-e-1a  │ 2026-01-08   │
├────────────────────────────────────────────────────────────────┤
│ Showing 1-25 of 127  [< Prev]  [Next >]   [Show: 25 ▼]        │
└────────────────────────────────────────────────────────────────┘
```

#### Table Features
- **Column sorting** — Click header to sort asc/desc
- **Column filtering** — Dropdown filter per column
- **Search** — In-page text search
- **Pagination** — Configurable items per page (10/25/50/100)
- **Column visibility toggle** — Show/hide columns
- **Row selection** — Checkbox for bulk actions
- **Bulk actions** — Start/Stop/Delete/Tag multiple resources
- **Inline status indicators** — Color-coded (green=running, yellow=pending, red=error, gray=stopped)
- **Resource name** — Clickable link to detail page
- **Right-click context menu** — Quick actions (Start/Stop/Delete/Edit tags)
- **Export** — Export to CSV/JSON
- **Refresh button** — Reload table data

### 10.3 Resource Detail Page

```
┌───────────────────────────────────────────────────────┐
│ < Instances / my-server                                │
├───────────────────────────────────────────────────────┤
│                                                       │
│ ┌─── Tabs ──────────────────────────────────────────┐│
│ │ [Summary] [Status and alerts] [Networking] [       ││
│ │ Storage] [Security] [Tags] [Monitoring] [           ││
│ │ Tags] [Recovery] [Configuration]                    ││
│ └───────────────────────────────────────────────────┘│
│                                                       │
│ ┌─── Summary Panel ─────────────────────────────────┐│
│ │ Instance ID:    i-0abc123def456789                 ││
│ │ Instance State: Running ⬤                         ││
│ │ Instance Type:  t3.medium                         ││
│ │ AZ:             us-east-1a                        ││
│ │ Private IP:     10.0.1.45                         ││
│ │ Public IP:      54.xxx.xxx.xxx                    ││
│ │ Key Pair:       my-key                            ││
│ │ Platform:       Linux                             ││
│ │ Status Checks:  2/2 system + instance             ││
│ └───────────────────────────────────────────────────┘│
│                                                       │
│ [Connect] [Actions ▼] [Instance State ▼]             │
└───────────────────────────────────────────────────────┘
```

#### Detail Page Tabs
- **Summary** — Key properties and metadata
- **Monitoring** — CloudWatch graphs (CPU, Network, Disk, Status checks)
- **Tags** — Editable tag table
- **Configuration** — Instance configuration details
- **Security** — Security groups, IAM roles
- **Networking** — VPC, subnets, IP addresses, ENI
- **Storage** — Attached EBS volumes
- **Status and alerts** — CloudWatch alarms
- **Recovery** — Instance recovery options

### 10.4 Resource Actions

#### Context Menu Actions (vary by resource type)
| Action | Description |
|--------|-------------|
| Start | Power on resource |
| Stop | Gracefully stop resource |
| Terminate/Delete | Permanently remove resource |
| Reboot | Restart without full shutdown |
| Connect | SSH/RDP/Session Manager |
| Edit | Modify configuration |
| Clone/Copy | Duplicate resource |
| Add Tags | Add/update resource tags |
| Create Image | Create snapshot/AMI |
| Attach/Detach | Volume/network attachment |
| Monitor | Open CloudWatch metrics |
| View in CloudTrail | View API activity |

---

## 11. Search & Command Palette

### 11.1 Global Search

**Trigger:** Press `/` or `.` or click search icon in header

#### Search Modal
```
┌──────────────────────────────────────────────────────────┐
│ 🔍 Search AWS resources, services, features, docs...    │
│ ┌──────────────────────────────────────────────────────┐│
│ │ ec2 instance type                                    ││
│ └──────────────────────────────────────────────────────┘│
├──────────────────────────────────────────────────────────┤
│ SERVICES (3)                                            │
│  🟦 EC2 — Elastic Compute Cloud                         │
│  🟦 Lightsail — Virtual Private Servers                 │
│  🟦 Outposts — On-premises cloud                       │
├──────────────────────────────────────────────────────────┤
│ RESOURCES (5)                                           │
│  🟩 i-0abc123 — my-web-server (EC2)                    │
│  🟩 i-0def456 — my-db-server (EC2)                     │
│  🟧 vol-0aaa111 — my-ebs-volume (EBS)                  │
├──────────────────────────────────────────────────────────┤
│ DOCUMENTATION (2)                                       │
│  📄 EC2 Instance Types — AWS Docs                      │
│  📄 EC2 Pricing — AWS Docs                             │
├──────────────────────────────────────────────────────────┤
│ ACTIONS (3)                                             │
│  ⚡ Launch EC2 Instance                                 │
│  ⚡ View EC2 Dashboard                                  │
│  ⚡ AWS CLI Reference                                   │
└──────────────────────────────────────────────────────────┘
```

#### Search Features
- **Fuzzy matching** — Find results even with typos
- **Category tabs** — Filter by Services, Resources, Docs, Actions
- **Recent searches** — Saved per user session
- **Keyboard navigation** — Arrow keys, Enter to select, Escape to close
- **Resource search** — Across all AWS resources in current region
- **Quick actions** — Launch wizards, open dashboards
- **Regional awareness** — Search scoped to current region
- **Results ranking** — Most relevant results first

### 11.2 Console Search (Per-Service)

Each service console includes local search:
- Filter resources within the service
- Table column search
- Tag-based search
- Resource ID search

### 11.3 AWS CLI Command Generation

From any console page, generate equivalent CLI command:
- "Copy as CLI" button on resource creation forms
- CLI command preview before execution
- Configurable profile and region

---

## 12. Billing, Cost & Account Management

### 12.1 Billing Dashboard

**Route:** `/console/billing/v2/home`

#### Dashboard Components
- **Current charges** — Month-to-date actual cost
- **Forecast** — Projected end-of-month cost
- **Spend Summary** — Last 6 months trend (chart)
- **Cost by Service** — Breakdown pie chart
- **Cost by Region** — Geographic breakdown
- **Free Tier Usage** — Current month free tier consumption
- **Payment History** — Recent invoices and payments
- **Billing preferences** — Email delivery, PDF preferences

### 12.2 Cost Explorer

**Route:** `/console/costexplorer/home`

#### Features
- **Time range selector** — Daily/Weekly/Monthly/Custom
- **Group by** — Service, Region, AZ, Tag, Account, Invoice
- **Filter** — By any dimension
- **Forecast** — Forward-looking cost projections
- **Rightsizing recommendations** — Underutilized resources
- **Savings Plans recommendations** — Purchase suggestions
- **Reservation recommendations** — RI purchase suggestions
- **Export to CSV/JSON**
- **Saved reports** — Create, manage, share reports
- **Anomaly detection** — Unexpected cost alerts

### 12.3 Budgets

**Route:** `/console/cbillingv2/home#/budgets`

#### Budget Types
- **Cost budget** — Set monthly spending limit
- **Usage budget** — Set usage limit (e.g., hours)
- **Reservation budget** — Track RI/SP utilization

#### Budget Actions
- **Email alerts** — At 50%, 80%, 100% thresholds
- **SNS notifications** — Custom SNS topic
- **IAM policy actions** — Auto-restrict permissions at threshold
- **Auto-scaling actions** — Reduce resources at threshold

### 12.4 Bills

**Route:** `/console/billing/billing/home`

#### Features
- **Invoice list** — All historical invoices
- **Invoice detail** — Downloadable PDF
- **Service-level breakdown** — Cost per AWS service
- **Region-level breakdown** — Cost per region
- **Tax breakdown** — Federal, state, VAT
- **Credits** — Applied credits and refunds
- **Payment methods** — Credit cards, bank accounts

### 12.5 Payment Methods
- Add/remove credit cards
- Set default payment method
- Add bank accounts (ACH)
- Invoice management (manual invoicing)
- Tax exemption certificates

### 12.6 Cost Allocation Tags
- Activate cost allocation tags
- Tag-based cost allocation
- Cost allocation tag management
- Cost allocation report generation

### 12.7 Savings Plans
- Purchase Savings Plans
- Savings Plans utilization reports
- Savings Plans coverage reports
- Recommendations
- Convert to commitment

### 12.8 Reserved Instances
- Purchase Reserved Instances
- RI Marketplace
- Convert to RI
- Modify RI
- RI Reporting (utilization, coverage, recommendations)

### 12.9 Account Settings
- **Account name** — Display name
- **Alternate contacts** — Security, Operations, Billing contacts
- **Consolidated billing** — Multi-account billing
- **Account contacts** — Primary contact information
- **Account email** — Root user email
- **Close account** — Account closure

---

## 13. Settings & Preferences

### 13.1 Console Settings

**Route:** `/console/account/v2/home#settings`

#### Theme Settings
- **Dark mode** — Dark background, light text
- **Light mode** — Light background, dark text (default)
- **System default** — Follow OS preference
- Auto-save preference

#### Region Settings
- **Default region** — Region shown on console home
- **Recent regions** — Quick-switch dropdown
- **All regions** — Full region list with services availability

#### Language Settings
- Supported: English, Japanese, Korean, Chinese (Simplified), Chinese (Traditional), French, German, Italian, Spanish, Portuguese (Brazilian), Russian, Turkish, Arabic, Hindi, Thai, Vietnamese, Indonesian, Polish, Czech, Hungarian, Romanian, Greek, Hebrew, Malay, Filipino, Swedish, Norwegian, Danish, Finnish, Dutch, Ukrainian
- Default: English

#### Keyboard Shortcuts
- Toggle shortcuts display
- Customizable shortcuts
- Shortcut reference modal

#### Accessibility Settings
- High contrast mode
- Reduced motion
- Screen reader optimization
- Font size adjustment

### 13.2 User Preferences
- **Recently visited** — Clear history
- **Favorites** — Manage pinned services
- **Notification preferences** — Email, SMS, console notifications
- **Default resource view** — Table vs. Grid
- **Items per page** — 10, 25, 50, 100
- **CLI default region** — AWS CLI default config

### 13.3 Organization Settings (Multi-Account)
- **Organization structure** — OUs, accounts
- **Service Control Policies (SCPs)** — Policy management
- **Consolidated billing** — Bill management
- **Trusted access** — Service access across accounts
- **Delegated administration** — Service management delegation

---

## 14. Console Shell & Global UI

### 14.1 Console Header

```
┌──────────────────────────────────────────────────────────────┐
│ 🟧 AWS Logo │ Services ▼ │ 🔍 Search... │ ☁ Region: ▼     │
│                                                                 │
│ [Docs] [Support] [💬] [🟥👤 john@acme.com ▼]                 │
└──────────────────────────────────────────────────────────────┘
```

#### Header Elements
| Element | Description |
|---------|-------------|
| AWS Logo | Links to Console Home |
| Services | Opens services mega-menu |
| Search | Global search (keyboard shortcut: `/`) |
| Region Selector | Dropdown with all regions |
| Documentation | Link to AWS docs |
| Support | Link to AWS Support Center |
| Notifications | Bell icon with unread count |
| Account Menu | User dropdown with account settings |

### 14.2 Region Selector

#### Dropdown Features
- Current region displayed with flag
- Grouped by geographic area:
  - **North America:** us-east-1, us-east-2, us-west-1, us-west-2, ca-central-1, etc.
  - **South America:** sa-east-1
  - **Europe:** eu-west-1, eu-west-2, eu-west-3, eu-central-1, etc.
  - **Asia Pacific:** ap-southeast-1, ap-northeast-1, ap-south-1, etc.
  - **Middle East:** me-south-1, me-central-1, ap-south-2
  - **Africa:** af-south-1
  - **China:** cn-north-1, cn-northwest-1
- Region status indicator (green = available, yellow = limited, red = down)
- Service availability tooltip per region
- "Region is temporarily disabled" warning
- Region change updates all console pages

### 14.3 Account Menu

```
┌──────────────────────────────────────────┐
│ 👤 John Smith                            │
│ john@acme.com                            │
│ Account ID: 123456789012                 │
├──────────────────────────────────────────┤
│ 🏢 Account                               │
│ 👤 Organization                          │
│ 🔐 Security credentials                  │
│ ⚙️ Billing Dashboard                     │
│ 📋 Service Quotas                        │
│ 🔑 IAM Identity Center                   │
│ ⚙️ Console Settings                      │
│ 🚪 Sign Out                              │
├──────────────────────────────────────────┤
│ Switch Role                               │
│ Enter role: [arn:aws:iam::123:role/___]  │
│ Display Name: [____________]              │
│ [Cancel] [Switch Role]                    │
└──────────────────────────────────────────┘
```

#### Account Menu Items
| Item | Route |
|------|-------|
| Account | `/console/home/account` |
| Organization | `/console/organizations/home` |
| Security Credentials | `/console/iamv5/home#/security_credentials` |
| Billing Dashboard | `/console/billing/v2/home` |
| Service Quotas | `/console/servicequotas/home` |
| IAM Identity Center | `/console/singlesignon/home` |
| Console Settings | `/console/account/v2/home#settings` |
| Sign Out | Session invalidation + redirect |

### 14.4 Console Footer

```
┌──────────────────────────────────────────────────────────────┐
│ © 2008-2026, Amazon Web Services, Inc. or its affiliates.   │
│ [Privacy] [Legal] [Communications Preferences]               │
│ Console version: 2.45.1 | Console build: 2026.09.01          │
└──────────────────────────────────────────────────────────────┘
```

### 14.5 Notification Center

- Bell icon in header
- Unread count badge
- Dropdown panel:
  - Service health alerts
  - Cost alerts
  - Security alerts
  - Account notifications
  - Announcements
  - Maintenance windows
- Mark as read/unread
- Clear all notifications
- Notification settings (opt-in/opt-out)

### 14.6 CloudShell

**Route:** `/console/cloudshell/home`

#### Features
- Browser-based terminal emulator
- Pre-authenticated with current IAM credentials
- Full AWS CLI access
- Pre-installed tools: Python, Node.js, git, npm, pip
- Multiple terminal tabs
- File upload/download
- Clipboard integration
- Customizable shell (bash, zsh)
- Session timeout (configurable)
- CloudShell environment management

### 14.7 Help & Documentation

- Context-sensitive help icons throughout console
- Documentation tooltip popovers
- "Learn more" links to relevant AWS docs
- Interactive tutorials and guided walkthroughs
- AWS re:Post community link
- AWS IQ (Expert help)
- AWS Support plans
- Training and certification links

---

## 15. Workflows (End-to-End)

### 15.1 EC2 Instance Launch Workflow

```
Step 1: Choose AMI
┌────────────────────────────────────────────────────────┐
│ Select an Amazon Machine Image (AMI)                   │
│ ┌─────────┬──────────┬─────────┬──────────┬─────────┐ │
│ │ Quick   │ My AMIs  │ AWS     │Community │ AWS     │ │
│ │ Start   │          │Marketpl.│  AMIs    │ Xfer    │ │
│ └─────────┴──────────┴─────────┴──────────┴─────────┘ │
│ Filter: [Architecture ▼] [Root ▼] [Virtualization ▼]  │
│ ┌──────────────────────────────────────────────────┐   │
│ │ Amazon Linux 2023  │ 64-bit (x86) / arm64       │   │
│ │ Free tier eligible │ EBS only                    │   │
│ │ [Select]                                     ℹ   │   │
│ └──────────────────────────────────────────────────┘   │
│ ┌──────────────────────────────────────────────────┐   │
│ │ Ubuntu Server 24.04 LTS │ 64-bit (x86) / arm64  │   │
│ │ Free tier eligible │ EBS only                    │   │
│ │ [Select]                                     ℹ   │   │
│ └──────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────┘

Step 2: Choose Instance Type
┌────────────────────────────────────────────────────────┐
│ Select instance type                                   │
│ Filter: [t ▼] [Free tier ▼] [2 vCPUs ▼]               │
│ ┌────────────┬──────┬───────┬──────┬───────────────┐  │
│ │ Type       │ vCPU │ Memory│ $/hr │               │  │
│ ├────────────┼──────┼───────┼──────┼───────────────┤  │
│ │ t2.micro   │ 1    │ 1 GiB │ 0.00 │ ☑ Free tier  │  │
│ │ t3.small   │ 2    │ 2 GiB │ 0.02 │               │  │
│ │ t3.medium  │ 2    │ 4 GiB │ 0.04 │               │  │
│ │ m5.large   │ 2    │ 8 GiB │ 0.09 │               │  │
│ └────────────┴──────┴───────┴──────┴───────────────┘  │
└────────────────────────────────────────────────────────┘

Step 3: Configure Instance
- Number of instances: [1]
- Purchasing options: ☐ Spot Instance
- Network settings: VPC, Subnet, Security Group
- IAM role: [None ▼]
- User data: [Optional script]
- Detailed monitoring: ☐ Enable
- Tenancy: ○ Shared ○ Dedicated ○ Host

Step 4: Add Storage
- Root volume: 8 GB gp3 (modify size/type)
- ☐ Add additional EBS volume
- Delete on termination: ☑

Step 5: Add Tags
- Key/Value pairs: [Environment: production] [+ Add tag]

Step 6: Configure Security Group
- Create new: [SSH ▼] from [Anywhere 0.0.0.0/0 ▼]
- ☐ Allow HTTPS (port 443)
- ☐ Add rule: [Custom TCP ▼] [443 ▼] from [Anywhere]

Step 7: Review and Launch
┌────────────────────────────────────────────────────────┐
│ AMI: Amazon Linux 2023                                 │
│ Instance Type: t3.medium                              │
│ Key Pair: [Select key pair ▼]                         │
│ Security Groups: sg-abc123 (allow SSH)                 │
│ Estimated monthly cost: $30.37                         │
│                                                        │
│ [Edit steps]                                           │
│ [Cancel] [Launch]                                      │
└────────────────────────────────────────────────────────┘

Step 8: Launch Progress
┌────────────────────────────────────────────────────────┐
│ ✅ Initiating Instance Launches                       │
│ ✅ Creating Security Groups                           │
│ ✡ Launching Instances                                │
│ ⬜ Waiting for instance to be ready                   │
│                                                        │
│ [View Instances]  [Launch another instance]            │
└────────────────────────────────────────────────────────┘
```

### 15.2 S3 Bucket Creation Workflow

```
Step 1: General Configuration
┌────────────────────────────────────────────────────────┐
│ Bucket name: [my-company-data-2026_____]               │
│                                                        │
│ AWS Region: [us-east-1 ▼]                             │
│                                                        │
│ ☐ Enable Block Public Access settings for this bucket  │
│ ☐ Enable bucket versioning                            │
│ ☐ Enable default encryption                           │
└────────────────────────────────────────────────────────┘

Step 2: Properties
- Tags: Key/Value pairs
- Object Lock: ☐ Enable (compliance mode / governance mode)

Step 3: Permissions
- Bucket policy: [JSON editor / Policy wizard]
- ACL: ☐ Edit / ☐ Use bucket owner enforced
- CORS: [JSON editor]
- Static website hosting: ☐ Enable

Step 4: Review
- Summary of all settings
- Estimated cost: (storage + requests)
- [Create bucket]
```

### 15.3 Lambda Function Creation Workflow

```
Step 1: Author from scratch / Blueprint / Container image
┌────────────────────────────────────────────────────────┐
│ Function name: [my-function_____]                      │
│ Runtime: [Node.js 20.x ▼]                             │
│ Architecture: ○ x86_64 ○ arm64                        │
│ ☐ Enable code signing                                │
└────────────────────────────────────────────────────────┘

Step 2: Code
- Inline editor / ZIP upload / S3 URI / Container image
- Runtime settings: Handler, Timeout, Memory, ephemeral storage
- Environment variables: [Key=Value editor]
- Tags: [Key=Value editor]

Step 3: Permissions
- Execution role: [Create new role / Use existing role]
- ☐ Enable VPC access
- ☐ Enable CloudWatch Logs

Step 4: Triggers
- [Add trigger] — API Gateway / S3 / DynamoDB / SQS / etc.
- Configure trigger settings per source

Step 5: Concurrency
- Provisioned concurrency: [0]
- Reserved concurrency: [Not set]

Step 6: Destination
- On success: [SQS/SNS/Lambda ▼]
- On failure: [SQS/SNS/Lambda ▼]

Step 7: Monitoring
- CloudWatch Logs
- X-Ray tracing: ☐ Active / ☐ Pass through

Step 8: Review
- Function overview with triggers diagram
- Estimated cost: (requests + duration)
- [Create function]
```

### 15.4 VPC Creation Workflow

```
Step 1: VPC Settings
┌────────────────────────────────────────────────────────┐
│ VPC name: [my-vpc_____]                                │
│ IPv4 CIDR block: [10.0.0.0/16]                        │
│ IPv6 CIDR block: ○ No IPv6 ○ Amazon ▼                 │
│ Tenancy: ○ Default ○ Dedicated                        │
│ ☐ Enable DNS hostnames                                │
│ ☐ Enable DNS resolution                               │
└────────────────────────────────────────────────────────┘

Step 2: Subnets
┌────────────────────────────────────────────────────────┐
│ Subnet Name    │ Availability Zone │ IPv4 CIDR        │
│ public-1a      │ us-east-1a        │ 10.0.0.0/24      │
│ public-1b      │ us-east-1b        │ 10.0.1.0/24      │
│ private-1a     │ us-east-1a        │ 10.0.2.0/24      │
│ private-1b     │ us-east-1b        │ 10.0.3.0/24      │
└────────────────────────────────────────────────────────┘

Step 3: NAT Gateway
- ○ Create NAT Gateway in [subnet ▼] (costs ~$32/mo)
- ○ No NAT Gateway
- ○ Use existing NAT Gateway

Step 4: Flow Logs
- ☐ Enable Flow Logs to CloudWatch Logs
- ☐ Enable Flow Logs to S3
- ☐ Enable both

Step 5: Tags
- Key/Value pairs

Step 6: Review
- VPC CIDR: 10.0.0.0/16 (65,536 IPs)
- Subnets: 4
- NAT Gateways: 1 ($32.40/month)
- Estimated monthly cost: ~$32.40
- [Create VPC]
```

### 15.5 IAM User Creation Workflow

```
Step 1: User Details
┌────────────────────────────────────────────────────────┐
│ User name: [jane.doe_____]                             │
│ ☐ Provide user access to AWS Management Console        │
│   Password type: ○ Autogenerated ○ Custom              │
│   ☐ Users must create a new password at next sign-in  │
└────────────────────────────────────────────────────────┘

Step 2: Permissions
- ○ Add user to group (select group ▼)
- ○ Copy permissions from existing user (select user ▼)
- ☐ Attach policies directly (search policies)
- Policy attachments:
  - [AdministratorAccess ☑]
  - [ReadOnlyAccess ☐]
  - [Custom: EC2FullAccess ☑]

Step 3: Tags
- Key/Value pairs: [Department: Engineering]

Step 4: Review
- Username: jane.doe
- Groups: DevOps-Team
- Policies: AdministratorAccess, Custom-EC2FullAccess
- Console access: Yes (autogenerated password)
- [Create user]

Step 5: Success
┌────────────────────────────────────────────────────────┐
│ ✅ User created successfully!                         │
│                                                        │
│ ⚠ Download or copy these credentials:                 │
│ User name: jane.doe                                   │
│ Password: ••••••••••••                                │
│ Console sign-in URL: https://123456.signin.aws...     │
│                                                        │
│ [Download .csv] [Done]                                 │
└────────────────────────────────────────────────────────┘
```

### 15.6 Security Group Creation Workflow

```
Step 1: Basic Details
- VPC: [Select VPC ▼]
- Security group name: [web-servers______]
- Description: [Security group for web servers__]

Step 2: Inbound Rules
| Type | Port | Source | Description |
|------|------|--------|-------------|
| SSH | 22 | 0.0.0.0/0 | SSH access |
| HTTP | 80 | 0.0.0.0/0 | HTTP access |
| HTTPS | 443 | 0.0.0.0/0 | HTTPS access |

Step 3: Outbound Rules
| Type | Port | Destination | Description |
|------|------|-------------|-------------|
| All traffic | All | 0.0.0.0/0 | Allow all outbound |

Step 4: Tags
- Key/Value pairs

Step 5: Review
- [Create security group]
```

### 15.7 Route 53 Hosted Zone Workflow

```
Step 1: Choose public/private
- ○ Public hosted zone
- ○ Private hosted zone (select VPC ▼)

Step 2: Domain name
- Domain name: [example.com______]
- ☐ Turn on ['Transfer domain'] if available

Step 3: VPC Associations (private zone)
- Select VPCs to associate

Step 4: Tags
- Key/Value pairs

Step 5: Review
- Domain: example.com
- Type: Public
- [Create hosted zone]

Step 6: Records (post-creation)
- [Create record]
  - Record name: [subdomain ▼]
  - Record type: [A ▼]
  - Value: [IP address]
  - TTL: [300 ▼]
  - Routing policy: Simple / Weighted / Latency / Failover / Geolocation
  - [Create records]
```

### 15.8 DynamoDB Table Creation Workflow

```
Step 1: Table Details
┌────────────────────────────────────────────────────────┐
│ Table name: [users-table_____]                         │
│ Partition key: [user_id ▼] [String ▼]                 │
│ Sort key: [created_at ▼] [String ▼] (optional)        │
│ ☐ Enable DynamoDB Auto Scaling                       │
│ ☐ Add index                                          │
└────────────────────────────────────────────────────────┘

Step 2: Settings
- Capacity mode: ○ On-demand (pay-per-request) ○ Provisioned
- Read capacity units: [5]
- Write capacity units: [5]
- ☐ Enable Auto Scaling
  - Min: [5] Max: [100]
  - Target utilization: [70%]

Step 3: Secondary Indexes
- [Create GSIs] — GSI name, partition key, sort key, projection
- [Create LSIs] — Local secondary indexes

Step 4: Tags
- Key/Value pairs

Step 5: Review
- Table: users-table
- Partition key: user_id (String)
- Capacity: On-demand
- [Create table]
```

### 15.9 ECS Cluster + Service Deployment Workflow

```
Step 1: Create Cluster
- Cluster name: [my-cluster______]
- Infrastructure:
  ○ AWS Fargate (serverless)
  ○ Amazon EC2 instances (select instance type)
  ○ External
- Container Insights: ☐ Enable

Step 2: Create Task Definition
- Family: [my-task-definition___]
- Launch type: Fargate / EC2
- OS/Architecture: Linux/X86_64
- CPU: [0.25 vCPU ▼]
- Memory: [0.5 GB ▼]
- Container definitions:
  - Name: [web-app]
  - Image URI: [123456.dkr.ecr.us-east-1.amazonaws.com/app:v1]
  - Port mappings: [80 ▼]
  - Environment variables: [KEY=VALUE]
  - Log configuration: awslogs group, region

Step 3: Create Service
- Service name: [my-service___]
- Task definition: [my-task-definition:1]
- Number of desired tasks: [3]
- Deployment type: ● Rolling update
- Load balancing:
  - ALB: [my-alb ▼]
  - Container: [web-app ▼]
  - Port: [80 ▼]
- Auto Scaling:
  - Min: [2] Max: [10]
  - Scaling policy: CPU [70%]
- [Create service]
```

### 15.10 CloudWatch Alarm Creation Workflow

```
Step 1: Specify metric and conditions
- Namespace: [EC2 ▼]
- Metric: [CPUUtilization ▼]
- Statistic: [Average ▼]
- Period: [5 minutes ▼]
- Conditions:
  - Threshold: [static ▼]
  - Whenever CPUUtilization is [greater than ▼] [80 ▼]

Step 2: Configure actions
- Alarm state trigger: [In alarm ▼]
- Send notification to: [SNS topic ▼] or [Create new topic]
- ☐ Auto Scaling policy (optional)

Step 3: Add name and description
- Alarm name: [high-cpu-alarm_______]
- Description: [Alarm when CPU exceeds 80%]

Step 4: Review and create
- Metric: EC2 → CPUUtilization > 80%
- Actions: Send to SNS topic "ops-alerts"
- [Create alarm]
```

### 15.11 CloudFormation Stack Creation Workflow

```
Step 1: Prepare template
- ○ Use a template → Upload a template file / Specify S3 URL
- ○ Create template in Designer

Step 2: Specify stack details
- Stack name: [my-stack______]
- Parameters: [Auto-populated from template]
  - InstanceType: [t3.micro ▼]
  - KeyName: [my-keypair ▼]
- ☐ Send notification to: [SNS topic ▼]
- ☐ Rollback on failure
- ☐ Enable termination protection
- ☐ IAM capability: [CAPABILITY_NAMED_IAM ▼]
- Tags: [Key=Value]

Step 3: Options
- Stack policy: [Upload]
- Rollback configuration: [Monitor] / [Advanced monitoring]

Step 4: Review
- Stack name, parameters, capabilities
- Estimated cost
- [Create stack]

Step 5: Events (live)
┌────────────────────────────────────────────────────────┐
│ Timestamp       │ Status      │ Resource              │
│ 2026-09-01 10:00│ CREATE_COMPLETE│ my-vpc              │
│ 2026-09-01 10:02│ CREATE_IN_PROGRESS│ my-subnet       │
│ 2026-09-01 10:05│ CREATE_COMPLETE│ my-subnet           │
│ 2026-09-01 10:06│ CREATE_IN_PROGRESS│ my-instance     │
└────────────────────────────────────────────────────────┘
```

### 15.12 Multi-Account Role Switching Workflow

```
Step 1: Click account menu → "Switch Role"
Step 2: Enter Role ARN or Account number
  - Account: [123456789012]
  - Role: [CrossAccountAdmin]
  - Display Name: [Production Account]
Step 3: [Switch Role]
Step 4: Console reloads with switched role context
  - Header shows "Switched to role: Production Account"
  - Region selector reflects target account
  - [Switch back] link in header
```

### 15.13 IAM Policy Creation (Visual Editor) Workflow

```
Step 1: Policy Editor Type
- ○ Visual editor
- ○ JSON

Step 2: Visual Editor
- [Select service ▼] → [EC2]
- Actions: ☑ All EC2 actions / ☐ Select specific actions
  - Read: ☑ DescribeInstances
  - Write: ☑ RunInstances
  - List: ☑ DescribeImages
- Resources: ☐ All resources / ☐ Add ARN
- Conditions: ☐ Add condition
  - Key: [aws:SourceIp]
  - Condition: [StringEquals]
  - Value: [10.0.0.0/8]

Step 3: Review
- Policy name: [ec2-readonly-internal______]
- Description: [EC2 read-only for internal IPs]
- JSON preview
- [Create policy]
```

### 15.14 S3 Bucket Policy Workflow

```
Step 1: Navigate to bucket → Permissions tab
Step 2: Bucket policy → Edit
Step 3: Policy editor (JSON)
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::my-bucket/*"
    }
  ]
}
Step 4: Save
Step 5: Test access
```

### 15.15 Cost Budget Creation Workflow

```
Step 1: Budget setup
- Budget type: [Cost budget ▼]
- Budget name: [monthly-budget______]
- Budgeted amount: [$1000 ▼]
- Time period: Monthly
- Budget effective dates: [Start date] → [End date]
- ☐ Include credits
- ☐ Include tax
- ☐ Include refunds

Step 2: Alerts
- Alert 1: [80%] of budgeted amount
  - [ ] Email ☑ SNS notification [topic ▼]
- Alert 2: [100%] of budgeted amount
  - [ ] Email ☑ SNS notification [topic ▼]

Step 3: Actions (optional)
- ☐ Auto-scale at 100% threshold
- ☐ Restrict IAM permissions at 100%

Step 4: Review
- Budget: $1,000/month
- Alerts: 80%, 100%
- [Create budget]
```

---

## 16. UI/UX Design System

### 16.1 Design System — AWS Amplify / Cloudscape

The AWS Console uses the **Cloudscape Design System** (formerly AWS Amplify UI / React Components).

#### Design Tokens

| Token | Light | Dark |
|-------|-------|------|
| Background Primary | `#ffffff` | `#0a0e14` |
| Background Secondary | `#f2f3f3` | `#161b22` |
| Background Layout | `#eaeded` | `#0d1117` |
| Border | `#aab7b8` | `#30363d` |
| Text Primary | `#000716` | `#e1e4e8` |
| Text Secondary | `#545b64` | `#8b949e` |
| Interactive Primary | `#0073bb` | `#58a6ff` |
| Interactive Hover | `#005ea2` | `#79c0ff` |
| Interactive Active | `#00477c` | `#58a6ff` |
| Status Error | `#d91550` | `#f85149` |
| Status Warning | `#ec7211` | `#d29922` |
| Status Success | `#1d8102` | `#3fb950` |
| Status Info | `#0073bb` | `#58a6ff` |

#### Typography
- Font Family: `Open Sans`, `Helvetica Neue`, sans-serif
- Font Size Scale: 12px, 14px, 16px, 20px, 24px, 32px
- Line Height: 1.5 (body), 1.2 (headings)

#### Spacing Scale
- xs: 4px
- s: 8px
- m: 16px
- l: 24px
- xl: 32px
- xxl: 48px

#### Border Radius
- Default: 8px
- Button: 4px
- Card: 8px
- Modal: 12px
- Input: 4px

### 16.2 Component Library

| Component | Description |
|-----------|-------------|
| Alert | Inline/status messages (error, warning, info, success) |
| Anchor | Clickable text link |
| Autocomplete | Text input with suggestions |
| Badge | Small count/label indicator |
| Breadcrumbs | Page navigation trail |
| Box | Layout primitive |
| Button | Primary/secondary/ghost buttons |
| Button Group | Grouped action buttons |
| Calendar | Date picker calendar |
| Cards | Content container with header/body/footer |
| Checkbox | Multi-select input |
| Code Editor | Monaco-based code editor |
| Collection | Dynamic list/grid |
| Column Layout | Multi-column layout |
| Date/Time Picker | Combined date/time selector |
| Flashbar | Global notifications |
| Form | Form container with validation |
| Form Field | Label + input + validation message |
| Header | Top navigation bar |
| Help Panel | Side panel with documentation |
| Icon | AWS icon set (200+ service icons) |
| Input | Text input field |
| Link | Clickable link |
| Modal | Dialog overlay |
| Multiselect | Multi-value dropdown |
| Navigable List | Keyboard-navigable list |
| Pagination | Page navigation |
| Popover | Tooltip-like popup |
| Progress Bar | Linear progress indicator |
| Radio Group | Single-select radio buttons |
| Select | Dropdown select |
| Side Navigation | Left sidebar navigation |
| Slider | Range slider input |
| Status Indicator | Colored status dot |
| Status Link | Link with status |
| Steps | Wizard step indicator |
| Table | Data table with sorting/filtering |
| Tabs | Tabbed content |
| Textarea | Multi-line text input |
| Tiles | Clickable tile grid |
| Toggle | On/off toggle switch |
| Token Group | Tag/token chips |
| Top Navigation | Top bar (alternative) |
| Tree View | Hierarchical tree |
| Wizard | Multi-step form wizard |

### 16.3 Layout Grid

```
┌────────────────────────────────────────────────────────┐
│                    12-column grid                       │
│                                                        │
│ ← sidebar (240px) →│←── content (fluid) ──→│         │
│                     │                       │          │
│  ┌───┬───┬───┬───┬─┼─┬───┬───┬───┬───┬───┬─┤         │
│  │ 1 │ 2 │ 3 │ 4 │5│6│ 7 │ 8 │ 9 │10 │11 │12│         │
│  └───┴───┴───┴───┴─┴─┴───┴───┴───┴───┴───┴─┘         │
│                                                        │
│  Breakpoints:                                          │
│  Mobile: < 768px  (1 column, no sidebar)              │
│  Tablet: 768-1024px (6 columns)                        │
│  Desktop: > 1024px (12 columns, sidebar visible)      │
└────────────────────────────────────────────────────────┘
```

### 16.4 Responsive Behavior
- **Desktop (1200px+):** Full sidebar + content area
- **Tablet (768-1200px):** Collapsible sidebar + content
- **Mobile (< 768px):** Bottom navigation or hamburger menu

---

## 17. Security & Compliance

### 17.1 Authentication Security
- MFA enforcement for root accounts
- IAM policy enforcement
- Session timeout controls
- Concurrent session limits
- Credential rotation reminders
- Access key age tracking

### 17.2 Authorization
- IAM policies (identity-based, resource-based)
- Service Control Policies (SCPs)
- Permission boundaries
- Session policies
- Resource-based policies
- Cross-account access controls

### 17.3 Data Protection
- TLS 1.2+ for all connections
- Console HTTPS only (no HTTP)
- Secure cookie storage
- No sensitive data in URL parameters
- Content Security Policy (CSP) headers
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff

### 17.4 Audit & Compliance
- CloudTrail integration (all API calls logged)
- CloudWatch Logs for console activity
- IAM Access Analyzer for unintended access
- AWS Config for compliance monitoring
- Security Hub for security posture
- Service control policies for guardrails

### 17.5 Console-Specific Security
- CSRF protection
- XSS prevention (output encoding)
- Input validation on all forms
- Rate limiting on API calls
- Clickjacking protection (frame-ancestors)
- Subresource Integrity (SRI) for third-party scripts
- No mixed content (HTTP/HTTPS)

---

## 18. Non-Functional Requirements

### 18.1 Performance
| Metric | Target |
|--------|--------|
| First Contentful Paint (FCP) | < 1.5s (P75) |
| Largest Contentful Paint (LCP) | < 2.5s (P75) |
| Cumulative Layout Shift (CLS) | < 0.1 |
| First Input Delay (FID) | < 100ms |
| Time to Interactive (TTI) | < 3.5s |
| Total page weight | < 2MB |
| API response time | < 500ms (P95) |
| Search results latency | < 1s |

### 18.2 Scalability
- Support 1M+ concurrent users
- Horizontal scaling via CDN + load balancers
- Service-specific API rate limiting
- Pagination for large resource lists (10,000+ items)
- Virtual scrolling for large tables

### 18.3 Availability
- 99.99% uptime SLA
- Graceful degradation when individual services are unavailable
- Static asset caching (CDN)
- Service health dashboard showing real-time status
- Automatic failover

### 18.4 Security
- SOC 2 Type II compliance
- ISO 27001 compliance
- PCI DSS compliance (for billing)
- HIPAA eligibility
- FedRAMP compliance (GovCloud)
- Data encryption at rest and in transit

### 18.5 Browser Support
| Browser | Version |
|---------|---------|
| Chrome | Last 2 versions |
| Firefox | Last 2 versions |
| Safari | Last 2 versions |
| Edge | Last 2 versions |
| Mobile Safari | iOS 14+ |
| Mobile Chrome | Android 10+ |

---

## 19. Accessibility

### 19.1 WCAG 2.1 AA Compliance
- Keyboard navigation for all interactive elements
- Focus management and visible focus indicators
- Screen reader support (ARIA labels, roles)
- Color contrast ratios (4.5:1 minimum)
- Alt text for all images
- Form labels and error descriptions
- Skip navigation links
- Reduced motion support
- High contrast mode

### 19.2 Keyboard Navigation
| Action | Shortcut |
|--------|----------|
| Search | `/` or `.` |
| Close modal | `Escape` |
| Navigate table rows | `Arrow Up/Down` |
| Select row | `Space` |
| Open row detail | `Enter` |
| Next page | `Arrow Right` |
| Previous page | `Arrow Left` |
| Go to service | `g` then `s` |
| Go to home | `g` then `h` |
| Go to billing | `g` then `b` |
| Go to IAM | `g` then `i` |

### 19.3 Screen Reader Support
- All tables have proper `<th>` headers
- All forms have associated `<label>` elements
- Live regions for dynamic content updates
- ARIA landmarks for page structure
- ARIA descriptions for complex widgets
- Role announcements for state changes

---

## 20. Internationalization (i18n)

### 20.1 Supported Languages

| Code | Language | Coverage |
|------|----------|----------|
| en | English | 100% |
| ja | Japanese | 100% |
| ko | Korean | 100% |
| zh-CN | Chinese (Simplified) | 100% |
| zh-TW | Chinese (Traditional) | 100% |
| fr | French | 100% |
| de | German | 100% |
| it | Italian | 100% |
| es | Spanish | 100% |
| pt-BR | Portuguese (Brazilian) | 100% |
| ru | Russian | 100% |
| tr | Turkish | 100% |
| ar | Arabic | 100% |
| hi | Hindi | 100% |
| th | Thai | 100% |
| vi | Vietnamese | 100% |
| id | Indonesian | 100% |
| pl | Polish | 100% |
| cs | Czech | 100% |
| hu | Hungarian | 100% |
| ro | Romanian | 100% |
| el | Greek | 100% |
| he | Hebrew | 100% |
| ms | Malay | 100% |
| tl | Filipino | 100% |
| sv | Swedish | 100% |
| no | Norwegian | 100% |
| da | Danish | 100% |
| fi | Finnish | 100% |
| nl | Dutch | 100% |
| uk | Ukrainian | 100% |

### 20.2 RTL Support
- Full right-to-left layout for Arabic, Hebrew
- Mirrored icons and navigation
- Correct text alignment

### 20.3 Locale-Specific Formatting
- Date formats (MM/DD/YYYY vs DD/MM/YYYY vs YYYY-MM-DD)
- Number formats (1,000.00 vs 1.000,00)
- Currency display
- Right-to-left number rendering

---

## 21. Integrations

### 21.1 AWS Service Integrations
| Integration | Purpose |
|------------|---------|
| CloudWatch | Monitoring, alarms, logs, metrics |
| CloudTrail | Audit logging, API activity |
| CloudFormation | IaC, stack management |
| Config | Compliance, resource tracking |
| IAM Identity Center | SSO, federation |
| Organizations | Multi-account management |
| Cost Explorer | Cost analysis |
| Service Quotas | Limit management |
| Health Dashboard | Service status |

### 21.2 External Integrations
| Integration | Purpose |
|------------|---------|
| GitHub | CodePipeline source |
| Jira | Issue tracking |
| Slack | Notifications |
| PagerDuty | Alert routing |
| Okta | SAML SSO |
| Azure AD | SAML SSO |
| Google Workspace | OIDC federation |

### 21.3 CLI/SDK Integration
- AWS CLI commands generated from console
- SDK code snippets for common operations
- CloudShell pre-configured with CLI
- Export configurations for CLI/SDK use

---

## 22. Analytics & Observability

### 22.1 Console Analytics
- Page view tracking (service, page, time on page)
- Feature usage tracking (button clicks, wizard completions)
- Search queries (what users search for)
- Error rates and types
- Performance metrics (load times, API latency)
- User flow analysis (entry points, exit points, conversion)

### 22.2 Observability Stack
- CloudWatch Logs for console application logs
- CloudWatch Metrics for performance monitoring
- X-Ray for distributed tracing
- Real User Monitoring (RUM)
- Error tracking and alerting

### 22.3 Key Metrics
| Metric | Description |
|--------|-------------|
| DAU/MAU | Daily/Monthly active users |
| Task completion rate | % of resource creation wizards completed |
| Time on task | Average time to complete common tasks |
| Search success rate | % of searches leading to navigation |
| Error rate | % of pages with JavaScript errors |
| Page load time | Average time to interactive |
| Support ticket correlation | Support tickets per console feature |

---

## 23. Metrics & KPIs

| KPI | Target | Measurement |
|-----|--------|-------------|
| Console Uptime | 99.99% | Synthetic monitoring |
| Page Load (P95) | < 3s | RUM |
| Task Completion Rate | > 90% | Analytics |
| Wizard Abandonment Rate | < 20% | Analytics |
| Search Success Rate | > 70% | Analytics |
| NPS (Net Promoter Score) | > 50 | Survey |
| Support Tickets (console-related) | Decreasing trend | Support data |
| Accessibility Score | 100% WCAG 2.1 AA | Audit |
| i18n Coverage | 100% | String coverage |
| Error Rate | < 0.1% | Monitoring |

---

## 24. Phased Rollout Plan

### Phase 1: Foundation (Months 1-3)
- [ ] Authentication system (Root, IAM, SSO)
- [ ] Console shell (header, sidebar, footer)
- [ ] Region selector
- [ ] Account menu
- [ ] Console Home / Dashboard
- [ ] Global search
- [ ] 5 core service consoles (EC2, S3, Lambda, RDS, VPC)

### Phase 2: Core Services (Months 4-6)
- [ ] IAM console (Users, Groups, Roles, Policies)
- [ ] Billing console
- [ ] 20 additional service consoles
- [ ] Resource creation wizards
- [ ] CloudWatch integration
- [ ] Notifications system

### Phase 3: Advanced Services (Months 7-9)
- [ ] 50+ service consoles
- [ ] CloudShell
- [ ] CloudFormation console
- [ ] Multi-account support
- [ ] Cost Explorer
- [ ] Advanced search (resource search)

### Phase 4: Complete Coverage (Months 10-12)
- [ ] All 200+ service consoles
- [ ] Full i18n support (26+ languages)
- [ ] Full accessibility audit
- [ ] Performance optimization
- [ ] Guided tours and tutorials
- [ ] Advanced features (export, CLI generation, history)

### Phase 5: Polish & Scale (Months 13-14)
- [ ] Performance tuning
- [ ] Security audit
- [ ] Load testing at scale
- [ ] Documentation
- [ ] Training materials
- [ ] Public launch

---

## 25. Risk Register

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| 200+ service consoles scope | High | High | Prioritize by usage, phased rollout |
| Performance at scale | High | Medium | CDN, caching, lazy loading |
| Browser compatibility | Medium | Medium | Cross-browser testing matrix |
| Security vulnerabilities | Critical | Low | Regular security audits, pen testing |
| Accessibility gaps | High | Medium | Automated + manual a11y testing |
| i18n quality | Medium | Medium | Native speaker review for all languages |
| API rate limiting | Medium | High | Client-side throttling, backoff |
| Feature parity gaps | High | High | Regular audits against real console |
| Mobile responsiveness | Medium | Medium | Mobile-first design approach |
| Third-party dependency | Medium | Low | Regular dependency updates |
| LocalStack vs. MiniStack behavioral drift (different error codes, pagination, response shapes for the same API) | High | High | Backend Adapter Layer normalization (§4.2); Appendix D parity matrix kept current; contract tests run against all backends in CI |
| Console silently shows "success" for an unsupported action (any backend) | Critical | Medium | Mandatory Appendix D §D.3 UI treatment; Goal G10; audit checklist in Appendix G explicitly tests this per feature |
| Real AWS target used carelessly (accidental deletes, real cost) | Critical | Medium | Appendix D §D.5 guardrails: target indicator, structural block on reset/seed, typed-confirmation for destructive actions, `ALLOW_REAL_AWS_TARGET` opt-in |
| Visual drift from real AWS Console over time (AWS ships UI updates; this console doesn't) | Medium | High | Scheduled reference-screenshot refresh + Appendix F visual regression baseline updates |

---

## 26. Glossary

| Term | Definition |
|------|-----------|
| **AMI** | Amazon Machine Image — pre-configured OS image for EC2 |
| **API Gateway** | Managed service for creating/operating APIs |
| **AR** | Architecture Record — documented decision |
| **ARIA** | Accessible Rich Internet Applications |
| **AWACS** | AWS Console Design System |
| **BFF** | Backend-for-Frontend — the console-backend service (§4) that fronts the three backend targets |
| **CIDR** | Classless Inter-Domain Routing |
| **CloudFormation** | AWS Infrastructure as Code service |
| **CloudTrail** | AWS API audit logging service |
| **CloudWatch** | AWS monitoring and observability service |
| **CLS** | Cumulative Layout Shift |
| **CSP** | Content Security Policy |
| **EC2** | Elastic Compute Cloud — virtual machines |
| **EBS** | Elastic Block Store — block storage |
| **ECS** | Elastic Container Service — container orchestration |
| **EKS** | Elastic Kubernetes Service — managed Kubernetes |
| **EFS** | Elastic File System — NFS storage |
| **FCP** | First Contentful Paint |
| **IAM** | Identity and Access Management |
| **i18n** | Internationalization |
| **LCP** | Largest Contentful Paint |
| **LocalStack** | Open-source/Pro local AWS cloud emulator exposing AWS-compatible APIs on `localhost:4566` |
| **MiniStack** | Lightweight local AWS-compatible emulator used as an alternate backend target for this console |
| **MFA** | Multi-Factor Authentication |
| **NPS** | Net Promoter Score |
| **Parity Matrix** | Appendix D's per-service table of what's Full/Partial/Mocked/Unsupported on each emulator |
| **RUM** | Real User Monitoring |
| **SCP** | Service Control Policy |
| **S3** | Simple Storage Service — object storage |
| **SSO** | Single Sign-On |
| **VRT** | Visual Regression Testing — automated pixel-diff comparison against reference screenshots |
| **VPC** | Virtual Private Cloud |
| **WCAG** | Web Content Accessibility Guidelines |

---

## Appendix A — Full Service Catalog

| Category | Service | Console Route |
|----------|---------|---------------|
| Compute | EC2 | `/console/ec2/v2/home` |
| Compute | Lambda | `/console/lambda/home` |
| Compute | ECS | `/console/ecs/v2/home` |
| Compute | EKS | `/console/eks/home` |
| Compute | Lightsail | `/console/lightsail/home` |
| Compute | App Runner | `/console/apprunner/home` |
| Compute | Batch | `/console/batch/home` |
| Compute | Elastic Beanstalk | `/console/elasticbeanstalk/home` |
| Compute | Outposts | `/console/outposts/home` |
| Storage | S3 | `/console/s3v3/home` |
| Storage | EBS | `/console/ec2v2/volume/home` |
| Storage | EFS | `/console/efs/home` |
| Storage | FSx | `/console/fsx/home` |
| Storage | Storage Gateway | `/console/storagegateway/home` |
| Storage | Backup | `/console/backup/home` |
| Storage | DataSync | `/console/datasync/home` |
| Storage | Snow Family | `/console/snow/home` |
| Database | RDS | `/console/rds/home` |
| Database | DynamoDB | `/console/dynamodbv2/home` |
| Database | ElastiCache | `/console/elasticache/home` |
| Database | MemoryDB | `/console/memorydb/home` |
| Database | Neptune | `/console/neptune/home` |
| Database | DocumentDB | `/console/docdb/home` |
| Database | Keyspaces | `/console/keyspaces/home` |
| Database | QLDB | `/console/qldb/home` |
| Database | Timestream | `/console/timestream/home` |
| Database | Redshift | `/console/redshiftv2/home` |
| Networking | VPC | `/console/vpcv2/home` |
| Networking | CloudFront | `/console/cloudfrontv3/home` |
| Networking | Route 53 | `/console/route53/v2/home` |
| Networking | API Gateway | `/console/apigateway/main` |
| Networking | ELB | `/console/ec2v2/loadbalancer/home` |
| Networking | Direct Connect | `/console/directconnect/home` |
| Networking | Global Accelerator | `/console/globalaccelerator/home` |
| Networking | Transit Gateway | `/console/vpc/home#transitGateways:` |
| Security | IAM | `/console/iamv2/home` |
| Security | Cognito | `/console/cognito/home` |
| Security | KMS | `/console/kms/home` |
| Security | Secrets Manager | `/console/secretsmanager/home` |
| Security | WAF | `/console/wafv2/home` |
| Security | Shield | `/console/wafv2/home#/shield/advanced` |
| Security | GuardDuty | `/console/guardduty/home` |
| Security | Inspector | `/console/inspector/v2/home` |
| Security | Detective | `/console/detective/home` |
| Security | Security Hub | `/console/securityhub/home` |
| Security | Macie | `/console/macie/home` |
| Security | Config | `/console/config/home` |
| Security | Certificate Manager | `/console/acm/home` |
| Security | CloudTrail | `/console/cloudtrailv2/home` |
| Security | IAM Identity Center | `/console/singlesignon/home` |
| ML | SageMaker | `/console/sagemaker/home` |
| ML | Bedrock | `/console/bedrock/home` |
| ML | Rekognition | `/console/rekognition/home` |
| ML | Comprehend | `/console/comprehend/home` |
| ML | Lex | `/console/lex/home` |
| ML | Personalize | `/console/personalize/home` |
| Analytics | Athena | `/console/athena/home` |
| Analytics | EMR | `/console/emr/home` |
| Analytics | Kinesis | `/console/kinesis/home` |
| Analytics | Glue | `/console/glue/home` |
| Analytics | Lake Formation | `/console/lakeformation/home` |
| Analytics | QuickSight | `/console/quicksight/home` |
| Analytics | OpenSearch | `/console/opensearch/home` |
| Analytics | Data Firehose | `/console/firehose/home` |
| Management | CloudWatch | `/console/cloudwatch/home` |
| Management | CloudFormation | `/console/cloudformation/home` |
| Management | Systems Manager | `/console/systems-manager/home` |
| Management | Service Catalog | `/console/servicecatalog/home` |
| Management | Control Tower | `/console/controltower/home` |
| Management | Trusted Advisor | `/console/trustedadvisor/home` |
| Management | AWS Health | `/console/health/home` |
| Integration | SQS | `/console/sqs/v2/home` |
| Integration | SNS | `/console/sns/v2/home` |
| Integration | EventBridge | `/console/events/home` |
| Integration | Step Functions | `/console/states/home` |
| Integration | AppSync | `/console/appsync/home` |
| Integration | MSK | `/console/msk/home` |
| Developer | CodeCommit | `/console/codecommit/home` |
| Developer | CodeBuild | `/console/codebuild/home` |
| Developer | CodeDeploy | `/console/codedeploy/home` |
| Developer | CodePipeline | `/console/codepipeline/home` |
| Developer | Cloud9 | `/console/cloud9/home` |
| Developer | X-Ray | `/console/xray/home` |
| Developer | CloudShell | `/console/cloudshell/home` |
| Mobile | Amplify | `/console/amplify/home` |
| Mobile | AppSync | `/console/appsync/home` |
| Mobile | Device Farm | `/console/devicefarm/home` |
| IoT | IoT Core | `/console/iot/home` |
| IoT | IoT Analytics | `/console/iotanalytics/home` |
| IoT | IoT Events | `/console/iotevents/home` |
| IoT | IoT SiteWise | `/console/iotsitewise/home` |
| IoT | IoT TwinMaker | `/console/iotwinmaker/home` |
| Containers | ECR | `/console/ecr/home` |
| Customer Eng. | Connect | `/console/connect/home` |
| Customer Eng. | Pinpoint | `/console/mobiletracker/home` |
| Customer Eng. | SES | `/console/ses/home` |
| Business | WorkMail | `/console/workmail/home` |
| Business | WorkSpaces | `/console/workspaces/home` |
| Business | AppStream | `/console/appstream2/home` |
| Migration | MGN | `/console/mgn/home` |
| Migration | DMS | `/console/dms/v2/home` |
| Migration | Transfer Family | `/console/transfer/home` |
| Migration | Migration Hub | `/console/migrationhub/home` |
| Migration | Refactor Spaces | `/console/refactor-spaces/home` |
| Cost Mgmt | Cost Explorer | `/console/costexplorer/home` |
| Cost Mgmt | Budgets | `/console/cbillingv2/home#/budgets` |
| Cost Mgmt | Billing Dashboard | `/console/billing/v2/home` |
| Cost Mgmt | Compute Optimizer | `/console/compute-optimizer/home` |
| Cost Mgmt | Savings Plans | `/console/savingsplans/home` |

---

## Appendix B — Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `/` or `.` | Open global search |
| `Escape` | Close modal/search |
| `Arrow Up/Down` | Navigate results |
| `Enter` | Select result |
| `Tab` | Next interactive element |
| `Shift+Tab` | Previous element |
| `g` then `s` | Go to Services |
| `g` then `h` | Go to Home |
| `g` then `b` | Go to Billing |
| `g` then `i` | Go to IAM |
| `g` then `c` | Go to CloudWatch |
| `g` then `f` | Go to CloudFormation |
| `?` | Show keyboard shortcuts |
| `Space` | Select table row |
| `F5` / `Cmd+R` | Refresh page |
| `Cmd/Ctrl+K` | Open command palette (alternative) |

---

## Appendix C — AWACS Design System

### C.1 Color Palette

#### Primary Colors
| Name | Hex | Usage |
|------|-----|-------|
| AWS Orange | `#FF9900` | AWS logo, primary brand |
| Navy | `#232F3E` | Header, sidebar dark |
| Dark Blue | `#131921` | Deep background |

#### Semantic Colors
| Name | Hex | Usage |
|------|-----|-------|
| Info Blue | `#0073BB` | Links, primary actions |
| Success Green | `#1D8102` | Success states |
| Warning Orange | `#EC7211` | Warnings |
| Error Red | `#D91550` | Error states |
| Text Primary | `#000716` | Body text |
| Text Secondary | `#545B64` | Subdued text |
| Background | `#FFFFFF` | Page background |
| Surface | `#F2F3F3` | Card background |
| Border | `#AAB7B8` | Dividers, borders |

### C.2 Icon System
- AWS service icons (200+ unique icons)
- Standard UI icons (navigation, actions, status)
- Icon sizes: 12px, 16px, 20px, 24px, 32px
- SVG-based, scalable, accessible

### C.3 Motion
- Transition duration: 200ms
- Easing: `ease-in-out`
- Reduced motion: respect `prefers-reduced-motion`
- Loading states: skeleton screens, spinners

### C.4 Elevation
- Level 0: No shadow (flat elements)
- Level 1: `0 1px 3px rgba(0,0,0,0.12)` (cards)
- Level 2: `0 4px 8px rgba(0,0,0,0.16)` (dropdowns)
- Level 3: `0 8px 16px rgba(0,0,0,0.20)` (modals)

---

## Appendix D — LocalStack, MiniStack & Real AWS — Multi-Backend Compatibility

### D.0 Why Real AWS Changes the Risk Profile

Everything in §0 assumed a purely local, disposable backend. **The moment real AWS becomes a selectable target, that assumption breaks**: resources cost real money, deletions are permanent, credentials are real, and compliance requirements (§17, §18.4) actually apply. This appendix treats real AWS as a **first-class but privileged** third target — supported, but never treated as casually as the two emulators.

### D.1 Purpose

Coverage and behavior differ across all three targets: LocalStack and MiniStack don't implement every action (varies by service/edition/version), and real AWS, while functionally complete, requires real permissions, real rate limits, and real safety handling that the emulators don't. This appendix makes support **and safety** a tracked requirement for all three, not an assumption.

### D.2 Endpoint & Credential Configuration

| Setting | LocalStack | MiniStack | Real AWS |
|---|---|---|---|
| Base endpoint | `http://localhost:4566` (single edge port) | `http://localhost:<service_port>` (per-service, confirm in MiniStack config) | `https://<service>.<region>.amazonaws.com` (real regional endpoints) |
| Default region | `us-east-1` (only region the emulator models) | `us-east-1` | Whatever the user's real account/profile targets — full region list (§14.2) |
| Credentials | Any non-empty dummy `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY` (e.g. `test`/`test`) | Same pattern, confirm MiniStack docs | **Real** credential chain only: named profile, SSO session, or env vars the developer already has — the app must never generate, store, or paste in credentials on this path |
| Health check | `GET /_localstack/health` | Confirm MiniStack's health endpoint | AWS Health API / STS `GetCallerIdentity` as a lightweight "are we actually authenticated" probe |
| SDK-level config | `endpoint_url` override on every SDK client | Same pattern | No endpoint override — standard SDK regional resolution, real SigV4 signing against the real service |

### D.3 Required UI Treatment for Unsupported / Partial Features

Mandatory for all three targets, not just the emulators:

1. **Fully supported** → behaves exactly as specified elsewhere in this PRD.
2. **Partially supported** (emulator accepts the call but ignores a sub-option; or on real AWS, the signed-in identity lacks permission for a sub-option) → the affected field/option shows an "ⓘ Limited support on \<active target\>" hint sourced from the live parity matrix (D.4), and never silently no-ops.
3. **Unsupported** → the control is disabled (not hidden) with a tooltip: *"Not available on \<active target\>. See Appendix D."* Never reachable in a way that produces a false success state.
4. **Errored at runtime** (target returned an error though the matrix says "Supported" — e.g., a real `AccessDenied` or `Throttling` from AWS) → surfaced via the standard Flashbar/Alert pattern (§16.2) with the raw error available in an expandable "Details" section, never swallowed. On real AWS this includes surfacing the real IAM error message verbatim so the developer can actually fix their permissions.

Goal **G10** (zero silent failures) applies identically to real AWS — a permissions failure that gets swallowed is just as much a defect as an emulator gap being swallowed.

### D.4 Service Parity Matrix (Template — Fill In & Keep Current)

Living document (e.g., `BACKEND_PARITY.md`, linked from here), re-verified whenever pinned LocalStack/MiniStack versions bump, or when the console's IAM permission requirements against real AWS change.

| Service | LocalStack | MiniStack | Real AWS | Console features affected | Last verified |
|---|---|---|---|---|---|
| S3 | Full / Partial / Unsupported | Full / Partial / Unsupported | Full (subject to IAM perms) | e.g., bucket creation, versioning, static hosting | YYYY-MM-DD |
| EC2 | … | … | … | … | … |
| Lambda | … | … | … | … | … |
| DynamoDB | … | … | … | … | … |
| IAM | … | … | … | … | … |
| VPC | … | … | … | … | … |
| *(one row per service actually shipped)* | | | | | |

**Rule:** a service must not appear as a clickable item in the sidebar/service catalog (§7, Appendix A) until it has a row here for **every backend the build supports**, with at least "Partial" support and a corresponding D.3 UI treatment for its gaps.

### D.5 Real-AWS Safety Guardrails (Mandatory, Non-Negotiable)

These exist because a mistake against a real account is not undoable the way a mistake against LocalStack/MiniStack is. All of the following are **hard requirements**, enforced in code (e.g., a NestJS Guard per §4.3 or equivalent middleware) — not conventions developers are trusted to remember:

1. **Persistent, unmissable target indicator.** A banner/badge always visible in the console header (§14.1) showing the active backend. When `ACTIVE_BACKEND=aws`, it must use distinct, high-salience styling (not the same quiet gray used for LocalStack/MiniStack) and show the real account ID/alias — the real AWS console doesn't need this, but this hybrid tool does, specifically to prevent someone acting on prod while thinking they're local.
2. **Structural block on destructive dev tooling.** The Appendix E.3 "Reset local environment" action, any auto-seed script, and any `CONSOLE_RESET_ON_START`-style flag must be **hard-coded incapable** of executing when `ACTIVE_BACKEND=aws` — not just hidden in the UI, but rejected server-side if somehow invoked (e.g., via direct API call).
3. **Extra confirmation for destructive resource actions on real AWS.** Terminate/Delete/Force-actions (§10.4) must require typing the resource's name/ID to confirm when the target is real AWS — the emulators can use the lighter single-click-confirm pattern already implied elsewhere in this PRD.
4. **No invented cost estimates presented as real.** The wizard cost-estimation feature (§10.1) is illustrative against emulators; against real AWS it must either use real AWS Pricing API data or be clearly labeled as an estimate with a link to the real pricing page — never presented as an authoritative real charge.
5. **Credential handling never touches disk in plaintext beyond what the AWS CLI/SDK's own credential chain already does.** The console backend must not implement its own credential store for the AWS target — it defers entirely to the standard AWS credential resolution the developer already trusts (profiles, SSO cache, environment).
6. **Rate limiting / backoff is mandatory for the AWS target** (ties to §18.2) since real AWS enforces real API throttling that the emulators mostly don't.
7. **The AWS target should be opt-in per environment**, e.g., gated by an explicit `ALLOW_REAL_AWS_TARGET=true` flag at deploy/build time, so a console instance meant purely for local dev can't accidentally be pointed at a real account by a stray env var typo.

Appendix G's audit (specifically G.2 Phase 5) must exercise **all three backends**, and every D.5 rule gets its own row in the audit checklist — these are exactly the kind of "looks like it works" gaps that Appendix G.2's internal-logic audit exists to catch.

---

## Appendix E — Local Development Environment & DevOps

### E.1 Required Local Stack

```
docker-compose.yml
├── console-frontend      (this app — Next.js/React dev server)
├── console-backend       (NestJS BFF / Service Router / Backend Adapter Layer — §4.3)
├── localstack             (localstack/localstack image, edge port 4566)
└── ministack               (MiniStack image, per its own docs)

# Real AWS is never a docker-compose service — it's an external target
# reached via the developer's own AWS credential chain (see E.2).
```

### E.2 Environment Variables (Minimum Set)

| Variable | Purpose | Example |
|---|---|---|
| `ACTIVE_BACKEND` | Which target is active: `localstack` \| `ministack` \| `aws` | `localstack` |
| `ALLOW_REAL_AWS_TARGET` | Must be explicitly `true` for `ACTIVE_BACKEND=aws` to be accepted at all (Appendix D.5 rule 7) | `false` |
| `LOCALSTACK_ENDPOINT` | Base URL for LocalStack | `http://localhost:4566` |
| `MINISTACK_ENDPOINT` | Base URL for MiniStack | `http://localhost:5000` |
| `AWS_DEFAULT_REGION` | Region passed to SDK clients (emulators: fixed to `us-east-1`; AWS: real region) | `us-east-1` |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | **Emulator targets only** — dummy local credentials | `test` / `test` |
| `AWS_PROFILE` | **Real AWS target only** — named profile from the developer's own `~/.aws/credentials`/SSO config; never set alongside dummy keys | `my-sso-profile` |
| `CONSOLE_SEED_DATA` | Auto-seed demo resources on startup — **emulator targets only**, structurally disabled when `ACTIVE_BACKEND=aws` | `true` |
| `CONSOLE_RESET_ON_START` | Wipe emulator state between runs — **emulator targets only**, structurally disabled when `ACTIVE_BACKEND=aws` | `false` |

### E.3 Data Seeding & Reset

- A seed script must create a small, realistic starter dataset per shipped service (e.g., one VPC, one S3 bucket, one Lambda function) so the console never opens to an entirely empty state during demos/dev **against LocalStack or MiniStack**.
- A one-click "Reset local environment" action (developer-only, gated behind a dev-mode flag, **never shown in a build meant to look production-like**) wipes and re-seeds emulator state. Per Appendix D.5 rule 2, this action must be structurally incapable of running when `ACTIVE_BACKEND=aws` — checked server-side, not just hidden client-side.
- Persistence across container restarts is opt-in via the emulator's own volume mounts; document the exact mount paths for both LocalStack (`/var/lib/localstack`) and MiniStack (confirm its path) in the repo README, not just here. Not applicable to the real AWS target — its state is simply whatever is actually in the account.

### E.4 Switching Backends at Runtime

- `ACTIVE_BACKEND` should be switchable without a full rebuild — a restart of the console-backend container is acceptable, a full frontend rebuild is not.
- Consider an optional developer-facing toggle in Console Settings (§13) — visible only in dev builds — to swap between the two emulators for side-by-side manual comparison. **Do not** expose a one-click in-UI toggle *into* the real AWS target from an emulator session; switching to `ACTIVE_BACKEND=aws` should require a deliberate restart with `ALLOW_REAL_AWS_TARGET=true` set, precisely so it can't happen by an accidental click (Appendix D.5 rule 7).

---

## Appendix F — Pixel-Perfect Fidelity & Hardening Rules

"Pixel-perfect" is only meaningful if it's measurable. This section turns it into engineering rules with a pass/fail bar, not a vibe.

### F.1 Source of Truth

- Every screen this console implements must have a **reference screenshot** captured from the real AWS Management Console (same viewport size, same theme — light and dark) stored under `/design-reference/<service>/<page>.png`, versioned in the repo.
- Copy text (labels, button text, help text, error messages) must be **transcribed verbatim** from the real console, not paraphrased. Any place the team can't verify exact copy must be flagged `TODO-VERIFY-COPY` rather than guessed.

### F.2 Hardening Rules (Non-Negotiable)

1. **Colors** — only the hex values in Appendix C §C.1 / §16.1 design tokens may be used. No inline one-off colors. A lint rule (e.g., stylelint custom rule or CSS-var enforcement) must fail the build on a raw hex value outside the token file.
2. **Spacing** — only the spacing scale in §16.1 (`4/8/16/24/32/48px`) may be used for margin/padding. No arbitrary pixel values.
3. **Typography** — font family, size scale, and line-height must come from §16.1 tokens only.
4. **Icons** — use the actual AWS service icon set (or a pixel-faithful redrawn equivalent) at the exact sizes in §16.1/§C.2 (12/16/20/24/32px). No generic icon-library substitutes for AWS service icons.
5. **Component states** — every interactive component must implement **all five states** (default, hover, focus-visible, active/pressed, disabled) matching the real console's visual treatment for each, not just default+hover.
6. **Empty / loading / error states** — every table, list, and detail page must implement its own empty state, skeleton-loading state, and error state (never a bare blank screen or a generic browser error).
7. **Motion** — 200ms `ease-in-out` transitions per §C.3; respect `prefers-reduced-motion`.
8. **No layout shift on data load** — skeletons must reserve the same footprint as the loaded content (ties to CLS target in §18.1).

### F.3 Visual Regression Testing (VRT) Process

- Every shipped page/component gets an automated screenshot test (e.g., Playwright + pixel-diff, or Chromatic/Percy) comparing the built UI against the Appendix F.1 reference image.
- **Tolerance:** ≤ 0.1% pixel difference for static chrome (header, sidebar, footer); ≤ 1% for data-bearing regions (tables/charts, since seed data varies) — document the exact threshold used in the VRT tool's config, and treat any looser threshold as a defect to fix, not the baseline to accept.
- VRT runs in CI on every PR touching UI code; a failing diff blocks merge unless a human explicitly approves the new baseline (with the PR explaining *why* the real AWS console reference changed).
- New/changed screens are not "done" until they have a VRT baseline — see Appendix H's Definition of Done.

---

## Appendix G — Codebase Audit Protocol & Feature Completeness Checklist

### G.1 Purpose & Ground Rules

This is the process for auditing an **existing** console codebase against this PRD. It is explicitly **not** a file-existence check. A feature "having a file" (e.g., `S3BucketList.tsx` exists) tells you almost nothing — the audit must open that file and verify the internal logic actually does what §5–§16 and Appendices D–F require. Run this audit:

- Before marking any Feature ID (§5.1) as "done" in the rollout plan (§24)
- After any significant refactor
- On a recurring cadence (e.g., before each release) to catch drift

**Audit posture:** assume nothing works until verified. A checklist row with a checked file but unverified logic is marked **UNVERIFIED**, not **PASS**.

### G.2 Five-Phase Audit Process

**Phase 1 — Route & Inventory Audit**
For every row in Appendix A's service catalog and every Feature ID in §5.1: confirm the route actually resolves in the running app (not a 404/placeholder), and record the file(s) that implement it.

**Phase 2 — Internal Logic Audit (the part most audits skip)**
For each feature, open the actual component/hook/API-handler code and check, line by line:
- Is state actually managed (React state/store), or is the UI static/hardcoded mock data pretending to be dynamic?
- Does every button/action actually call the Service Router → Backend Adapter (§4.2), or does it call nothing / call a stub / call a `console.log`?
- Are loading, empty, and error states *implemented in code* (not just described in a comment), per Appendix F.2 rule 6?
- Does form validation in wizards (§10.1) actually run and block submission on invalid input, or is the asterisk (*) purely cosmetic?
- Does the "Review" step of every wizard (§15.x workflows) actually reflect the live values the user entered, or hardcoded placeholder text?
- Do bulk table actions (§10.2) operate on the actual selected rows, or on a fixed test set?
- Is tag editing (§10.1, §10.3) actually persisted back through the emulator, or only held in local component state and lost on refresh?
- For every action gated by Appendix D §D.3 — is the disabled/limited/error treatment actually implemented, or does the button just silently do nothing / silently succeed? **This check is mandatory for every feature, not a sample.**

**Phase 3 — Visual Fidelity Audit**
Run the Appendix F.3 VRT suite; also manually diff against the Appendix F.1 reference screenshots for anything without automated coverage yet. Confirm Appendix F.2 hardening rules (tokens-only colors/spacing/typography, all five component states) by inspecting rendered CSS/computed styles, not just the design file.

**Phase 4 — Accessibility Audit**
Run an automated scan (e.g., axe-core) on every page, then manually keyboard-navigate every wizard and table per §19.2's shortcut table, confirming focus order and screen-reader labeling per §19.3 — not just "an ARIA attribute exists somewhere."

**Phase 5 — Backend Compatibility Audit**
For every feature, actually exercise it against **every backend the build supports** — LocalStack and MiniStack always, real AWS if `ALLOW_REAL_AWS_TARGET` is enabled for that environment (switch via Appendix E.4) — and confirm behavior matches the current Appendix D.4 parity matrix row. On the real AWS pass, also explicitly re-verify every Appendix D.5 safety guardrail (target indicator visible, reset/seed actions structurally blocked, destructive actions require typed confirmation) — do not skip this because "it's just AWS, it obviously works"; the guardrails are what's actually being audited, not the raw API call. Update the matrix if reality has drifted from what's documented.

### G.3 Per-Feature Checklist (Copy This Table Into an `AUDIT_REPORT.md` and Fill One Row Per Feature)

| Feature ID / Route | File(s) located | P1: Route resolves | P2: Real logic (not mock/stub) | P2: Wired to Backend Adapter | P2: Loading/empty/error states implemented | P2: D.3 gap-handling implemented (if applicable) | P3: VRT pass | P3: Hardening rules (tokens/states) pass | P4: Accessibility pass | P5: Verified on LocalStack | P5: Verified on MiniStack | P5: Verified on real AWS (if applicable) + D.5 guardrails intact | Overall status | Notes / gaps found |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| F-001 Authentication | | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | PASS/FAIL/UNVERIFIED | |
| F-006 EC2 Console | | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | | |
| *(one row per Feature ID in §5.1, plus one row per major workflow in §15)* | | | | | | | | | | | | | |

**Status rule:** a row can only be **PASS** if every applicable checkbox is checked. Anything with even one unchecked applicable box is **FAIL** (if verified broken/missing) or **UNVERIFIED** (if not yet audited) — never mark PASS on partial evidence.

### G.4 Remediation Backlog

Every FAIL/UNVERIFIED row from G.3 becomes a tracked backlog item with: the specific gap (quote the exact missing logic, not "needs work"), the PRD section it violates, and severity (Critical = silent-failure/G10 violations and security issues; High = feature doesn't work at all; Medium = visual/hardening drift; Low = copy/microcopy mismatch). Critical and High items block release per Appendix H's Definition of Done.

### G.5 Hardening Rules for the Audit Itself

- Never accept "it compiles" or "the file exists" as evidence of completion.
- Never accept a screenshot of the happy path as evidence a feature is done — the empty/loading/error/unsupported states must be shown too.
- Re-run Phase 5 (emulator audit) after *any* dependency bump of LocalStack or MiniStack versions, since parity can regress silently.
- Audit findings must reference exact file + line, not just a feature name, so fixes are traceable.

---

## Appendix H — Testing Strategy & Definition of Done

### H.1 Test Pyramid

| Layer | Scope | Tooling (suggested) | Runs |
|---|---|---|---|
| Unit | Component logic, validators, formatters | Jest/Vitest + React Testing Library | Every commit |
| Integration | Wizard flows, table actions calling the Backend Adapter (mocked, or against a real ephemeral LocalStack/MiniStack container) | Jest/Vitest + MSW or a spun-up LocalStack/MiniStack container | Every PR |
| Contract | Backend Adapter's normalized request/response shapes vs. LocalStack, MiniStack, **and** real AWS (against a disposable sandbox account, never a shared/prod account) | Custom contract tests per Appendix D.4 | Every PR + on emulator/SDK version bump |
| E2E | Full user workflows (§15.1–§15.15) against a live LocalStack **and** a live MiniStack instance in CI | Playwright/Cypress | Nightly + pre-release |
| Visual Regression | Per Appendix F.3 | Playwright pixel-diff / Chromatic / Percy | Every PR touching UI |
| Accessibility | Per §19, Appendix G Phase 4 | axe-core (automated) + manual pass | Every PR (automated) + pre-release (manual) |

### H.2 Definition of Done (Per Feature)

A feature is **Done** only when **all** of the following are true — this is the release gate, and mirrors the Appendix G.3 checklist so audit and delivery use the same bar:

- [ ] Implemented against the real Backend Adapter (§4.2), not mock data
- [ ] Loading, empty, and error states implemented (Appendix F.2 rule 6)
- [ ] Appendix D §D.3 gap-handling implemented for any unsupported sub-feature, on every backend the build supports
- [ ] Passes VRT within the Appendix F.3 tolerance on both light and dark theme
- [ ] Passes automated accessibility scan with zero critical/serious violations
- [ ] Manually verified against LocalStack **and** MiniStack; against real AWS too if the build enables that target, including a re-check of every Appendix D.5 guardrail
- [ ] Unit + integration tests written and passing
- [ ] Copy text verified against real AWS console source (Appendix F.1) or flagged `TODO-VERIFY-COPY` and tracked
- [ ] Row added/updated in Appendix D.4 parity matrix and Appendix G.3 audit table

### H.3 Release Gate

A release may ship with **Medium/Low** severity backlog items open (Appendix G.4), but **zero open Critical or High** items, and the Appendix G audit must have been run in full within the current release cycle — not carried over stale from a prior one.

---

**END OF DOCUMENT**

*This PRD covers the complete scope of the AWS Management Console application — including all features, workflows, design specifications, accessibility requirements, non-functional requirements, LocalStack/MiniStack emulator integration, pixel-perfect hardening rules, and the mandatory codebase audit protocol — needed to build and continuously verify a faithful, emulator-backed local replica of the original AWS web console.*
