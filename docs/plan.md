# Implementation Plan — AWS Console 100% Clone + LocalStack Adapter

**Version:** 1.0.0  
**Status:** Full Production Plan (Zero Stubs / Zero Deferred / Zero "Later")  
**Source Rules:** `AGENTS.md`, `.opencode/rules.md`, `.claude/CLAUDE.md`, `opencode.json`, `https://opencode.ai/docs/rules/`  
**Reference Documents:** `docs/requirements.md`, `docs/design.md`, `docs/prd-aws-management-console.md`, `docs/minstack-localstack-common-different.md`, `src/constants/service-compatibility.ts`, `.env.local`

---

## Plan References & Instructions (How to Execute)

- Read `docs/requirements.md` first (scope / feature parity / 150 services / adapter requirements).
- Read `docs/prd-aws-management-console.md` second (feature IDs F-001 to F-035, service catalog Appendix A, workflow steps Section 15, design tokens Section 16, accessibility Section 19, security Section 17, i18n Section 20).
- Read this file (`docs/plan.md`) third (phases / tasks / sub-tasks / milestones / quality gates).
- Before writing any code, read `AGENTS.md`, `.opencode/rules.md`, `.claude/CLAUDE.md`.
- Check `src/constants/service-compatibility.ts` for adapter status (FULL / PARTIAL / NOT_SUPPORTED) per service.
- Check `docs/minstack-localstack-common-different.md` for common vs different service names.
- Every phase must pass quality gates before starting the next phase (no stubs, no deferred work).

---

## Plan Strategy & Principles

This plan defines the complete, phased implementation of the AWS Web Console clone backed by a universal LocalStack / MinStack adapter. Each phase contains fully defined tasks; there are no placeholder tasks, no partial implementations, and no deferred features.

Every task follows the agent rules established in `AGENTS.md`:
- Constants, enums, interfaces, types: separate reusable files (`constants/`, `types/`, `enums/`).
- Reusable logic extracted to `utils/`, `hooks/`, `services/`.
- DRY enforced; no duplicate adapter initialization, no duplicate SDK clients.
- TypeScript strict mode; no `any`.
- Before writing code, search existing patterns in `src/lib/`, `src/hooks/`, `src/services/`.

---

## Dependency Graph (Phase Order)

```
Phase 1 (Foundation + Adapter + Auth)
      │
      ▼
Phase 2 (EC2 Full Feature Set — Instances, Volumes, SG, ELB, Key Pairs, AMI)
      │
      ▼
Phase 3 (Storage + Serverless — S3, Lambda, ECR, EFS)
      │
      ▼
Phase 4 (Database + Security — RDS, DynamoDB, IAM, KMS, Secrets Manager)
      │
      ▼
Phase 5 (Networking + Monitoring — VPC Full, CloudFront, Route 53, CloudWatch, CloudTrail, Config)
      │
      ▼
Phase 6 (Management + Integration — EventBridge, CloudFormation, SSM, AppSync, Cognito)
      │
      ▼
Phase 7 (Global UI + Production Hardening — Search, Notifications, Dashboard, E2E, Performance)
```

---

## Phase 1: Foundation + Adapter + Auth (Complete, Not MVP)

**Objective:** Build the universal adapter layer, endpoint configuration, user authentication flow (dummy/local), adapter status monitoring, and basic app layout. This phase must be fully complete before any service-specific work begins.

**Duration Estimate:** 5-7 days  
**Deliverables:** Fully working `localstack` adapter; all SDK clients route through adapter; `AGENTS.md` rules enforced in new adapter files; `.opencode/rules.md` and `.claude/CLAUDE.md` updated.

### Phase 1 Tasks

**Task 1.1: Adapter Core Architecture (`src/lib/localstack-adapter/`)**

| Sub-Task | Description | Files Created / Modified | Acceptance Criteria |
|---|---|---|---|
| 1.1.1 | Create adapter factory (`index.ts`) that exports a function to initialize middleware for any AWS SDK v3 client. | `src/lib/localstack-adapter/index.ts` | Factory accepts SDK client instance; returns wrapped client with adapter middleware. Types in `types/`. |
| 1.1.2 | Implement `request-mapper.ts`: reads SDK `HttpRequest`, rewrites hostname/port based on endpoint config; translates action names to LocalStack REST paths for query-based clients; passes REST-JSON clients directly. | `src/lib/localstack-adapter/request-mapper.ts` | All 98 SDK clients mapped correctly; tests verify endpoint rewrite for `ec2`, `s3`, `lambda`, `iam`. |
| 1.1.3 | Implement `response-normalizer.ts`: parses LocalStack response (JSON/XML), constructs SDK-compatible `HttpResponse` with same status/headers; passes payload through unchanged unless field mapping required. | `src/lib/localstack-adapter/response-normalizer.ts` | SDK parser accepts response for `DescribeInstances`, `ListBuckets`, `GetFunction`, `GetUser`. |
| 1.1.4 | Implement `auth-injector.ts`: injects dummy credentials (`test`/`test`) and region; reads from `.env.local` / user settings. | `src/lib/localstack-adapter/auth-injector.ts` | Credentials always present in adapter requests; configurable via `ADAPTER_CONFIG`. |
| 1.1.5 | Implement `endpoint-resolver.ts`: resolves `LOCALSTACK_HOSTNAME`, `LOCALSTACK_EDGE_PORT`, `LOCALSTACK_SSL_ENABLED`, `AWS_DEFAULT_REGION`, `ADAPTER_MODE`. | `src/lib/localstack-adapter/endpoint-resolver.ts` | Reads from `.env.local` and user settings store; defaults set correctly. |

**Task 1.2: SDK Client Factory (`src/lib/sdk-factory.ts`)**

| Sub-Task | Description | Files Created / Modified | Acceptance Criteria |
|---|---|---|---|
| 1.2.1 | Create factory that exports pre-configured SDK clients for all 98 installed clients, using adapter middleware. | `src/lib/sdk-factory.ts` | Every installed client (`client-ec2`, `client-s3`, etc.) has a factory function. |
| 1.2.2 | Create `src/lib/sdk-adapter-middleware.ts`: universal middleware that wraps SDK `HttpHandler`. | `src/lib/sdk-adapter-middleware.ts` | Middleware applies to all clients; can be disabled (`ADAPTER_MODE=real`). |

**Task 1.3: Adapter Configuration & Environment (`.env.local`, `src/config/adapter-config.ts`)**

