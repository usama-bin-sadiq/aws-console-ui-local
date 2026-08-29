# Design Document — AWS Console Clone

## Overview

A pixel-perfect, fully-functional clone of the AWS Web Console running against LocalStack / Ministack. Built with Next.js 16, React 19, TypeScript, Cloudscape Design System, Zustand, and AWS SDK v3. Every service page delivers complete CRUD, real SDK calls, and matching UX patterns from the real AWS Console.

---

## 1. System Architecture

```
Browser
  └─ Next.js 16 App Router (React 19, TypeScript)
       ├─ /src/app/(pages)          ← Service pages & layouts
       ├─ /src/app/api/(routes)     ← API route handlers (server-side)
       ├─ /src/components/          ← Shared Cloudscape-based UI components
       ├─ /src/hooks/               ← Custom React hooks
       ├─ /src/context/             ← React contexts (notifications)
       ├─ /src/stores/              ← Zustand stores (settings)
       └─ /src/lib/                 ← AWS SDK clients, types, utilities
            └─ aws-clients.ts       ← Singleton SDK clients + factory

AWS SDK v3 (browser-safe: no, server-only)
  └─ LocalStack / Ministack @ http://localhost:4566
```

### Data Flow

1. Service page mounts → calls `useAwsApi` hook → `fetch("/api/{service}")`
2. API route reads `x-aws-region` header → gets SDK client for that region → calls emulator
3. Response → React state → Cloudscape Table re-render
4. Write operations → API route → emulator → success/error → `NotificationContext` Flashbar

### Region Override Flow

```
useSettingsStore.region (Zustand)
  → all fetch() calls include header: { "x-aws-region": region }
  → API route: const region = req.headers.get("x-aws-region") ?? process.env.AWS_DEFAULT_REGION
  → getClient(SomeClient, region) returns region-specific singleton
```

### Provider Detection

```
GET /api/health
  → Backend pings /_ministack/health, then /_localstack/health
  → Returns { provider: "ministack"|"localstack"|"unknown", status: "healthy"|"unreachable" }
  → AppShell stores result in useSettingsStore.provider
  → TopNavigation badge color: green=detected, red=unknown
  → On unknown: persistent Flashbar banner across all pages
```

### Code Splitting

Every service page at `src/app/{service}/page.tsx` is automatically code-split by Next.js App Router. Heavy sub-components (WizardModal, DetailTabs) use `React.lazy` + `Suspense` where bundle size warrants it.

---

## 2. Component Hierarchy

```
src/app/layout.tsx
  └─ <AppShell>                          (src/components/AppShell.tsx)
       ├─ <TopNavigation>
       │    ├─ AWS logo + "AWS Console" → href="/"
       │    ├─ <GlobalSearch>            (inline, 3+ chars shows dropdown)
       │    ├─ <RegionSelector>          (Cloudscape Select, persisted Zustand+localStorage)
       │    ├─ <ProviderBadge>           (Badge: green/red)
       │    ├─ Notifications icon button
       │    ├─ Help icon button
       │    └─ Account menu (TopNavigation utility)
       └─ <AppLayout>
            ├─ navigation=<SideNavigation>   (11 categories, 130+ links, collapsible, activeHref)
            ├─ breadcrumbs=<BreadcrumbGroup> (auto from pathname)
            ├─ notifications=<NotificationBar>  (Flashbar queue)
            └─ content=[ServicePage]
                 ├─ <ResourceTable<T>>      (shared generic)
                 ├─ <WizardModal>           (multi-step Wizard)
                 ├─ <ConfirmModal>          (destructive action guard)
                 ├─ <DetailTabs>            (service-specific Tabs)
                 ├─ <JsonEditor>            (Textarea + JSON validation)
                 └─ <TagEditor>             (dynamic key-value rows)
```

---

## 3. Shared Components

### 3.1 ResourceTable<T>

**File:** `src/components/ResourceTable.tsx`

```tsx
interface ResourceTableProps<T extends object> {
  // Identity
  serviceKey: string;              // used for localStorage preferences key

  // Data
  columnDefinitions: TableProps.ColumnDefinition<T>[];
  items: T[];
  loading?: boolean;

  // Selection
  selectedItems?: T[];
  onSelectionChange?: (items: T[]) => void;

  // Filtering
  filteringText?: string;
  onFilteringChange?: (text: string) => void;
  filteringPlaceholder?: string;

  // Pagination
  currentPageIndex?: number;
  pagesCount?: number;
  onPageChange?: (page: number) => void;

  // Preferences
  preferences?: CollectionPreferencesProps.Preferences;
  onPreferencesChange?: (prefs: CollectionPreferencesProps.Preferences) => void;

  // Header
  header?: React.ReactNode;
  onRefresh?: () => void;

  // Empty state
  emptyTitle?: string;
  emptyDescription?: string;
  createButtonLabel?: string;
  onCreateClick?: () => void;
}
```

**Behavior:**
- Default page size: 25. Persisted per `serviceKey` in `localStorage["prefs_{serviceKey}"]`
- Client-side filtering: matches any column value (case-insensitive substring)
- Sorting: ascending/descending on header click via `sortingColumn` + `onSortingChange`
- Multi-select: `selectionType="multi"`, count shown in header: `"Instances (3 of 12 selected)"`
- Loading: `loading` prop on Cloudscape Table
- Empty: centered Box with `emptyTitle`, `emptyDescription`, optional Create button
- Column preferences: `CollectionPreferences` with visible columns + page size

### 3.2 ConfirmModal

**File:** `src/components/ConfirmModal.tsx`

```tsx
interface ConfirmModalProps {
  visible: boolean;
  resourceName: string;       // e.g. "my-bucket"
  resourceType: string;       // e.g. "bucket"
  actionLabel?: string;       // default: "Delete"
  onConfirm: () => void;
  onDismiss: () => void;
}
```

**Behavior:** Renders a Cloudscape `Modal`. Confirm button disabled until user types `resourceName` exactly into an `Input`. Shows warning text about irreversibility.

### 3.3 JsonEditor

**File:** `src/components/JsonEditor.tsx`

```tsx
interface JsonEditorProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;               // default: 12
  readOnly?: boolean;
  placeholder?: string;
}
```

**Behavior:** Cloudscape `FormField` wrapping `Textarea`. Validates JSON on change. Shows `FormField` `errorText` when JSON is invalid (does not block typing). Formats JSON on blur if valid.

### 3.4 TagEditor

**File:** `src/components/TagEditor.tsx`

```tsx
interface Tag { key: string; value: string; }

interface TagEditorProps {
  tags: Tag[];
  onChange: (tags: Tag[]) => void;
  readOnly?: boolean;
}
```

**Behavior:** Dynamic rows of `Input` pairs (Key / Value). "Add tag" button appends empty row. Remove icon on each row. No duplicate key validation (matches AWS Console behavior).

### 3.5 NotificationContext

**File:** `src/context/NotificationContext.tsx`

```tsx
type NotificationType = 'success' | 'error' | 'warning' | 'info';

interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  header?: string;
  dismissible?: boolean;
}

interface NotificationContextValue {
  notifications: Notification[];
  addNotification: (type: NotificationType, message: string, header?: string) => void;
  dismissNotification: (id: string) => void;
}
```

