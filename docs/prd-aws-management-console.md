# AWS Management Console — Product Requirements Document (PRD)

> **Version:** 1.0  
> **Last Updated:** September 2026  
> **Document Owner:** Product Engineering Team  
> **Status:** Active

---

## Table of Contents

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
│                     AWS CONSOLE BACKEND                          │
│  ┌────────────┐  ┌──────────────┐  ┌──────────────┐            │
│  │  Console    │  │  API Gateway │  │  IAM/Auth    │            │
│  │  Service    │  │  (REST/gRPC) │  │  Service     │            │
│  │  Proxy      │  │              │  │              │            │
│  └──────┬─────┘  └──────┬───────┘  └──────────────┘            │
│         │               │                                        │
│         ▼               ▼                                        │
│  ┌──────────────────────────────────────────────┐               │
│  │         AWS Service API Endpoints            │               │
│  │  EC2 | S3 | Lambda | RDS | DynamoDB | ...    │               │
│  └──────────────────────────────────────────────┘               │
└──────────────────────────────────────────────────────────────────┘
```

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

---

## 26. Glossary

| Term | Definition |
|------|-----------|
| **AMI** | Amazon Machine Image — pre-configured OS image for EC2 |
| **API Gateway** | Managed service for creating/operating APIs |
| **AR** | Architecture Record — documented decision |
| **ARIA** | Accessible Rich Internet Applications |
| **AWACS** | AWS Console Design System |
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
| **MFA** | Multi-Factor Authentication |
| **NPS** | Net Promoter Score |
| **RUM** | Real User Monitoring |
| **SCP** | Service Control Policy |
| **S3** | Simple Storage Service — object storage |
| **SSO** | Single Sign-On |
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

**END OF DOCUMENT**

*This PRD covers the complete scope of the AWS Management Console application, including all features, workflows, design specifications, accessibility requirements, and non-functional requirements needed to build a faithful replica of the original AWS web console.*