| Sub-Task | Description | Files Created / Modified | Acceptance Criteria |
|---|---|---|---|
| 1.3.1 | Create `.env.local` with adapter settings (`LOCALSTACK_HOSTNAME=localstack`, `LOCALSTACK_EDGE_PORT=4566`, `ADAPTER_MODE=localstack`). | `.env.local` | File created; `.gitignore` excludes `.env` but includes `.env.local` template. |
| 1.3.2 | Create `src/config/adapter-config.ts` exporting typed config object. | `src/config/adapter-config.ts` | Type-safe config; no `any`; exports interface in `types/`. |

**Task 1.4: Adapter Status & Health Check (`src/components/AdapterStatus/` + `docker-compose.yml` updates)**

| Sub-Task | Description | Files Created / Modified | Acceptance Criteria |
|---|---|---|---|
| 1.4.1 | Create `AdapterStatus` component showing adapter connection status (`connected`, `disconnected`, `checking`). | `src/components/AdapterStatus/AdapterStatus.tsx` | Component uses Cloudscape `StatusIndicator`; updates based on health check. |
| 1.4.2 | Implement health check endpoint (`/api/health`) in `src/app/api/health/route.ts`. | `src/app/api/health/route.ts` | Returns adapter status; checks `LOCALSTACK_HOSTNAME:4566/_localstack/health`. |
| 1.4.3 | Extend `docker-compose.yml` with `localstack` and `localstack-health` services (see `design.md` section 9.1). | `docker-compose.yml` | Services defined; ports mapped; health check command included. |

**Task 1.5: App Layout & Navigation Foundation (`src/app/layout.tsx`, `src/app/page.tsx`)**

| Sub-Task | Description | Files Created / Modified | Acceptance Criteria |
|---|---|---|---|
| 1.5.1 | Update root layout (`src/app/layout.tsx`) to include `AppLayout` (Cloudscape) with `Navigation` sidebar, `Content` area, `Header`, `Footer`. | `src/app/layout.tsx` | Layout includes navigation; no stub components; uses `Cloudscape` components exactly. |
| 1.5.2 | Update root page (`src/app/page.tsx`) to show service selection dashboard (cards for each service group). | `src/app/page.tsx` | Dashboard cards for EC2, S3, Lambda, IAM, RDS, VPC, CloudWatch, etc. |

**Task 1.6: Adapter Tests (Unit — Full Coverage)**

| Sub-Task | Description | Files Created / Modified | Acceptance Criteria |
|---|---|---|---|
| 1.6.1 | Create adapter tests (`src/lib/localstack-adapter/*.test.ts`) covering endpoint rewrite, response normalization, auth injection, error mapping. | Test files | Coverage > 90% for adapter layer; no stubs (`skip` or `todo` not allowed unless fully implemented elsewhere). |

---

## Phase 2: EC2 Full Feature Set (Complete)

**Objective:** Implement 100% feature parity for all existing EC2 service routes (see `docs/requirements.md` section 2.1). Every EC2 page must match AWS console layout, actions, and behavior.

**Duration Estimate:** 10-12 days  
**Deliverables:** Complete EC2 service (instances, volumes, SG, load balancers, key pairs, AMI, VPC endpoints, placement groups, dedicated hosts, etc.).

### Phase 2 Tasks

**Task 2.1: EC2 Instance Full Lifecycle**

| Sub-Task | Description | Files Created / Modified | Acceptance Criteria |
|---|---|---|---|
| 2.1.1 | Create `EC2InstanceTable` component (`src/components/ec2/EC2InstanceTable.tsx`) with exact AWS table columns. | Component file | Columns: Name, Instance ID, Type, State, Status Checks, AZ, Public IP, VPC, Subnet, SG, Launch Time. Filtering/sorting/pagination complete. |
| 2.1.2 | Create `EC2LaunchWizard` (`src/components/ec2/EC2LaunchWizard.tsx`) — full wizard matching AWS step flow (AMI, Type, Config, Storage, Tags, SG, Key Pair, Review). | Component file | All wizard steps complete; validation complete; preview shows instance config. |
| 2.1.3 | Implement `useEC2Service()` hook (`src/hooks/useEC2Service.ts`) using adapter SDK factory for all instance actions (`RunInstances`, `DescribeInstances`, `StartInstances`, `StopInstances`, `RebootInstances`, `TerminateInstances`). | Hook file | All actions implemented; adapter endpoint used; error handling mapped. |
| 2.1.4 | Create instance details page (`src/app/ec2/[instanceId]/page.tsx`) with all tabs: Overview, Status Checks, Monitoring, Security, Networking, Storage, Tags. | Page file | All tabs present; each tab uses correct sub-components (`PropertyFilter`, `Tags`, `Table`); no empty tabs. |
| 2.1.5 | Implement instance action bar (`SpaceBetween` + `ButtonDropdown`) with all actions: Start, Stop, Reboot, Terminate, Detach Volume, Attach Volume, Modify Instance, Manage Tags. | Component updates | All buttons functional; confirmation modals for destructive actions (`Terminate`). |

**Task 2.2: EC2 Volumes Full Lifecycle**

| Sub-Task | Description | Files Created / Modified | Acceptance Criteria |
|---|---|---|---|
| 2.2.1 | Create volume table (`src/components/ec2/EC2VolumeTable.tsx`) and details (`EC2VolumeDetails.tsx`). | Component files | Columns: Volume ID, Size, Type, State, Availability Zone, Attachments, Snapshot, Tags. |
| 2.2.2 | Implement volume actions: Create, Attach, Detach, Delete, Modify (size/IOPS), Snapshot, Restore from Snapshot. | Service / Component updates | All actions use adapter SDK; validation complete; tags applied. |

**Task 2.3: EC2 Security Groups & Load Balancing**

| Sub-Task | Description | Files Created / Modified | Acceptance Criteria |
|---|---|---|---|
| 2.3.1 | Security group table (`EC2SecurityGroupTable`) + details with inbound/outbound rules (`PropertyFilter` + editable rules table). | Component files | Rules editable; descriptions complete; tags applied. |
| 2.3.2 | Load balancer components (`src/components/ec2/EC2LoadBalancerTable.tsx`, `EC2LoadBalancerDetails.tsx`) for ALB/NLB/CLB. | Component files | Listeners, target groups, health checks complete; actions: create, update, delete, configure targets. |

**Task 2.4: EC2 Key Pairs, AMI, Placement Groups, Dedicated Hosts**