**Behavior:** `success` notifications auto-dismiss after 5 seconds. `error` notifications are persistent (dismissible manually). Rendered as Cloudscape `Flashbar` inside AppShell's `notifications` slot.

### 3.6 useAwsApi Hook

**File:** `src/hooks/useAwsApi.ts`

```tsx
interface UseAwsApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: unknown;
  successMessage?: string;
  errorHeader?: string;
}

function useAwsApi<T>(
  url: string | null,
  options?: UseAwsApiOptions
): {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
  mutate: (url: string, opts: UseAwsApiOptions) => Promise<T>;
}
```

**Behavior:**
- Auto-fetches on mount when `url` is non-null (GET)
- Reads `useSettingsStore().region`, appends `x-aws-region` header to all requests
- On error response: calls `addNotification('error', ...)`
- On success mutation: calls `addNotification('success', successMessage)`
- `mutate` is used for POST/PUT/DELETE; returns response data

---

## 4. AppShell Full Design

### 4.1 SideNavigation — All 130+ Services (11 Categories)

```
Dashboard  (/)

▼ Compute
   EC2                    /ec2
   Lambda                 /lambda
   ECS Clusters           /ecs-cluster
   ECS Services           /ecs-service
   EKS Clusters           /eks-cluster
   Fargate                /fargate
   Auto Scaling           /auto-scaling
   Launch Templates       /launch-template
   AMI                    /ami
   Batch Jobs             /batch-job

▼ Storage
   S3                     /s3
   S3 Tables              /s3-tables
   EBS Volumes            /volume
   EBS Snapshots          /snapshot
   EFS                    /efs
   Backup                 /backup

▼ Database
   DynamoDB               /dynamodb
   RDS                    /rds
   RDS Data               /rds-data
   ElastiCache            /elasticache (stub)
   OpenSearch             /opensearch
   DSQL                   /dsql

▼ Networking & Content Delivery
   VPC                    /vpc
   Subnets                /subnet
   Route Tables           /route-table
   Internet Gateways      /internet-gateway
   NAT Gateways           /nat-gateway
   Network ACLs           /network-acl
   Security Groups        /security-group
   Elastic IPs            /elastic-ip
   VPC Endpoints          /ec2-vpc-endpoint
   VPC Peering            /ec2-vpc-peering
   Transit Gateway        /transit-gateway
   VPN Connections        /vpn
   Direct Connect         /direct-connect
   Route 53               /route53
   EC2 Health Checks      /ec2-health-check
   Global Accelerator     /global-accelerator
   CloudFront             /cloudfront

▼ Security & Identity
   IAM                    /iam
   IAM Users (Access Keys)/iam-access-key
   IAM Groups             /iam-group
   IAM Roles (Instance)   /iam-instance-profile
   IAM SAML               /iam-saml
   IAM OpenID Connect     /iam-openid-connect
   IAM Password Policy    /iam-password-policy
   IAM Credential Report  /iam-credential-report
   IAM Virtual MFA        /iam-virtual-mfa
   KMS                    /kms
   Secrets Manager        /secrets-manager
   ACM                    /acm
   WAF                    /waf
   WAF Classic            /waf-classic
   WAF v2                 /wafv2
   Shield                 /shield
   GuardDuty              /guardduty
   Security Hub           /security-hub
   Macie                  /macie
   Inspector              /inspector
   Detective              /detective
   Verified Access        /verified-access

▼ Management & Governance
   CloudFormation         /cloudformation
   CloudTrail             /cloudtrail
   AWS Config             /config
   Systems Manager (SSM)  /systems-manager-parameter-store
   Organizations          /organizations
   Resource Groups        /resource-groups
   Resource Tags          /resource-groups-tagging
   Cost Explorer          /cost-explorer
   Billing                /billing
   Budgets                /budget
   Support                /support
   CloudControl           /cloudcontrol
   AppConfig              /appconfig
   Trusted Advisor (stub) —

▼ Application Integration
   SQS                    /sqs
   SNS                    /sns
   SNS SMS                /sns-sms
   EventBridge (Rules)    /eventbridge-schema
   EventBridge Pipes      /eventbridge-pipe
   EventBridge Scheduler  /eventbridge-scheduler
   Step Functions         /step-functions
   API Gateway            /appsync
   App Mesh               /app-mesh
   Service Discovery      /servicediscovery
   Pipes                  /pipes

▼ Developer Tools
   CodeBuild              /codebuild
   CodePipeline           /codepipeline
   CodeDeploy             /code-deploy
   ECR Repositories       /ecr-repo
   X-Ray                  /x-ray
   App Auto Scaling       /app-auto-scaling

▼ Analytics
   Kinesis Streams        /kinesis
   Kinesis Firehose       /firehose
   Glue Catalog           /glue-catalog
   Glue Jobs              /glue-job
   Athena Workgroups      /athena-workgroup
   MSK                    /msk
   EMR                    /emr

▼ Containers
   ECS Clusters           /ecs-cluster
   ECS Services           /ecs-service
   ECR Repos              /ecr-repo
   EKS Clusters           /eks-cluster
   Fargate                /fargate

▼ Monitoring & Observability
   CloudWatch             /cloudwatch
   CloudWatch Logs        /cloudwatch-logs
   X-Ray                  /x-ray
   IMDS                   /imds

▼ Machine Learning
   Bedrock Agent          /bedrock-agent
   Bedrock Runtime        /bedrock-runtime
   Bedrock Agent Runtime  /bedrock-agent-runtime
   Bedrock AgentCore      /bedrock-agentcore
```

**SideNavigation implementation:**
- Cloudscape `SideNavigation` with `type: "expandable-link-group"` for categories
- `activeHref` = `usePathname()`
- Expanded state per category persisted in `localStorage["nav_expanded_{category}"]`

### 4.2 TopNavigation Slots

| Slot | Component | Behavior |
|------|-----------|----------|
| Logo | SVG AWS logo + "AWS Console" | href="/" |
| Search | Cloudscape Input | 3+ chars → dropdown list of matching services |
| Region | Cloudscape Select | Updates `useSettingsStore().region`, persisted in localStorage |
| Provider | Cloudscape Badge | green=localstack/ministack, red=unknown |
| Notifications | TopNavigation button | — |
| Help | TopNavigation button | — |
| Account | TopNavigation menu | Username, Settings, Sign out |
| Theme | TopNavigation button | sun/moon icon toggles dark/light |

### 4.3 BreadcrumbGroup

Auto-generated from `usePathname()`:

```
/                    → Home
/s3                  → Home > S3
/s3/my-bucket        → Home > S3 > my-bucket
/lambda/my-fn        → Home > Lambda > my-fn
```

Rendered in AppLayout `breadcrumbs` slot.

---

## 5. API Layer Design

### 5.1 Conventions

```
GET    /api/{service}           → list resources
GET    /api/{service}?id={id}   → get single resource
POST   /api/{service}           → create resource  (body: JSON)
PUT    /api/{service}           → update resource  (body: JSON with id)
DELETE /api/{service}?id={id}   → delete resource

Success response:  { data: T }  or  { items: T[], nextToken?: string }
Error response:    { error: string, code: string }  — HTTP 4xx/5xx
```

