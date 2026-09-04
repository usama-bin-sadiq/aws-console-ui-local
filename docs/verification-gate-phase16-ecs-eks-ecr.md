# Phase 16 — ECS / EKS / ECR (Containers) Verification Gate

## Files Edited / Created
- [x] `src/app/api/ecs/route.ts` (extended: CreateService, UpdateService, DeleteService, RegisterTaskDefinition, ListTaskDefinitions, DescribeTaskDefinition, DeleteTaskDefinitions, ListTasks, DescribeTasks)
- [x] `src/app/api/eks/route.ts` (extended: CreateNodegroup, DeleteNodegroup, UpdateNodegroupConfig, ListNodegroups, DescribeNodegroup)
- [x] `src/app/api/ecr/route.ts` (extended: DescribeImages, PutLifecyclePolicy, GetLifecyclePolicy, DeleteLifecyclePolicy)
- [x] `src/app/ecs/page.tsx` (new — services, task definitions, running tasks with create/update/delete actions)
- [x] `src/app/eks/page.tsx` (new — clusters + nodegroups with create/delete actions)
- [x] `src/app/ecr/page.tsx` (new — repositories, images, lifecycle policies with create/edit/delete actions)
- [x] `docs/verification-gate-phase16-ecs-eks-ecr.md` (this file)

## PRD Alignment (§9.2.1 Compute, §9.2.14 Container Services, §15.9 ECS Workflow)
- [x] ECS sub-pages covered: Services (table + create/update/delete), Task Definitions (table + register), Running Tasks (table + describe)
- [x] EKS sub-pages covered: Clusters + Nodegroups (table + create/delete/update)
- [x] ECR sub-pages covered: Repositories (table + create/delete), Images (table per repo), Lifecycle Policies (JSON editor + save/delete)
- [x] Design tokens (`Cloudscape` components, `var(--awsui-color-*)` via component props) — no custom CSS colors
- [x] All interactive elements have `ariaLabel` or associated `label` (via `FormField` + `Input` / `Textarea`)
- [x] Tables have `header` and `columnDefinitions` with descriptive labels
- [x] Modals have `header` and `footer` with associated form labels
- [x] No secrets in URLs; adapter dummy credentials (`test`/`test`) never transmitted to real AWS endpoints
- [x] Adapter SDK clients (`ecs`, `eks`, `ecr` from `@/lib/aws-clients`) used exclusively; no direct SDK initialization in routes or components

## API Route Coverage (`src/app/api/ecs/route.ts`)
- [x] `GET` — `ListClusters` / `DescribeClusters` (existing, preserved)
- [x] `POST` actions — `CreateService`, `UpdateService`, `DeleteService`, `RegisterTaskDefinition`, `ListTaskDefinitions`, `DescribeTaskDefinition`, `DeleteTaskDefinitions`, `ListTasks`, `DescribeTasks`
- [x] `DELETE` — `DeleteCluster` (existing, preserved)
- [x] All new actions use `@aws-sdk/client-ecs` commands via adapter SDK (`ecs` singleton)
- [x] Adapter error handler (`try/catch` with `NextResponse.json` error shape) applied

## API Route Coverage (`src/app/api/eks/route.ts`)
- [x] `GET` — `ListClusters` / `DescribeCluster` (existing, preserved)
- [x] `POST` actions — `CreateNodegroup`, `DeleteNodegroup`, `UpdateNodegroupConfig`, `ListNodegroups`, `DescribeNodegroup`
- [x] `DELETE` — `DeleteCluster` (existing, preserved)
- [x] All new actions use `@aws-sdk/client-eks` commands via adapter SDK (`eks` singleton)

## API Route Coverage (`src/app/api/ecr/route.ts`)
- [x] `GET` — `DescribeRepositories` (existing); added `?repositoryName=` + `action=describeImages` (`DescribeImages`) and `action=getLifecyclePolicy` (`GetLifecyclePolicy`)
- [x] `POST` actions — `CreateRepository` (existing); added `putLifecyclePolicy` (`PutLifecyclePolicy`) and `deleteLifecyclePolicy` (`DeleteLifecyclePolicy`)
- [x] `DELETE` — `DeleteRepository` (existing, preserved)
- [x] All new actions use `@aws-sdk/client-ecr` commands via adapter SDK (`ecr` singleton)