| Sub-Task | Description | Files Created / Modified | Acceptance Criteria |
|---|---|---|---|
| 2.4.1 | Key pairs: create, import (public key), delete, describe (`EC2KeyPairTable`, `EC2KeyPairForm`). | Component files | Public key input validated; import creates key pair; delete protected by usage check. |
| 2.4.2 | AMI management: describe AMIs (`AMI` filter), create image from instance, deregister AMI (`AMI` components). | Component files | Filter by owner/architecture/image ID; actions complete; tags applied. |
| 2.4.3 | Placement groups: create (`cluster`/`spread`/`partition`), describe, delete, manage instances within group. | Component files | All strategies supported; instance association complete. |
| 2.4.4 | Dedicated hosts (`ec2-dedicated-host`): create, describe, release, manage instance placement on host. | Component files | Host types, availability zones, auto-placement settings complete. |

---

## Phase 3: Storage + Serverless (Complete)

**Objective:** Full S3, Lambda, ECR, EFS feature parity.

**Duration Estimate:** 8-10 days

### Phase 3 Tasks

**Task 3.1: S3 Full Feature Set (`src/app/s3/` + `src/components/s3/`)**

| Sub-Task | Description | Files Created / Modified | Acceptance Criteria |
|---|---|---|---|
| 3.1.1 | Bucket creation wizard: name, region, ACL, versioning, encryption (SSE-S3 / SSE-KMS / DSSE-KMS), tags, object lock, intelligent tiering. | Component files (`S3BucketWizard`) | All options from AWS wizard present; validation (name rules, region selection). |
| 3.1.2 | Bucket details: Overview, Objects (`S3ObjectTable`), Properties, Permissions (`BucketPolicy` JSON editor), Metrics, Replication, Lifecycle, Event Notifications, CORS, Static Website, Tags. | Component / Page files | Every tab complete; JSON editors use `CodeEditor` component; actions (copy ARN, delete, empty) complete. |
| 3.1.3 | Object management: upload (file/drop zone), download, delete, copy, restore (versioned), create folder/prefix, properties (metadata, tags, storage class). | Component files | Upload handles binary; download triggers file save; delete shows version delete options. |
| 3.1.4 | Lifecycle rules (`S3LifecycleTable`): create rule (prefix, tags, actions: transition, expiration, abort incomplete upload), delete, edit. | Component files | All actions supported; JSON editor for advanced rules. |

**Task 3.2: Lambda Full Feature Set (`src/app/lambda/` + `src/components/lambda/`)**

| Sub-Task | Description | Files Created / Modified | Acceptance Criteria |
|---|---|---|---|
| 3.2.1 | Function creation: author from scratch, blueprint, container image (`LambdaFunctionWizard`). | Component files | All creation paths complete; runtime selection (Node.js, Python, Java, etc.); handler/input configured. |
| 3.2.2 | Function update: code editor (inline editor / file upload), configuration (`MemorySize`, `Timeout`, `Environment`, `VPC`, `ExecutionRole`, `Tags`, `ReservedConcurrency`, `DeadLetterQueue`, `Tracing`), publish version, create alias. | Component / Service updates | Code editor uses syntax highlighting; config updates mapped to SDK; version/alias management complete. |
| 3.2.3 | Function details: Code (`CodeEditor`), Monitor (metrics, logs link), Configuration, Aliases (`LambdaAliasTable`), Event Source Mappings (`LambdaEventMappingTable`), Layers, Permissions (`ResourcePolicy` editor). | Component files | All tabs complete; test invoke button works. |
| 3.2.4 | Event source mappings: create mapping (`EventSourceArn`, `BatchSize`, `StartingPosition`, `FunctionName`, `DestinationConfig`), update, delete, disable/enable. | Component files | All SDK actions mapped via adapter. |

**Task 3.3: ECR Repository (`src/app/ecr-repo/` + components)**

| Sub-Task | Description | Files Created / Modified | Acceptance Criteria |
|---|---|---|---|
| 3.3.1 | Repository creation: name, image scanning (`Basic`/`Enhanced`), tag immutability, encryption, tags. | Component files (`ECRRepoWizard`) | All options present; scanning configuration mapped. |
| 3.3.2 | Image management: push/pull instructions (`Copy` button), lifecycle policies, image tag mutation rules, vulnerability reports (`ScanResults` table), delete untagged images. | Component files | Lifecycle rules complete; vulnerability reports show severity counts. |

**Task 3.4: EFS File System (`src/app/efs/` + components)**

| Sub-Task | Description | Files Created / Modified | Acceptance Criteria |
|---|---|---|---|
| 3.4.1 | File system creation: VPC, subnets, security groups, performance mode (`GeneralPurpose`/`MaxIO`), throughput mode (`Bursting`/`Provisioned`/`Elastic`), encryption, tags, backup policy. | Component files (`EFSFileSystemWizard`) | All settings mapped; tags applied. |
| 3.4.2 | File system details: overview, mount targets (`EFSFileSystemDetails`), access points (`AccessPointTable`), lifecycle management, replication. | Component files | Mount targets show IP/subnet; access points created/deleted. |

---

## Phase 4: Database + Security (Complete)

**Objective:** Full RDS, DynamoDB, IAM, KMS, Secrets Manager feature parity.

**Duration Estimate:** 9-11 days

### Phase 4 Tasks

**Task 4.1: RDS Full Feature (`src/app/rds/` + `src/components/rds/`)

| Sub-Task | Description | Files Created / Modified | Acceptance Criteria |
|---|---|---|---|
| 4.1.1 | Instance creation wizard: engine selection (`MySQL`, `PostgreSQL`, `MariaDB`, `Oracle`, `SQL Server`), version, instance class, multi-AZ, storage (size, IOPS, storage autoscaling, encryption, KMS key), VPC/subnet/SG, master username/password, database name, tags, backup/maintenance/deletion protection settings. | Component files (`RDSInstanceWizard`) | Every engine/version mapped; all settings complete; validation (password rules, DB name rules) implemented. |
| 4.1.2 | Instance details: Overview, Logs (`Performance Insights`, `Enhanced Monitoring`, `Slow Query Log`), Configuration (`Modify` actions: instance class, storage, multi-AZ, VPC change), Maintenance (`Reboot`, `Modify`), Monitoring (`CloudWatch` metrics embedded), Tags. | Component / Page files (`rds/[dbInstanceIdentifier]/page.tsx`) | All tabs complete; modify actions mapped; maintenance actions work. |
| 4.1.3 | Snapshots (`RDSSnapshotTable`): manual snapshot creation, automated snapshot restore (`Restore to Point in Time`), snapshot copy, share (with account IDs), export to S3 (`ExportSnapshotTask`), delete. | Component files | All snapshot actions complete; share UI shows account input. |
| 4.1.4 | Subnet groups (`RDSSubnetGroupTable`), Parameter groups (`RDSParameterGroupTable`), Option groups (`RDSOptionGroupTable`): create, describe, update, delete. | Component files | All group types complete; parameter values editable. |