### 5.2 Region Override

Every API route handler:
```ts
const region = request.headers.get("x-aws-region") ?? process.env.AWS_DEFAULT_REGION ?? "us-east-1";
const client = getClient(S3Client, region);
```

### 5.3 Client Factory

```ts
// src/lib/aws-clients.ts
const clientCache = new Map<string, unknown>();

export function getClient<T>(
  ClientClass: new (config: AwsClientConfig) => T,
  region: string = process.env.AWS_DEFAULT_REGION ?? "us-east-1"
): T {
  const key = `${ClientClass.name}::${region}`;
  if (!clientCache.has(key)) {
    clientCache.set(key, new ClientClass({
      endpoint: process.env.AWS_ENDPOINT_URL ?? "http://localhost:4566",
      region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "test",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "test",
      },
      forcePathStyle: true,
    }));
  }
  return clientCache.get(key) as T;
}
```

### 5.4 Error Handling Pattern

```ts
export async function GET(request: Request) {
  try {
    // ... SDK call
    return NextResponse.json({ items });
  } catch (err: any) {
    const isUnreachable = err.code === "ECONNREFUSED" || err.cause?.code === "ECONNREFUSED";
    return NextResponse.json(
      { error: err.message, code: isUnreachable ? "EMULATOR_UNREACHABLE" : err.name },
      { status: isUnreachable ? 503 : 500 }
    );
  }
}
```

---

## 6. Per-Service Design

### 6.1 S3

**Routes:** `/s3` (bucket list), `/s3/[bucket]` (detail), `/s3/[bucket]/[...prefix]` (object browser)
**API:** `/api/s3` (buckets CRUD), `/api/s3/objects` (object CRUD), `/api/s3/policy`, `/api/s3/cors`, `/api/s3/lifecycle`, `/api/s3/versioning`, `/api/s3/presigned`

**Data Models:**
```ts
interface S3Bucket {
  Name: string;
  CreationDate: string;
  Region: string;
  Versioning: "Enabled" | "Suspended" | "Disabled";
  Encryption: "SSE-S3" | "SSE-KMS" | "None";
  PublicAccess: "Blocked" | "Allowed";
}

interface S3Object {
  Key: string;
  Size: number;
  LastModified: string;
  StorageClass: string;
  ETag: string;
}
```

**Bucket List Page (`/s3`):**
- ResourceTable: Name (link), Region, Access, Versioning, Encryption, Creation date
- Actions: Create bucket, Delete bucket (ConfirmModal)
- "Create bucket" → 6-step Wizard: General config → Object ownership → Block Public Access → Versioning → Encryption → Tags

**Bucket Detail Page (`/s3/[bucket]`):**
- Tabs: Objects | Properties | Permissions | Metrics | Management | Access points
- **Objects tab:** Hierarchical browser with prefix navigation. Upload button (drag-and-drop Modal). Per-row: Download, Delete, Create presigned URL
- **Properties tab:** Versioning toggle, encryption settings, static website hosting, server access logging, object lock, transfer acceleration — each as editable card
- **Permissions tab:** Block Public Access toggle, Bucket Policy (JsonEditor), ACL table, CORS (JsonEditor)
- **Management tab:** Lifecycle rules ResourceTable + create form

**SDK Operations:** `ListBucketsCommand`, `CreateBucketCommand`, `DeleteBucketCommand`, `ListObjectsV2Command`, `PutObjectCommand`, `GetObjectCommand`, `DeleteObjectCommand`, `GetSignedUrl`, `PutBucketVersioningCommand`, `GetBucketVersioningCommand`, `PutBucketEncryptionCommand`, `GetBucketEncryptionCommand`, `PutPublicAccessBlockCommand`, `GetPublicAccessBlockCommand`, `PutBucketPolicyCommand`, `GetBucketPolicyCommand`, `PutBucketCorsCommand`, `GetBucketCorsCommand`, `PutBucketLifecycleConfigurationCommand`, `GetBucketLifecycleConfigurationCommand`, `PutBucketTaggingCommand`, `GetBucketTaggingCommand`

---

### 6.2 EC2

**Routes:** `/ec2` (dashboard), `/ec2/[instanceId]` (detail)
**Sub-routes:** `/security-group`, `/key-pair`, `/volume`, `/elastic-ip`, `/ami`, `/snapshot`, `/launch-template`, `/auto-scaling`, `/ec2-placement-group`, `/ec2-dedicated-host`
**API:** `/api/ec2` (instances), `/api/ec2/security-groups`, `/api/ec2/key-pairs`, `/api/ec2/volumes`, `/api/ec2/elastic-ips`, `/api/ec2/amis`, `/api/ec2/snapshots`

**Data Models:**
```ts
interface EC2Instance {
  InstanceId: string;
  Name: string;          // from Tags
  InstanceType: string;
  State: { Name: "running"|"stopped"|"pending"|"terminated" };
  PublicIpAddress?: string;
  PrivateIpAddress?: string;
  KeyName?: string;
  LaunchTime: string;
  AvailabilityZone: string;
  VpcId?: string;
  SubnetId?: string;
  SecurityGroups: { GroupId: string; GroupName: string }[];
}
```

**EC2 Dashboard (`/ec2`):**
- Summary cards row: Instances (running), Security Groups, Key Pairs, Volumes, Elastic IPs, AMIs
- ResourceTable of instances with columns: Instance ID, Name, Type, State (StatusIndicator), Status checks, AZ, Public IP, Private IP, Key pair, Launch time
- Actions (on selection): Start, Stop, Reboot, Terminate (ConfirmModal), Connect
- "Launch instances" → 7-step Wizard: Name+Tags → AMI → Instance type → Key pair → Network settings → Storage → Advanced

**Connect Modal:**
- 3 tabs: SSH (shows ssh command), EC2 Instance Connect, Session Manager
- SSH tab shows: `ssh -i "{keyName}.pem" ec2-user@{publicIp}`

**SDK Operations:** `DescribeInstancesCommand`, `RunInstancesCommand`, `StartInstancesCommand`, `StopInstancesCommand`, `RebootInstancesCommand`, `TerminateInstancesCommand`, `DescribeSecurityGroupsCommand`, `CreateSecurityGroupCommand`, `DeleteSecurityGroupCommand`, `AuthorizeSecurityGroupIngressCommand`, `RevokeSecurityGroupIngressCommand`, `DescribeKeyPairsCommand`, `CreateKeyPairCommand`, `DeleteKeyPairCommand`, `DescribeVolumesCommand`, `CreateVolumeCommand`, `AttachVolumeCommand`, `DetachVolumeCommand`, `DeleteVolumeCommand`, `DescribeAddressesCommand`, `AllocateAddressCommand`, `AssociateAddressCommand`, `DisassociateAddressCommand`, `ReleaseAddressCommand`, `DescribeImagesCommand`, `DeregisterImageCommand`, `DescribeSnapshotsCommand`, `CreateSnapshotCommand`, `DeleteSnapshotCommand`

---

### 6.3 VPC