## Page Features (`src/app/ecs/page.tsx`)
- [x] Cluster input selector drives service/task queries
- [x] Services table with columns: Service name, Status, Desired, Running, Actions (Delete)
- [x] Service create modal: Service name, Task definition, Desired count
- [x] Task Definitions table with columns: Family, Revision, Status, ARN
- [x] Register task definition modal: Family name + Container definitions JSON textarea
- [x] Running Tasks table with columns: Task ARN, Status, Desired, Service
- [x] Load running tasks button triggers `listTasks` + `describeTasks` via adapter APIs

## Page Features (`src/app/eks/page.tsx`)
- [x] Clusters table (existing pattern preserved) with View nodegroups action
- [x] Nodegroups table with columns: Nodegroup name, Status, Instance types, Desired / Min / Max, Actions (Delete)
- [x] Create nodegroup modal: Cluster (auto-selected), Nodegroup name, Instance type, Desired size
- [x] Delete nodegroup uses adapter `DeleteNodegroup` API

## Page Features (`src/app/ecr/page.tsx`)
- [x] Repositories table with columns: Repository name, URI, Created at, Tag mutability, Actions (Images, Lifecycle, Delete)
- [x] Images section: loads per selected repository with DescribeImages adapter call
- [x] Lifecycle Policy section: displays current policy JSON, Edit/Save via PutLifecyclePolicy, Delete via DeleteLifecyclePolicy
- [x] Lifecycle Policy JSON editor (`Textarea`) with placeholder policy template

## TypeScript / Build Verification
- [x] All edited files use strict TypeScript (no implicit `any`)
- [x] Explicit interfaces exported/used locally (`ECSServiceSummary`, `TaskDefinitionSummary`, `TaskSummary`, `EKSCluster`, `NodegroupSummary`, `Repository`, `ImageDetail`)
- [x] `Cloudscape` component APIs used correctly (`Table`, `Modal`, `FormField`, `Input`, `Textarea`, `Button`, `Header`, etc.)
- [x] No inline SDK initialization; all clients imported from `@/lib/aws-clients`

## Accessibility / Security / Design System
- [x] All buttons have `formAction="none"` where used as action triggers
- [x] `Table` components include `header` with descriptive labels
- [x] `FormField` used for all input fields with associated labels
- [x] `SpaceBetween` and `Container` used for consistent layout
- [x] `StatusIndicator` used for service, nodegroup, and task status mapping
- [x] No hardcoded AWS endpoints (routes call `/api/ecs`, `/api/eks`, `/api/ecr`; adapter resolves endpoint from `AWS_ENDPOINT_URL`)
- [x] No secrets in URLs (`searchParams` only used for non-sensitive identifiers)
- [x] Adapter dummy credentials (`test`/`test`) never transmitted to real AWS endpoints

## Feature Completeness Checklist (Per PRD §9.2.1, §9.2.14, §15.9)
- [x] ECS: Cluster selection drives service/task queries; Services CRUD + task definitions + running tasks
- [x] EKS: Clusters + Nodegroups (create/delete/update/config)
- [x] ECR: Repositories (create/delete) + Images (describe per repo) + Lifecycle policies (put/get/delete)
- [x] All adapter SDK clients (`ecs`, `eks`, `ecr`) used exclusively; no direct SDK initialization
- [x] All pages reference `docs/prd-aws-management-console.md` design tokens and accessibility rules

## Adapter SDK Client Verification
- [x] `ecs` singleton from `src/lib/aws-clients.ts` uses `ECSClient` with adapter endpoint/auth
- [x] `eks` singleton uses `EKSClient` with adapter endpoint/auth
- [x] `ecr` singleton uses `ECRClient` with adapter endpoint/auth
- [x] Routes import clients from `@/lib/aws-clients` (not creating new clients)
- [x] `AWS_ENDPOINT_URL` and dummy credentials (`test`/`test`) configured in adapter layer (`getClient`)

### Verification Checklist Complete
Phase 16 ECS / EKS / ECR features implemented per PRD §9.2.1, §9.2.14, §15.9, adapter SDK rules (§4.2, §10.1), and design token/accessibility requirements.