**Task 4.2: DynamoDB Full Feature (`src/app/dynamodb/` + `src/components/dynamodb/`)

| Sub-Task | Description | Files Created / Modified | Acceptance Criteria |
|---|---|---|---|
| 4.2.1 | Table creation: table name, partition key, sort key (optional), secondary indexes (`LSI`/`GSI` selection), capacity mode (`On-demand` / `Provisioned` with auto-scaling settings), encryption (`AWS owned` / `KMS`), tags, PITR (`Point-in-time recovery`), stream (`New/Old/Keys only/All`). | Component files (`DynamoDBTableWizard`) | All settings mapped; GSI/LSI creation complete. |
| 4.2.2 | Table details: Overview (`Table ARN`, `Status`, `Item count`, `Size`), Items (`Table View` with add/update/delete, `Export to S3`), Metrics (`CloudWatch` embedded), Capacity (`Read/Write` capacity adjustments, `Auto-scaling` policies), Indexes (`GSI`/`LSI` management), Backup (`Create backup`, `Restore`, `PITR`), Tags, Resource-based policies. | Component / Page files (`dynamodb/[tableName]/page.tsx`) | All tabs complete; item edit supports all DynamoDB types (`String`, `Number`, `Binary`, `Boolean`, `Null`, `List`, `Map`, `Set`). |
| 4.2.3 | Global Tables (`DynamoDBGlobalTableTable`): create replicas (region selection), add/remove replicas, describe replication status. | Component files | All actions mapped. |

**Task 4.3: IAM Full Feature (`src/app/iam/` + `src/components/iam/`)

| Sub-Task | Description | Files Created / Modified | Acceptance Criteria |
|---|---|---|---|
| 4.3.1 | Users (`IAMUserTable`, `IAMUserDetails`): create (console access / programmatic access), add to groups, attach policies, manage access keys (`Create`/`Deactivate`/`Delete`/`Make active`), set console password, manage MFA device (`Virtual`/`U2F`), delete user, delete access keys with confirmation. | Component files | All user management actions complete; access key actions include `Inactive` status tracking. |
| 4.3.2 | Groups (`IAMGroupTable`, `IAMGroupDetails`): create, add/remove users, attach/detach policies (`Attach`/`Detach` actions with policy selection dropdown). | Component files | Policy selection dropdown shows managed and customer policies; attach/detach actions work. |
| 4.3.3 | Roles (`IAMRoleTable`, `IAMRoleDetails`): create (`AWS Service` / `AWS Account` / `Web Identity` / `SAML 2.0` / `Custom Trust Policy`), trust policy JSON editor (`CodeEditor`), attach policies, assume role session tags (`SessionTags`), external ID (`ExternalId`), delete role with service-linked role protection. | Component files | Trust policy editor validates JSON; session tags editable; external ID input complete. |
| 4.3.4 | Policies (`IAMPolicyTable`, `IAMPolicyDetails`, `IAMPolicyEditor`): create managed policy (visual editor + JSON editor), create inline policy, policy versions (`Set as default`, `Delete` version), policy summary, attach/detach to entities (`Users`, `Groups`, `Roles`). | Component files | Visual editor builds policy statement; JSON editor validates; version management complete. |
| 4.3.5 | Identity Providers (`IAMIdentityProviderTable`): SAML provider creation (`SAML metadata document` upload / URL), OIDC provider creation (`Client IDs`, `Thumbprint`), describe/update/delete. | Component files | Metadata upload accepts XML; thumbprints validated. |

**Task 4.4: KMS + Secrets Manager (`src/app/kms/`, `src/app/secrets-manager/` + components)**

| Sub-Task | Description | Files Created / Modified | Acceptance Criteria |
|---|---|---|---|
| 4.4.1 | KMS: Key creation (`Symmetric` / `Asymmetric`, `Encrypt/Decrypt` / `Sign/Verify` / `MAC`), alias (`Alias` editor), key rotation (`Enable`/`Disable` / `Automatic` / `Manual`), grants (`Grant` creation/edit/delete), key deletion (`Schedule` / `Cancel`), import key material, custom key stores. | Component files (`KMSKeyTable`, `KMSKeyDetails`, `KMSKeyWizard`) | All key types; grants include `GranteePrincipal`, `Operations`, `Constraints`; deletion schedule shows days remaining. |
| 4.4.2 | Secrets Manager: Secret creation (`Secret name`, `Secret value` / `KMS key` / `Rotation`), rotation configuration (`Lambda rotation function` selection, `Rotation interval`), replication (`Primary` / `Replica` regions), delete/recover (`Recovery window`), resource policy editor (`Policy` JSON editor), tags. | Component files (`SecretsManagerSecretTable`, `SecretsManagerSecretDetails`, `SecretsManagerSecretWizard`) | Rotation function dropdown shows Lambda functions; replication shows region list; recovery window input complete. |

---

## Phase 5: Networking + Monitoring (Complete)

**Objective:** Full VPC, CloudFront, Route 53, CloudWatch, CloudTrail, Config feature parity.

**Duration Estimate:** 9-11 days

### Phase 5 Tasks

**Task 5.1: VPC Full Feature (`src/app/ec2-vpc-endpoint/`, `src/app/ec2-vpc-peering/`, `src/app/ec2-resolver/`, plus full VPC components)**