**Routes:** `/vpc`, `/subnet`, `/route-table`, `/internet-gateway`, `/nat-gateway`, `/network-acl`, `/ec2-vpc-endpoint`, `/ec2-vpc-peering`, `/transit-gateway`
**API:** `/api/vpc`, `/api/vpc/subnets`, `/api/vpc/route-tables`, `/api/vpc/internet-gateways`, `/api/vpc/nat-gateways`, `/api/vpc/network-acls`, `/api/vpc/endpoints`, `/api/vpc/peering`

**VPC List (`/vpc`):** ResourceTable: VPC ID, Name, State, IPv4 CIDR, IPv6 CIDR, DHCP options, Default. Create via Modal (Name, IPv4 CIDR, IPv6, Tenancy, Tags, optional "VPC and more" to create subnets + IGW in one step).

**Subnet List (`/subnet`):** VPC ID, Name, State, IPv4 CIDR, Available IPs, AZ, Auto-assign public IP, Route table.

**Route Tables (`/route-table`):** Table with inline route editor (destination/target pairs) and subnet association editor.

**Network ACLs (`/network-acl`):** Table with inbound/outbound rules sub-tables. Rule editor: rule number, type, protocol, port range, source, allow/deny.

**SDK Operations:** `DescribeVpcsCommand`, `CreateVpcCommand`, `DeleteVpcCommand`, `DescribeSubnetsCommand`, `CreateSubnetCommand`, `DeleteSubnetCommand`, `DescribeRouteTablesCommand`, `CreateRouteCommand`, `DeleteRouteCommand`, `AssociateRouteTableCommand`, `DescribeInternetGatewaysCommand`, `CreateInternetGatewayCommand`, `AttachInternetGatewayCommand`, `DetachInternetGatewayCommand`, `DeleteInternetGatewayCommand`, `DescribeNatGatewaysCommand`, `CreateNatGatewayCommand`, `DeleteNatGatewayCommand`, `DescribeNetworkAclsCommand`, `CreateNetworkAclEntryCommand`, `DeleteNetworkAclEntryCommand`, `DescribeVpcEndpointsCommand`, `DescribeVpcPeeringConnectionsCommand`

---

### 6.4 IAM

**Routes:** `/iam` (tabbed), `/iam/users/[userName]`, `/iam/roles/[roleName]`, `/iam-password-policy`, `/iam-access-key`, `/iam-group`, `/iam-instance-profile`
**API:** `/api/iam` (users/groups/roles/policies CRUD), `/api/iam/access-keys`, `/api/iam/password-policy`

**Data Models:**
```ts
interface IAMUser {
  UserName: string;
  UserId: string;
  Arn: string;
  CreateDate: string;
  PasswordLastUsed?: string;
  MFAEnabled: boolean;
}
interface IAMRole {
  RoleName: string;
  RoleId: string;
  Arn: string;
  CreateDate: string;
  AssumeRolePolicyDocument: string;
  Description?: string;
}
```

**IAM Dashboard (`/iam`):**
- Summary row: Users count, Groups count, Roles count, Policies count
- 5-tab layout: Users | Groups | Roles | Policies | Identity providers
- **Users tab:** ResourceTable (UserName, Groups, Last activity, MFA). "Create user" → 5-step Wizard
- **Roles tab:** ResourceTable (Role name, Trusted entities, Last activity). "Create role" → 4-step Wizard
- **Policies tab:** Two ResourceTables — AWS managed + Customer managed. "Create policy" → JSON editor or visual builder

**User Detail (`/iam/users/[userName]`):**
- Tabs: Permissions | Groups | Tags | Security credentials
- Security credentials tab: Access keys table (ID, Status, Created, Last used) + "Create access key" button → shows secret once in modal with CSV download

**SDK Operations:** `ListUsersCommand`, `CreateUserCommand`, `DeleteUserCommand`, `GetUserCommand`, `ListGroupsCommand`, `CreateGroupCommand`, `DeleteGroupCommand`, `AddUserToGroupCommand`, `RemoveUserFromGroupCommand`, `ListRolesCommand`, `CreateRoleCommand`, `DeleteRoleCommand`, `ListPoliciesCommand`, `CreatePolicyCommand`, `DeletePolicyCommand`, `AttachUserPolicyCommand`, `DetachUserPolicyCommand`, `AttachRolePolicyCommand`, `DetachRolePolicyCommand`, `ListAccessKeysCommand`, `CreateAccessKeyCommand`, `DeleteAccessKeyCommand`, `UpdateAccessKeyCommand`, `GetAccountPasswordPolicyCommand`, `UpdateAccountPasswordPolicyCommand`

---

### 6.5 Lambda

**Routes:** `/lambda`, `/lambda/[functionName]`, `/lambda-layer`, `/lambda-alias`
**API:** `/api/lambda` (functions CRUD, invoke), `/api/lambda/versions`, `/api/lambda/aliases`, `/api/lambda/layers`, `/api/lambda/config`

**Function List (`/lambda`):**
- ResourceTable: Name (link), Description, Runtime, Package type, Last modified, Code size, Memory, Timeout
- "Create function" → 3-option wizard: Author from scratch | Container image | Serverless app repository

**Function Detail (`/lambda/[functionName]`):**
- Tabs: Code | Test | Monitor | Configuration | Aliases | Versions
- **Code tab:** Textarea code editor + "Deploy" button → `UpdateFunctionCodeCommand`
- **Test tab:** JSON payload Textarea + "Invoke" button → displays response payload, status, duration, billed duration
- **Configuration tab:** Sub-nav: General config (memory/timeout/description), Permissions (role ARN, resource policy), Environment variables (key-value table), VPC, Layers, Concurrency, Async invocation

**SDK Operations:** All from requirements + `GetFunctionCommand`, `UpdateFunctionCodeCommand`, `UpdateFunctionConfigurationCommand`, `PublishVersionCommand`, `ListVersionsByFunctionCommand`, `CreateAliasCommand`, `UpdateAliasCommand`, `DeleteAliasCommand`, `ListAliasesCommand`, `CreateLayerVersionCommand`, `ListLayersCommand`, `ListLayerVersionsCommand`, `PutFunctionConcurrencyCommand`, `CreateEventSourceMappingCommand`, `ListEventSourceMappingsCommand`

---

### 6.6 DynamoDB

**Routes:** `/dynamodb`, `/dynamodb/[tableName]`
**API:** `/api/dynamodb` (tables), `/api/dynamodb/items` (item CRUD, scan, query), `/api/dynamodb/indexes`

**Table List (`/dynamodb`):**
- ResourceTable: Name, Status, Partition key, Sort key, Item count, Table size, Table class, Billing mode
- "Create table" → Modal: Name, Partition key (name + type), Sort key (optional), Settings (billing mode, read/write capacity), Secondary indexes, Encryption

**Table Detail (`/dynamodb/[tableName]`):**
- Tabs: Explore items | Indexes | Monitor | Global tables | Additional settings
- **Explore items tab:** Toggle Scan/Query. Scan: filter expression + projection expression. Query: partition key input + optional sort key condition. Results in ResourceTable. Per-row: Edit (JSON editor modal), Delete (ConfirmModal). "Create item" → JSON editor modal with `PutItemCommand`.
- **Indexes tab:** GSI and LSI tables. "Create GSI" → form (index name, partition key, sort key, projection type, capacity)