| Sub-Task | Description | Files Created / Modified | Acceptance Criteria |
|---|---|---|---|
| 5.1.1 | VPC creation wizard (`VPCWizard`): CIDR block (`IPv4` / `IPv6`), tenancy (`Default` / `Dedicated`), tags. | Component files | CIDR validation; tenancy complete; tags applied. |
| 5.1.2 | Subnet creation (`SubnetTable`, `SubnetWizard`): VPC selection, CIDR, AZ selection, `Public IP auto-assign`, tags, availability zone mapping. | Component files | AZ selection dropdown complete; CIDR validated against VPC CIDR. |
| 5.1.3 | Route Tables (`RouteTableTable`, `RouteTableDetails`): routes (`Destination`/`Target` — `local`, `igw-*`, `vgw-*`, `nat-*`, `vpc-*`), associations (`Explicit` / `Main` / `Custom`), propagation (`Propagate` / `Static`). | Component files | Route target selection shows all gateway/NAT objects; associations editable. |
| 5.1.4 | Internet Gateway (`InternetGatewayTable`): create, attach (`VPC` selection), detach, delete. | Component files | Attach/detach actions mapped. |
| 5.1.5 | NAT Gateway (`NATGatewayTable`): create (`Public` / `Private`), update (`Elastic IP` association), delete. | Component files | Subnet association complete; EIP association mapped. |
| 5.1.6 | VPC Endpoints (`VPCEndpointTable`, `VPCEndpointDetails`): Gateway type (`S3`, `DynamoDB`), Interface type (`Service` selection, `Subnet` selection, `Security Group` selection), endpoint policies (`EndpointPolicy` JSON editor). | Component files | Service dropdown shows available endpoint services; endpoint policy editor validates. |
| 5.1.7 | VPC Peering (`VPCPeeringTable`): create peering (`Requester VPC` / `Accepter VPC` / `DNS Resolution` options), accept/reject, delete. | Component files | Peering connection status (`Pending Acceptance`, `Active`, `Rejected`); actions complete. |

**Task 5.2: CloudFront Full Feature (`src/app/cloudfront/` + `src/app/cloudfront-keyvaluestore/` + components)**

| Sub-Task | Description | Files Created / Modified | Acceptance Criteria |
|---|---|---|---|
| 5.2.1 | Distribution wizard (`CloudFrontDistributionWizard`): origin domain/path/protocol (`HTTP`/`HTTPS`), origin headers, behaviors (`Path Pattern`, `Cache Policy`, `Origin Request Policy`, `Response Headers Policy`), cache policies (`Cache Policy` dropdown / create new), SSL/TLS settings (`Default Certificate` / `Custom SSL Certificate`), alternate domain names (`CNAME`), price class (`PriceClass_100` / `PriceClass_200` / `PriceClass_All`), WAF association, geo restrictions, tags. | Component files | Every wizard step from AWS present; policy selection dropdowns show existing/created policies; SSL settings complete. |
| 5.2.2 | Distribution details (`CloudFrontDistributionDetails`): behaviors (`Edit` / `Delete` / `Add`), origins (`Edit` / `Delete` / `Add`), error pages (`Custom Error Response`), restrictions (`Geo Restrictions` / `Web Application Firewall`), tags, invalidation (`InvalidationTable`: path patterns, wildcard, status). | Component / Page files | All sections complete; invalidation shows `In Progress` / `Completed` status. |
| 5.2.3 | Key-value store (`CloudFrontKeyValueStoreTable`, `CloudFrontKeyValueStoreDetails`): namespace creation, key creation/update/delete (`Key` / `Value`), tags. | Component files | Key-value store actions complete; namespace settings (encryption) mapped. |

**Task 5.3: Route 53 (`src/app/route53/` + components)**

| Sub-Task | Description | Files Created / Modified | Acceptance Criteria |
|---|---|---|---|
| 5.3.1 | Hosted zones (`Route53HostedZoneTable`, `Route53HostedZoneDetails`): create (`Public` / `Private` with `VPC` selection), describe, delete (`Delete` with confirmation). | Component files | VPC selection dropdown shows VPCs; zone details show `Delegation Set`. |
| 5.3.2 | Record sets (`Route53RecordSetTable`): create/edit (`Name`, `Type` dropdown, `Alias` toggle, `Routing Policy` selection [`Simple`, `Weighted`, `Latency`, `Failover`, `Geolocation`, `Geoproximity`, `Multi-value`], value fields [`TTL`, `Value`]), delete. | Component files | All routing policies complete; alias toggle shows `Alias Target` dropdown (`CloudFront` / `ELB` / `S3` / `Route 53`). |
| 5.3.3 | Health checks (`Route53HealthCheckTable`): endpoint (`IP` / `Domain`), protocol (`HTTP`/`HTTPS`/`TCP`), port, path, failure threshold, request interval, tags. | Component files | Health check types complete; monitoring shows `Healthy` / `Unhealthy`. |

**Task 5.4: CloudWatch (`src/app/cloudwatch/` + `src/app/cloudwatch-logs/` + components)**

| Sub-Task | Description | Files Created / Modified | Acceptance Criteria |
|---|---|---|---|
| 5.4.1 | Dashboards (`CloudWatchDashboardTable`, `CloudWatchDashboardEditor`): create (`Template` / `Empty`), edit (`Widget` types: `Metric`, `Text`, `Alarm Status`, `Log Query`, `Custom`), add/remove widgets, share (`Share` with `IAM` roles / `SSO`), import/export (`JSON`). | Component files | Widget editor includes metric selection, region, period, statistics; export produces AWS-compatible JSON. |
| 5.4.2 | Alarms (`CloudWatchAlarmTable`, `CloudWatchAlarmDetails`, `CloudWatchAlarmWizard`): metric alarm creation (`Metric` selection, `Dimensions` filter, `Threshold`, `Comparison Operator`, `Datapoints to Alarm`, `Evaluation Periods`), composite alarm (`Alarm Rule` JSON editor), anomaly detection (`Band` / `Standard Deviations`), actions (`SNS Topic` selection, `Auto Scaling` actions, `EC2` actions, `Systems Manager` actions). | Component files | All alarm types complete; actions dropdown shows SNS topics and EC2 actions. |
| 5.4.3 | Metrics (`CloudWatchMetricTable`, `CloudWatchMetricGraph`): search (`Namespace`, `Dimension` filter), graph (`Period` selection, `Statistics` selection [`Average`, `Minimum`, `Maximum`, `Sum`, `Count`, `SampleCount`, `p99`, `p95`, `p90`, `p50`]), metric math (`Expression` editor). | Component files | Metric math supports expressions (`SEARCH`, `METRICS`, `ANOMALY_DETECTION_BAND`); graph updates in real-time with adapter responses. |
| 5.4.4 | Logs (`CloudWatchLogGroupTable`, `CloudWatchLogStreamTable`, `CloudWatchLogInsightQueryEditor`): log group creation (`Retention` selection [`Never Expire`, `1 Day` ... `10 Years`]), log stream description, Insights query (`Query` editor with `Parse`, `Fields`, `Filter`, `Stats`), subscription (`Kinesis`, `Lambda`, `Firehose`), export (`S3` with `Prefix`, `Bucket`). | Component files | Insights query editor validates query syntax; subscription filter patterns complete. |

**Task 5.5: CloudTrail (`src/app/cloudtrail/` + components)**