**SDK Operations:** All from requirements + `DescribeTableCommand`, `ListTagsOfResourceCommand`

---

### 6.7 RDS

**Routes:** `/rds`, `/rds/[dbId]`
**API:** `/api/rds`

**Database List (`/rds`):**
- 7-tab page: Databases | Query Editor | Snapshots | Parameter groups | Option groups | Events | Recommendations
- **Databases tab:** ResourceTable: DB ID, Role, Engine, Status, Size, Multi-AZ, Storage, Endpoint, Created
- "Create database" → 4-step Wizard: Engine selection → Template → Settings (identifier, credentials, class) → Connectivity

**DB Detail (`/rds/[dbId]`):**
- Tabs: Connectivity & security | Configuration | Monitoring | Logs & events | Maintenance & backups | Tags

**SDK Operations:** `CreateDBInstanceCommand`, `ModifyDBInstanceCommand`, `DeleteDBInstanceCommand`, `StopDBInstanceCommand`, `StartDBInstanceCommand`, `RebootDBInstanceCommand`, `DescribeDBInstancesCommand`, `CreateDBSnapshotCommand`, `RestoreDBInstanceFromDBSnapshotCommand`, `DescribeDBSnapshotsCommand`

---

### 6.8 SQS

**Routes:** `/sqs`, `/sqs/[queueName]`
**API:** `/api/sqs`

**Queue List (`/sqs`):**
- ResourceTable: Name, Type (Standard/FIFO), Messages available, In flight, Delayed, Last modified, URL
- "Create queue" → Modal: Type, Name, Configuration (visibility timeout, retention, max size, delay, wait time), Encryption, Access policy, DLQ, Tags

**Queue Detail (`/sqs/[queueName]`):**
- Tabs: Messages | Monitoring | Configuration | Access policy | Encryption | Dead-letter queue | Tags
- **Messages tab:** "Send message" button (Modal: body, attributes, delay/dedup/group IDs). "Poll for messages" button → calls `ReceiveMessageCommand` → displays table of messages with expand for body. "Purge" button (ConfirmModal).

**SDK Operations:** `GetQueueUrlCommand`, `GetQueueAttributesCommand`, `SetQueueAttributesCommand`, `SendMessageCommand`, `ReceiveMessageCommand`, `DeleteMessageCommand`, `PurgeQueueCommand`, `ChangeMessageVisibilityCommand`, `SendMessageBatchCommand`, `TagQueueCommand`

---

### 6.9 SNS

**Routes:** `/sns`, `/sns/[topicArn]`
**API:** `/api/sns`

**Topics List (`/sns`):**
- Tabs: Topics | Subscriptions | Mobile push credentials
- **Topics tab:** ResourceTable: Name, Type, Subscriptions, ARN
- "Create topic" → Modal: Type, Name, Display name, Encryption, Access policy, Delivery policy, Tags
- "Publish message" → Modal: Body, Subject, Attributes, Structure

**Topic Detail (`/sns/[topicArn]`):**
- Tabs: Subscriptions | Access policy | Delivery status | Encryption | Tags
- "Create subscription" Modal: Protocol + Endpoint

**SDK Operations:** `ListTopicsCommand`, `CreateTopicCommand`, `DeleteTopicCommand`, `GetTopicAttributesCommand`, `SetTopicAttributesCommand`, `SubscribeCommand`, `UnsubscribeCommand`, `ListSubscriptionsCommand`, `ListSubscriptionsByTopicCommand`, `PublishCommand`, `PublishBatchCommand`

---

### 6.10 CloudWatch

**Routes:** `/cloudwatch` (home), `/cloudwatch/alarms`, `/cloudwatch/dashboards`, `/cloudwatch-logs`, `/cloudwatch-logs/[logGroup]`, `/cloudwatch/metrics`, `/cloudwatch/log-insights`
**API:** `/api/cloudwatch` (alarms, metrics, dashboards), `/api/cloudwatch-logs`

**CloudWatch Home (`/cloudwatch`):**
- Navigation cards linking to: Dashboards, Alarms, Logs, Metrics

**Alarms (`/cloudwatch/alarms`):**
- ResourceTable: Name, State (color-coded StatusIndicator), Metric, Threshold, Actions, Created
- "Create alarm" → 3-step Wizard: Select metric (namespace browser) → Conditions (period, statistic, threshold, evaluation periods) → Actions (SNS, EC2, Auto Scaling) + Name

**Log Groups (`/cloudwatch-logs`):**
- ResourceTable: Log group name, Retention, Metric filters, KMS key, Stored bytes
- Click → Log streams list → Click stream → paginated log events (timestamp + message)

**Log Insights:**
- Textarea query editor + time range selector (Cloudscape DateRangePicker) + "Run query" → polls until complete → tabular results

**Metrics:**
- Namespace browser → metrics within namespace → add to line chart (Cloudscape `LineChart`)

**SDK Operations:** All from requirements

---

### 6.11 CloudFormation

**Routes:** `/cloudformation`, `/cloudformation/[stackName]`
**API:** `/api/cloudformation`

**Stack List (`/cloudformation`):**
- Tabs: Stacks | StackSets | Exports
- ResourceTable: Stack name, Status (color-coded), Created, Updated, Drift status, Description
- "Create stack" → 4-step Wizard: Template (upload/URL/sample) → Parameters → Options (tags, policy, rollback) → Review

**Stack Detail (`/cloudformation/[stackName]`):**
- Tabs: Events | Resources | Outputs | Parameters | Template | Change sets | Drift results
- **Events tab:** Auto-polling every 5s during CREATING/UPDATING/DELETING. Table: Timestamp, Logical ID, Physical ID, Resource type, Status, Status reason
- "Update stack" / "Delete stack" (ConfirmModal → poll until done)

**SDK Operations:** All from requirements

---

### 6.12 Step Functions

**Routes:** `/step-functions`, `/step-functions/[arn]`, `/step-functions/[arn]/executions/[execArn]`
**API:** `/api/step-functions`

**State Machine List (`/step-functions`):**
- Tabs: State machines | Activities
- ResourceTable: Name, Type, Status, Created, Executions (7 days)
- "Create" → 2-step Wizard: Definition (JsonEditor with ASL) → Settings (name, type, role, logging)

**State Machine Detail (`/step-functions/[arn]`):**
- Tabs: Definition | Executions | Logging | Monitoring | Tags
- **Executions tab:** ResourceTable: Name, Status, Start, End, Duration. "Start execution" → JsonEditor input modal

**Execution Detail:**
- Input/Output JSON, status, step trace list (state name → status → start/end time), events table

---

### 6.13 KMS

**Routes:** `/kms`, `/kms/[keyId]`
**API:** `/api/kms`

**Key List (`/kms`):**
- Tabs: Customer managed keys | AWS managed keys | Custom key stores
- ResourceTable: Alias, Key ID, Status (StatusIndicator), Created, Origin
- "Create key" → 4-step Wizard: Key config (symmetric/asymmetric, usage, spec) → Labels (alias, description) → Admin permissions → Usage permissions

**Key Detail (`/kms/[keyId]`):**
- Tabs: General config | Cryptographic config | Aliases | Key policy | Tags | Key rotation
- Key policy tab: JsonEditor with `GetKeyPolicyCommand` / `PutKeyPolicyCommand`
- Key rotation tab: toggle + status