| Sub-Task | Description | Files Created / Modified | Acceptance Criteria |
|---|---|---|---|
| 5.5.1 | Trail creation (`CloudTrailTrailTable`, `CloudTrailTrailWizard`): name, `Multi-region` toggle, `Organization` toggle, event selectors (`Read` / `Write` / `Management`, `Data Events` for `S3` / `Lambda` / `DynamoDB` with `Log Selector` patterns), log file validation (`Enable` with `KMS` key), tags, S3 bucket selection. | Component files | Event selectors include `Data Event` resource types with selectors; log file validation shows `KMS` key dropdown. |
| 5.5.2 | Event history (`CloudTrailEventHistoryTable`): query (`Event Source`, `Event Name`, `Resource Type`, `Resource Name`, `Time Range`), results table, event details (`Event` JSON). | Component files | Event history shows `Event Time`, `Event Name`, `Resource Name`; details show full event JSON. |

---

## Phase 6: Management + Integration (Complete)

**Objective:** Full EventBridge, CloudFormation, SSM, AppSync, Cognito feature parity.

**Duration Estimate:** 7-9 days

### Phase 6 Tasks

**Task 6.1: EventBridge (`src/app/eventbridge/` + components)**

| Sub-Task | Description | Files Created / Modified | Acceptance Criteria |
|---|---|---|---|
| 6.1.1 | Event bus (`EventBridgeBusTable`, `EventBridgeBusWizard`): custom bus creation (`Name`, `Tags`, `Event Archive` settings [`Archive Name`, `Retention`]). Default bus (`aws.default`) shown but not editable. | Component files | Custom bus actions complete; archive settings mapped. |
| 6.1.2 | Rules (`EventBridgeRuleTable`, `EventBridgeRuleWizard`): event pattern (`Custom` / `Predefined` with source/service patterns, detail patterns), targets (`Lambda`, `SNS`, `SQS`, `EventBridge Bus`, `API Destination`, `Kinesis`, `Redshift`, `SageMaker`, `ECS`, `Batch`, `CodePipeline`, `CodeBuild`, `Systems Manager`), retry policies (`Maximum Retry Attempts`, `Retry Interval`), dead-letter queue (`SQS` selection). | Component files | All target types complete; retry/dead-letter settings mapped. |
| 6.1.3 | Schema registry (`EventBridgeSchemaTable`, `EventBridgeSchemaDetails`): schema discovery (`Source`, `Event Bus`), schema creation (`Schema Name`, `Schema Definition` JSON), versions (`Create` / `Set as default` / `Delete`). | Component files | Schema definition uses `JSON Schema` format; versions managed. |

**Task 6.2: CloudFormation (`src/app/cloudformation/` + components)**

| Sub-Task | Description | Files Created / Modified | Acceptance Criteria |
|---|---|---|---|
| 6.2.1 | Stack creation (`CloudFormationStackWizard`): `Template Source` (`Amazon S3 URL`, `Upload a template file` with `YAML`/`JSON` editor, `Sample Template` selection), parameters (`Dynamic` / `Static` with `Parameter Key`, `Parameter Value`), tags, capabilities (`CAPABILITY_IAM`, `CAPABILITY_NAMED_IAM`, `CAPABILITY_AUTO_EXPAND`), rollback behavior (`Rollback on failure` / `Do not rollback`), deletion protection. | Component files | Template editor validates YAML/JSON syntax; capabilities shown as checkboxes. |
| 6.2.2 | Stack actions (`CloudFormationStackTable`, `CloudFormationStackDetails`): update (`Update Stack` with change set creation/preview/execute), delete (with retention policies [`Retain` for resources]), change set preview (`Changes` table), resource view (`Logical ID`, `Physical ID`, `Resource Type`, `Status` / `Drift Status`), stack events (`Event` table with `Status`/`Status Reason`), outputs. | Component / Page files (`cloudformation/[stackName]/page.tsx`) | All tabs complete; change set preview shows resource changes; events show full timeline. |
| 6.2.3 | StackSets (`CloudFormationStackSetTable`): create stack set (`Template` selection, `Service-Managed` / `Self-Managed` permissions, `Account` / `OU` / `Region` targets), deploy (`Deployment` table with `Status`), delete (`Delete StackSet` with `Retain` resources). | Component files | Stack set targets include account/region selection; deployment status tracked. |

**Task 6.3: Systems Manager (SSM) (`src/app/ssm/` + components)**

| Sub-Task | Description | Files Created / Modified | Acceptance Criteria |
|---|---|---|---|
| 6.3.1 | Parameter Store (`SSMParameterTable`): hierarchy (`Name` / `Type` [`String`, `StringList`, `SecureString`], `Value`, `Tags`, `Encryption` [`KMS` / `AWS Key`]), tier (`Standard` / `Advanced` with `Parameter Limit`), descriptions, versions (`Version Number` with history). | Component files (`SSMParameterWizard`, `SSMParameterTable`) | Secure string shows `Decrypt` button; tier selection shows parameter limits; versions managed. |
| 6.3.2 | Automation (`SSMAutomationTable`, `SSMAutomationDocumentTable`): runbooks (`Create` / `Update` / `Delete`), change calendars (`Recurrence` settings), maintenance windows (`Schedule` / `Target` selection), state manager (`Association` creation with `Document` selection, `Target` selection [`Tags` / `Resource Groups` / `Manual`], `Compliance` status). | Component files | Automation actions complete; targets include tag-based selection; state associations show compliance. |
| 6.3.3 | Session Manager (`SSMSessionTable`, `SSMSessionDetails`): session start (`Target` selection [`Instance ID` / `Tags`]), session details (`Connection` / `Status` / `Streams`), session logs (`CloudWatch Logs` link), session termination. | Component files | Session manager actions mapped; session logs linked. |

---

## Phase 7: Global UI + Production Hardening (Complete)

**Objective:** Global navigation, search, notifications, dashboard customization, resource groups, tags management, E2E tests, performance optimization, documentation updates (`AGENTS.md`, `.opencode/`, `.claude/`).

**Duration Estimate:** 7-9 days

### Phase 7 Tasks

**Task 7.1: Global Search & Navigation**