---

### 6.14 Secrets Manager

**Routes:** `/secrets-manager`, `/secrets-manager/[secretId]`
**API:** `/api/secrets-manager`

**Secret List:** ResourceTable: Name, Description, Last retrieved, Last changed, Rotation, KMS key
"Store new secret" → 4-step Wizard: Type → Value (key-value or plaintext) → Name/description → Rotation

**Secret Detail:** Tabs: Overview | Secret value | Rotation | Tags | Permissions
- Secret value tab: "Retrieve secret value" button (calls `GetSecretValueCommand`) → show/hide toggle

---

### 6.15 Route 53

**Routes:** `/route53`, `/route53/[zoneId]`
**API:** `/api/route53`

**Hosted Zones List:** ResourceTable: Domain, Type, Record count, Comment, Zone ID
"Create hosted zone" → Modal: Domain, Comment, Type (Public/Private), VPC (for private)

**Zone Detail:** Records ResourceTable: Name, Type, Routing policy, Value, TTL, Alias
"Create record" → Modal with all record type fields + routing policy options

---

### 6.16 ECS

**Routes:** `/ecs-cluster`, `/ecs-cluster/[clusterName]`, `/ecs-service`, `/fargate`
**API:** `/api/ecs`

**Cluster List:** ResourceTable: Name, Status, Active services, Running tasks, Pending tasks, Container instances
"Create cluster" → Wizard: Name, Infrastructure (Fargate/EC2), Networking, Monitoring, Tags

**Cluster Detail:** Tabs: Services | Tasks | Scheduled tasks | Infrastructure | Metrics | Tags
Services tab: "Create service" → Wizard: Launch type, Task definition, Name, Desired count, Load balancer, Networking

---

### 6.17 Systems Manager Parameter Store

**Routes:** `/systems-manager-parameter-store`, `/systems-manager-parameter-store/[name]`
**API:** `/api/ssm`

**Parameter List:** ResourceTable: Name, Tier, Type, Last modified, Version
"Create parameter" → Form: Name (path hierarchy), Description, Tier, Type, KMS key, Value (Textarea), Tags

**Parameter Detail:** Version history table. "Edit" → `PutParameterCommand` with Overwrite flag.

---

### 6.18 Kinesis

**Routes:** `/kinesis`, `/kinesis/[streamName]`
**API:** `/api/kinesis`

**Stream List:** ResourceTable: Name, Status, Shards, Data retention, Encryption, Stream mode, Created
"Create stream" → Form: Name, Capacity mode (On-demand/Provisioned with shard count), Tags

**Stream Detail:** Tabs: Details | Monitoring | Data viewer | Consumer | Tags
Data viewer tab: Shard selector, Starting position selector (TRIM_HORIZON/AT_SEQUENCE_NUMBER/AT_TIMESTAMP) → "Get records" → table of records

---

### 6.19 EventBridge

**Routes:** `/eventbridge-schema` (main), `/eventbridge-pipe`, `/eventbridge-scheduler`
**API:** `/api/eventbridge`

**Main page:** Tabs: Buses | Rules | Pipes | Scheduler | Schema registry | Replay

**Rules tab:** ResourceTable per selected bus: Name, State, Pattern, Target count, Created
"Create rule" → Wizard: Detail (name, bus) → Pattern (predefined/custom JSON) → Target (Lambda/SQS/SNS/SFN) → Tags

**Pipes page:** ResourceTable: Name, State, Source, Filter, Enrichment, Target, Created

**Scheduler page:** ResourceTable: Name, Schedule type, Expression, Flexible window, Target, State

---

### 6.20 Cognito

**Routes:** `/cognito`, `/cognito/[poolId]`
**API:** `/api/cognito`

**User Pool List:** ResourceTable: Name, Pool ID, Status, Users, Created
"Create user pool" → 5-step Wizard: Sign-in → Security → Sign-up → Messaging → App client

**Pool Detail:** Tabs: Users | Groups | App clients | Triggers | Attributes | Policies | MFA | Messaging | Domain | UI
Users tab: ResourceTable (Username, Status, Email verified, Phone verified, Created) + create/disable/reset password/delete

---

## 7. aws-clients.ts — Full Client List

**Existing (17):** S3Client, DynamoDBClient, LambdaClient, SQSClient, SNSClient, IAMClient, STSClient, CloudWatchClient, EC2Client, RDSClient, KMSClient, SecretsManagerClient, CloudFormationClient, Route53Client, SSMClient, ECSClient, ElastiCacheClient

**New clients to add:**
```ts
import { SFNClient } from "@aws-sdk/client-sfn";
import { EventBridgeClient } from "@aws-sdk/client-eventbridge";
import { CloudWatchLogsClient } from "@aws-sdk/client-cloudwatch-logs";
import { ACMClient } from "@aws-sdk/client-acm";
import { ECRClient } from "@aws-sdk/client-ecr";
import { EKSClient } from "@aws-sdk/client-eks";
import { KinesisClient } from "@aws-sdk/client-kinesis";
import { FirehoseClient } from "@aws-sdk/client-firehose";
import { GlueClient } from "@aws-sdk/client-glue";
import { AthenaClient } from "@aws-sdk/client-athena";
import { CognitoIdentityProviderClient } from "@aws-sdk/client-cognito-identity-provider";
import { SESClient } from "@aws-sdk/client-ses";
import { SESv2Client } from "@aws-sdk/client-sesv2";
import { SchedulerClient } from "@aws-sdk/client-scheduler";
import { PipesClient } from "@aws-sdk/client-pipes";
import { BackupClient } from "@aws-sdk/client-backup";
import { EFSClient } from "@aws-sdk/client-efs";
```

**All exports use `getClient()` factory — no top-level singletons except for backward compat aliases.**

---

## 8. State Management

| Store | Location | Fields |
|-------|----------|--------|
| Settings | `src/stores/settings.ts` (Zustand) | `region`, `theme`, `provider` |
| Service data | React local state per page | items, loading, selectedItems |
| Notifications | `NotificationContext` | notifications[] queue |
| Nav expanded | `localStorage["nav_{cat}"]` | boolean per category |
| Table prefs | `localStorage["prefs_{svcKey}"]` | columns, pageSize |

TanStack Query is available but services use `useAwsApi` hook which manages cache invalidation internally via simple refetch-on-mutation pattern.

---

## 9. Styling and Theme

| Token | Dark | Light (Cloudscape) |
|-------|------|--------------------|
| Page background | `#0b0d14` | Cloudscape default |
| Panel background | `#232f3e` | Cloudscape default |
| Card background | `#1a2332` | Cloudscape default |
| Border | `#3d4755` | Cloudscape default |
| Muted text | `#879596` | Cloudscape default |

- All theme switching via `applyMode('dark' | 'light')` from `@cloudscape-design/global-styles`
- Dark mode uses inline `style` for page-level backgrounds; Cloudscape handles component-level colors
- Light mode: remove inline background overrides, rely entirely on Cloudscape

---

## 10. Accessibility