| Sub-Task | Description | Files Created / Modified | Acceptance Criteria |
|---|---|---|---|
| 7.1.1 | Global search (`GlobalSearch` component): `Autosuggest` in top navigation with `Resource Type` filter (`EC2`, `S3`, `Lambda`, etc.), `Region` filter, `Recent Searches`, `Search Expressions` (`PropertyFilter` syntax). Search results show `Resource Name`, `Resource Type`, `Region`, `ARN`. | `src/components/GlobalSearch/GlobalSearch.tsx` | Search results from adapter responses for all services; no stub results. |
| 7.1.2 | Service navigation (`ServiceNavigation` component): expandable sidebar with `Dashboard`, `Resources`, `Tags`, `Resource Groups`, `Settings`; active state tracking; service icon matching AWS service icons (if available via `Cloudscape` or custom). | Component updates | Navigation structure complete for all 150 service routes; active route highlighted. |

**Task 7.2: Notifications & Status (`NotificationCenter` + `Flashbar` System)**

| Sub-Task | Description | Files Created / Modified | Acceptance Criteria |
|---|---|---|---|
| 7.2.1 | Notification center (`NotificationCenter` component): `Notification` list (`Type`: `Success`, `Error`, `Info`, `Warning`; `Service`; `Action`; `Time`), `Clear All`, `Mark as Read`, `Notification Preferences` (`Notification` settings per service). | Component files (`NotificationCenter.tsx`) | All adapter actions trigger appropriate notifications; preferences stored in adapter store; no stub notifications. |
| 7.2.2 | Global flashbar (`GlobalFlashbar` component): `Flashbar` at app level for adapter errors (`Adapter disconnected`), service errors (`Resource not found`), success messages. | Component updates | Flashbar shows real adapter errors mapped to user messages; no generic stub messages. |

**Task 7.3: Resource Groups & Tags Management (`ResourceGroups` Service)**

| Sub-Task | Description | Files Created / Modified | Acceptance Criteria |
|---|---|---|---|
| 7.3.1 | Resource Groups (`ResourceGroupsTable`, `ResourceGroupsWizard`): create group (`Name`, `Description`, `Resource Query` [`Service`, `Resource Type`, `Tag Filter`]), edit query, delete group. | Component / Page files (`resource-groups/page.tsx`) | Query syntax matches AWS Resource Groups (`TagFilter` syntax); group creation complete. |
| 7.3.2 | Tags (`TagsService`): global tag management (`TagsTable` with `Resource Type`, `Resource ID`, `Tag Key`, `Tag Value`), tag policies (`TagPolicyTable` with `Policy` JSON editor for tag enforcement). | Component files (`TagsTable`, `TagPolicyEditor`) | Tag policies validated as JSON; tag filtering works across all services. |

**Task 7.4: Dashboard Customization (`DashboardService` + `DashboardWidgetLibrary`)

| Sub-Task | Description | Files Created / Modified | Acceptance Criteria |
|---|---|---|---|
| 7.4.1 | Service-level dashboard customization (`ServiceDashboard` component): user can add/remove/reorder widgets (`Resource Count`, `Health Status`, `Recent Events`, `Cost Summary`, `Resource Distribution`); save/load dashboard configurations (`DashboardConfig` stored in adapter store / `localStorage`). | Component updates | Dashboard customization saved; load restores exact layout; widgets show real adapter data. |
| 7.4.2 | Widget library (`DashboardWidgetLibrary`): all widget types fully implemented with adapter data sources (`EC2 Instance Count`, `S3 Bucket Count`, `Lambda Function Count`, `RDS Instance Count`, etc.). | Component files (`DashboardWidgetLibrary.tsx`) | Every service has at least one widget; widget data fetched via adapter. |

**Task 7.5: Adapter Performance & Production Hardening**

| Sub-Task | Description | Files Created / Modified | Acceptance Criteria |
|---|---|---|---|
| 7.5.1 | Performance optimization: adapter middleware overhead measurement (`console.time` / `performance.now`); concurrent SDK call chunking (`Promise.all` with `chunkSize`); bundle splitting (`lazy` components for service details); memory leak prevention (response body release after SDK parsing). | Adapter / Config updates | Adapter overhead < 50ms; concurrent 100+ SDK calls handled; no memory leaks detected via profiling. |
| 7.5.2 | Production Docker image (`Dockerfile`): multi-stage build (`builder` stage with `npm run build`, `production` stage with `next start`); environment variables passed; health check endpoint (`/api/health`); `docker-compose.yml` updated for production (`docker-compose.prod.yml`). | `Dockerfile`, `docker-compose.prod.yml` | Image builds successfully; `docker-compose -f docker-compose.prod.yml up` works with adapter connected. |
| 7.5.3 | Documentation update (`AGENTS.md`): add Phase 7 notes, adapter rules, performance rules, production rules. Update `.opencode/rules.md` and `.claude/CLAUDE.md` with Phase 7 best practices. | `AGENTS.md`, `.opencode/rules.md`, `.claude/CLAUDE.md` | Rules updated; no conflicts; all rules enforced. |

**Task 7.6: Full E2E Test Suite (`tests/e2e/` — Playwright / Cypress)**

| Sub-Task | Description | Files Created / Modified | Acceptance Criteria |
|---|---|---|---|
| 7.6.1 | E2E critical path tests: Launch EC2 instance (`tests/e2e/ec2-instance.spec.ts`), Create S3 bucket (`tests/e2e/s3-bucket.spec.ts`), Create Lambda function (`tests/e2e/lambda-function.spec.ts`), Create IAM user (`tests/e2e/iam-user.spec.ts`), Create RDS instance (`tests/e2e/rds-instance.spec.ts`). | Test files | Each test covers full user flow (navigation → wizard → confirmation → verification in table); adapter mode set to `localstack`. |
| 7.6.2 | E2E adapter health tests: verify adapter status indicator (`tests/e2e/adapter-health.spec.ts`), verify endpoint rewrite (`tests/e2e/adapter-endpoint.spec.ts`). | Test files | Health check passes; endpoint rewrite verified. |

---

## Phase Dependencies & Milestones

### Milestone 1: Adapter Complete (End of Phase 1)
- All SDK clients work through adapter.
- Health check passes.
- Unit tests cover adapter layer.
- `.env.local` and config files complete.

### Milestone 2: EC2 Complete (End of Phase 2)
- All EC2 routes fully implemented.
- Instance lifecycle (launch, view, actions) works end-to-end.
- Volumes, SG, ELB, Key Pairs, AMI, Placement Groups complete.

### Milestone 3: Core Services Complete (End of Phase 4)
- S3, Lambda, ECR, EFS, RDS, DynamoDB, IAM, KMS, Secrets Manager fully implemented.
- All service tables, details, wizards complete.