- All Cloudscape components pass ARIA attributes automatically
- `useEffect` focus trap in Modals and Wizards handled by Cloudscape out of the box
- All `FormField` labels connected via `label` prop (not `aria-label` on input)
- Page `<title>`: `"{Service Name} | AWS Console"` — set via Next.js `export const metadata`
- No custom `div`/`span` wrappers around Cloudscape interactive elements

---

## 11. Performance

- `React.memo` on `ResourceTable` and `DetailTabs`
- `useCallback` on all event handlers in service pages
- `useMemo` for filtered/sorted items in ResourceTable
- Server-side pagination via `NextToken`/`Marker` for lists > 1000 items
- Next.js App Router automatic code splitting per service page
- Images: none (all Cloudscape icons are SVG via CSS)


## 12. Error Handling

### API Route Layer

Every API route wraps its SDK call in a `try/catch` and maps exceptions to structured HTTP responses:

```ts
try {
  // SDK call
  return NextResponse.json({ items });
} catch (err: any) {
  const isUnreachable =
    err.code === 'ECONNREFUSED' || err.cause?.code === 'ECONNREFUSED';
  return NextResponse.json(
    { error: err.message, code: isUnreachable ? 'EMULATOR_UNREACHABLE' : err.name },
    { status: isUnreachable ? 503 : 500 }
  );
}
```

| Scenario | HTTP Status | `code` | UI treatment |
|----------|-------------|----------|--------------|
| Emulator not running | 503 | `EMULATOR_UNREACHABLE` | Persistent Flashbar banner |
| Resource not found | 404 | SDK error name | Error notification, stay on page |
| Bad input / validation | 400 | SDK error name | Inline FormField errorText |
| Unexpected SDK error | 500 | SDK error name | Error notification |

### Client Layer (`useAwsApi`)

- GET failures → set `error` state + `addNotification('error', message)`
- Mutation failures → `mutate()` rejects; hook calls `addNotification('error', ...)` automatically
- `EMULATOR_UNREACHABLE` → persistent Flashbar + `useSettingsStore().provider = 'unknown'`

### User-Facing Error UX

- **Inline**: SDK validation errors on form fields shown as `FormField errorText`
- **Toast**: All other errors appear as Cloudscape Flashbar items — persistent, dismissible
- **Empty states**: 0-item lists show the ResourceTable empty state (not an error)
- **Loading**: `ResourceTable` `loading=true` during all in-flight fetches; Wizard submit buttons disabled + spinner

---

## 13. Correctness Properties

- **No stale credentials**: SDK clients initialized from `process.env` at server startup; credentials never reach the browser bundle.
- **Region consistency**: Every `fetch()` includes `x-aws-region` header; every API route reads it before constructing the client.
- **No optimistic UI**: The table only reflects state confirmed by the emulator. `refetch()` is called after every write before the success notification is shown.
- **`forcePathStyle: true`** on all S3 clients for LocalStack path-style URL compatibility.
- **Single endpoint source**: `AWS_ENDPOINT_URL` in `aws-clients.ts` is the only place the emulator address is set.
- **Selection cleared**: `selectedItems` state is reset after every successful delete or batch operation.
- **Forms reset on close**: All Wizard and Modal fields return to defaults on dismiss, preventing state bleed.
- **ConfirmModal**: case-sensitive, whitespace-sensitive exact match before enabling confirm.

---

## 14. Testing Strategy

### Unit Tests (Vitest + React Testing Library)

- `ResourceTable`: columns, filtering, selection callbacks, empty state
- `ConfirmModal`: disabled until exact name typed, `onConfirm` fires on submit
- `JsonEditor`: invalid JSON shows errorText, valid JSON clears it
- `useAwsApi`: region header injected, error notification on failure, refetch re-triggers
- `NotificationContext`: success auto-dismissed after 5 s (fake timers), errors persist

### Integration Tests (Vitest + MSW)

- Service pages: MSW fixture → table renders → create/delete → correct endpoint + body
- Region switching: Zustand update → subsequent fetch includes updated `x-aws-region`
- Error path: MSW returns 503 → Flashbar renders `EMULATOR_UNREACHABLE`

### End-to-End Tests (Playwright + live LocalStack)

- Smoke (per service): load page → create → verify in table → delete → verify removed
- S3 object browser: create bucket → upload → navigate → download → delete
- Lambda invoke: create function → Test tab → invoke `{}` → assert status 200
- Cross-service: create SQS queue → SNS topic with SQS subscription → publish → poll queue

### File Layout

```
src/
  components/__tests__/ResourceTable.test.tsx
  components/__tests__/ConfirmModal.test.tsx
  components/__tests__/JsonEditor.test.tsx
  hooks/__tests__/useAwsApi.test.ts
e2e/
  s3.spec.ts  lambda.spec.ts  ec2.spec.ts  dynamodb.spec.ts  smoke.spec.ts
```

Coverage target: ≥ 80 % on shared components and hooks; service pages covered by integration + E2E.

## Architecture

The application follows a **Next.js 16 App Router** architecture with strict separation between the browser UI and server-side AWS SDK calls.

```
Browser (React 19 + Cloudscape Design System)
  └─ Next.js 16 App Router
       ├─ Service Pages   /src/app/{service}/page.tsx
       │    └─ useAwsApi hook → fetch('/api/{service}', { headers: { 'x-aws-region': region } })
       ├─ API Routes      /src/app/api/{service}/route.ts
       │    └─ getClient(SdkClient, region) → LocalStack/Ministack @ AWS_ENDPOINT_URL
       ├─ Shared Components  /src/components/
       ├─ Hooks              /src/hooks/
       ├─ Context            /src/context/
       ├─ Zustand Store      /src/stores/settings.ts
       └─ AWS Client Factory /src/lib/aws-clients.ts
```

**Key decisions:**
- AWS SDK v3 runs exclusively in Next.js API routes (Node.js runtime) — never in the browser bundle.
- `getClient(ClientClass, region)` caches one SDK instance per `{ClientClass}::{region}` key, avoiding re-initialization on every request.
- Every API route reads the `x-aws-region` request header to support per-request region switching without global server state.
- All SDK clients point to `process.env.AWS_ENDPOINT_URL` (default `http://localhost:4566`), making LocalStack ↔ Ministack switching trivial.
- Each service page is automatically code-split by Next.js App Router.

See **§1 System Architecture** for full data-flow diagrams (region override, provider detection, write mutation flow).

---

## Components and Interfaces

All shared UI components are in `/src/components/` and built exclusively on **Cloudscape Design System** primitives.

### Shared Component Summary

| Component | File | Purpose |
|-----------|------|---------|
| `AppShell` | `AppShell.tsx` | Root layout: TopNavigation + SideNavigation (130+ services, 11 categories) + BreadcrumbGroup + NotificationBar |
| `ResourceTable<T>` | `ResourceTable.tsx` | Generic paginated, filterable, sortable, multi-select table for any resource type |
| `ConfirmModal` | `ConfirmModal.tsx` | Destructive-action guard — requires exact resource name before enabling confirm |
| `JsonEditor` | `JsonEditor.tsx` | Validated JSON Textarea with auto-format on blur and inline error |
| `TagEditor` | `TagEditor.tsx` | Dynamic key-value row editor for AWS resource tags |
| `NotificationContext` | `context/NotificationContext.tsx` | Global Cloudscape Flashbar queue (success auto-dismiss 5 s, errors persistent) |