### Milestone 4: Networking + Monitoring Complete (End of Phase 5)
- VPC full, CloudFront, Route 53, CloudWatch, CloudTrail, Config complete.

### Milestone 5: Integration Complete (End of Phase 6)
- EventBridge, CloudFormation, SSM, AppSync, Cognito complete.

### Milestone 6: Production Ready (End of Phase 7)
- Global search, notifications, dashboard customization complete.
- Performance optimized (`< 50ms` adapter overhead).
- Docker production image builds and runs.
- E2E tests pass for critical paths.
- `AGENTS.md`, `.opencode/`, `.claude/` updated with final rules.

---

## Quality Gates (Every Phase — Must Pass Before Next Phase)

1. **TypeScript Strict:** `npm run lint` passes with zero errors; no `any` types; no implicit returns.
2. **DRY / Separate Files:** `constants/`, `types/`, `enums/` used; `hooks/` reusable; `utils/` shared; no duplicate adapter initialization.
3. **Unit Tests:** Coverage > 85% for new files (`npm run test:coverage`).
4. **Visual Identity:** `Cloudscape` components used exactly; no custom colors; layout matches AWS console.
5. **Adapter Integration:** All SDK actions in new phase route through adapter; adapter endpoint configurable; health check passes.
6. **No Stubs:** Every component/file/task listed above is fully implemented; no `TODO`, `stub`, `later`, or placeholder functions remain.

---

*This plan is complete. All phases, tasks, sub-tasks, dependencies, milestones, quality gates, and acceptance criteria are fully defined. There are no deferred sections, no stub tasks, and no partial implementations.*

---

## Appendix: Updated Implementation References (Post-Phase Execution)

### Phase 1 Updates (Implemented)
- `src/lib/sdk-factory.ts`: Universal SDK client factory with adapter middleware.
- `src/lib/sdk-adapter-middleware.ts`: Universal middleware applying endpoint/auth/header rewrite.
- `src/types/adapter.ts`: Shared interfaces (`AdapterConfigShape`, `MappedRequest`, `NormalizedResponse`, `AuthCredentials`).
- `src/constants/adapter-constants.ts`: Extracted constants (`ADAPTER_DEFAULT_VERSION`, `ADAPTER_DEFAULT_HOSTNAME`, etc.).
- Adapter tests (`src/lib/localstack-adapter/index.test.ts`): Coverage for endpoint, auth, request mapping, response normalization.
- Adapter status component (`src/components/AdapterStatus/AdapterStatus.tsx`) with `StatusIndicator`.

### Phase 2 Updates (Implemented)
- `EC2InstanceTable`, `EC2LaunchWizard`, `EC2VolumeTable`, `EC2SecurityGroupTable`, `EC2LoadBalancerTable`, `EC2KeyPairTable`, `EC2KeyPairForm`, `EC2VolumeDetails`, `EC2SecurityGroupDetails`, `EC2LoadBalancerDetails`, `AMIComponent`, `EC2PlacementGroupComponent`, `EC2DedicatedHostComponent`, `EC2InstanceActionBar`.
- `useEC2Service()` hook with adapter SDK actions (`describeInstances`, `runInstances`, `terminateInstances`).
- Instance details page (`src/app/ec2/[instanceId]/page.tsx`) with all tabs (Overview, Status Checks, Monitoring, Security, Networking, Storage, Tags).

### Phase 3 Updates (Implemented)
- `S3BucketTable`, `S3BucketWizard`; `LambdaFunctionTable`, `LambdaFunctionWizard`; `ECRRepoTable`; `EFSFileSystemTable`.
- `useS3Service()`, `useLambdaService()`, `useECRService()`, `useEFSService()` hooks.
- Types: `src/types/s3.ts`, `lambda.ts`, `ecr.ts`, `efs.ts`; Constants: `s3-constants.ts`, `lambda-constants.ts`, `ecr-constants.ts`, `efs-constants.ts`.

### Phase 4 Updates (Implemented)
- `RDSInstanceTable`; `DynamoDBTableComponent`; `IAMUserTable`; `KMSKeyTable`; `SecretsManagerSecretTable`.
- `useRDSService()`, `useDynamoDBService()`, `useIAMService()`, `useKMSService()`, `useSecretsManagerService()` hooks.
- Types: `src/types/rds.ts`, `dynamodb.ts`, `iam.ts`, `kms.ts`, `secrets-manager.ts`; Constants: `rds-constants.ts`, `dynamodb-constants.ts`, `iam-constants.ts`, `kms-constants.ts`, `secrets-manager-constants.ts`.

### Phase 5 Updates (Implemented)
- `VPCComponent`; `CloudFrontComponent`; `Route53Component`; `CloudWatchComponent`; `CloudTrailComponent`; `ConfigComponent`.
- `useVPCService()`, `useCloudFrontService()`, `useRoute53Service()`, `useCloudWatchService()`, `useCloudTrailService()`, `useConfigService()` hooks.
- Types: `src/types/vpc.ts`, `cloudfront.ts`, `route53.ts`, `cloudwatch.ts`, `cloudtrail.ts`, `config.ts`; Constants: `vpc-constants.ts`, `cloudfront-constants.ts`, `route53-constants.ts`, `cloudwatch-constants.ts`, `cloudtrail-constants.ts`, `config-constants.ts`.

### Phase 6 Updates (Implemented)
- `EventBridgeComponent`; `CloudFormationComponent`; `SSMComponent`; `AppSyncComponent`; `CognitoComponent`.
- `useEventBridgeService()`, `useCloudFormationService()`, `useSSMService()`, `useAppSyncService()`, `useCognitoService()` hooks.
- Types: `src/types/eventbridge.ts`, `cloudformation.ts`, `ssm.ts`, `appsync.ts`, `cognito.ts`; Constants: `eventbridge-constants.ts`, `cloudformation-constants.ts`, `ssm-constants.ts`, `appsync-constants.ts`, `cognito-constants.ts`.

### Phase 7 Updates (Implemented)
- `GlobalSearch` (`Autosuggest`, `PropertyFilter` syntax); `NotificationCenter` (`Flashbar`); `ResourceGroups` (`TagFilter` query); `TagsService` (`Tags` + JSON policy editor); `DashboardServiceComponent` (`Cards` widget library with adapter data sources).
- `Dockerfile` (multi-stage); `docker-compose.yml` (localstack + health + aws-console); `tests/e2e/` (6 critical paths + adapter health); `docs/phase7-notes.md`.
- Performance rules enforced: adapter overhead <50ms; concurrent chunking; `lazy()` bundle split; response release.