### Hook Interfaces

| Hook | File | Purpose |
|------|------|---------|
| `useAwsApi<T>` | `hooks/useAwsApi.ts` | Unified fetch + mutation hook — injects `x-aws-region` header, surfaces errors via NotificationContext |
| `useSettingsStore` | `stores/settings.ts` | Zustand store for `region`, `theme`, `provider` |

### Key Component Contracts

**`ResourceTable<T>`** accepts `columnDefinitions`, `items`, `loading`, `selectedItems`, `onSelectionChange`, filtering props, pagination props, and `preferences`. Persists column visibility and page size to `localStorage['prefs_{serviceKey}']`.

**`useAwsApi<T>(url, options)`** returns `{ data, loading, error, refetch, mutate }`. Auto-fetches on mount for GET. `mutate(url, opts)` handles POST/PUT/DELETE and triggers notifications automatically.

**`NotificationContext`** exposes `addNotification(type, message, header?)` and `dismissNotification(id)`. Success items removed after 5 s; errors require explicit dismiss.

See **§2 Component Hierarchy** and **§3 Shared Components** for full TypeScript prop interfaces.

---

## Data Models

Core TypeScript interfaces. Full per-service models are in **§6 Per-Service Design** and `/src/lib/types.ts`.

```ts
// AWS SDK client factory config
interface AwsClientConfig {
  endpoint: string;
  region: string;
  credentials: { accessKeyId: string; secretAccessKey: string };
  forcePathStyle?: boolean;
}

// Standard API response envelopes
type ApiSuccess<T> = { data: T } | { items: T[]; nextToken?: string };
type ApiError     = { error: string; code: string };   // HTTP 4xx/5xx

// Global Zustand store
interface SettingsStore {
  region: string;
  theme: 'dark' | 'light';
  provider: 'ministack' | 'localstack' | 'unknown';
}

// Notification
interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  header?: string;
  dismissible?: boolean;
}

// Tag (universal across all services)
interface Tag { key: string; value: string; }

// S3
interface S3Bucket {
  Name: string; CreationDate: string; Region: string;
  Versioning: 'Enabled' | 'Suspended' | 'Disabled';
  Encryption: 'SSE-S3' | 'SSE-KMS' | 'None';
  PublicAccess: 'Blocked' | 'Allowed';
}
interface S3Object {
  Key: string; Size: number; LastModified: string;
  StorageClass: string; ETag: string;
}

// EC2
interface EC2Instance {
  InstanceId: string; Name: string; InstanceType: string;
  State: { Name: 'running' | 'stopped' | 'pending' | 'terminated' };
  PublicIpAddress?: string; PrivateIpAddress?: string;
  KeyName?: string; LaunchTime: string; AvailabilityZone: string;
  VpcId?: string; SubnetId?: string;
  SecurityGroups: { GroupId: string; GroupName: string }[];
}

// IAM
interface IAMUser {
  UserName: string; UserId: string; Arn: string;
  CreateDate: string; PasswordLastUsed?: string; MFAEnabled: boolean;
}
interface IAMRole {
  RoleName: string; RoleId: string; Arn: string;
  CreateDate: string; AssumeRolePolicyDocument: string; Description?: string;
}
```

Additional models for Lambda, DynamoDB, RDS, SQS, SNS, CloudWatch, CloudFormation, Step Functions, KMS, Secrets Manager, Route 53, ECS, SSM, Kinesis, EventBridge, and Cognito are defined inline in **§6 Per-Service Design**.

---

## Correctness Properties

- **No stale credentials**: SDK clients initialized from `process.env` at server startup; credentials never reach the browser bundle.
- **Region consistency**: Every `fetch()` includes `x-aws-region` header matching `useSettingsStore().region`; every API route reads it before constructing the SDK client.
- **No optimistic UI**: The table only reflects state confirmed by the emulator. `refetch()` is called after every write mutation before showing the success notification.
- **`forcePathStyle: true`** on all S3 clients for LocalStack/Ministack path-style URL compatibility.
- **Single endpoint source**: `AWS_ENDPOINT_URL` in `aws-clients.ts` is the only place the emulator address appears.
- **Selection cleared**: `selectedItems` state reset after every successful delete or batch operation.
- **Forms reset on close**: All Wizard and Modal fields return to defaults on dismiss — no state bleed between sessions.
- **ConfirmModal**: case-sensitive, whitespace-sensitive exact resource-name match before confirm is enabled.

---

## Error Handling

### API Route Layer

Every route wraps SDK calls in `try/catch` and maps to structured HTTP responses:

```ts
try {
  return NextResponse.json({ items });
} catch (err: any) {
  const isUnreachable = err.code === 'ECONNREFUSED' || err.cause?.code === 'ECONNREFUSED';
  return NextResponse.json(
    { error: err.message, code: isUnreachable ? 'EMULATOR_UNREACHABLE' : err.name },
    { status: isUnreachable ? 503 : 500 }
  );
}
```

| Scenario | Status | `code` | UI treatment |
|----------|--------|---------|--------------|
| Emulator not running | 503 | `EMULATOR_UNREACHABLE` | Persistent Flashbar banner |
| Resource not found | 404 | SDK error name | Error notification |
| Bad input | 400 | SDK error name | Inline `FormField errorText` |
| Unexpected SDK error | 500 | SDK error name | Error notification |

### Client Layer

- GET failure → `error` state + `addNotification('error', ...)`
- Mutation failure → `mutate()` rejects; hook calls `addNotification('error', ...)` automatically
- `EMULATOR_UNREACHABLE` → persistent Flashbar + `provider` set to `'unknown'` in Zustand

---

## Testing Strategy

### Unit Tests (Vitest + React Testing Library)

- `ResourceTable`: columns, filtering, selection callbacks, empty state
- `ConfirmModal`: disabled until exact name typed; `onConfirm` fires on submit
- `JsonEditor`: invalid JSON shows errorText; valid JSON clears it
- `useAwsApi`: region header injected; error notification on failure; refetch re-triggers
- `NotificationContext`: success auto-dismissed after 5 s (fake timers); errors persist

### Integration Tests (Vitest + MSW)

- Service pages: MSW fixture → table renders → create/delete → correct endpoint + body
- Region switching: Zustand update → subsequent fetch includes updated `x-aws-region`
- Error path: MSW returns 503 → Flashbar renders `EMULATOR_UNREACHABLE`

### End-to-End Tests (Playwright + live LocalStack)

- Smoke per service: load → create → verify in table → delete → verify removed
- S3 object browser: create bucket → upload → navigate → download → delete
- Lambda invoke: create function → Test tab → invoke `{}` → assert status 200
- Cross-service: create SQS queue → SNS subscription → publish → poll queue

```
src/
  components/__tests__/ResourceTable.test.tsx
  components/__tests__/ConfirmModal.test.tsx
  components/__tests__/JsonEditor.test.tsx
  hooks/__tests__/useAwsApi.test.ts
e2e/
  s3.spec.ts  lambda.spec.ts  ec2.spec.ts  dynamodb.spec.ts  smoke.spec.ts
```

Coverage target: ≥ 80 % on shared components and hooks; service pages via integration + E2E.
