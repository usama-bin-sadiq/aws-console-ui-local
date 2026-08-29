# Design Document — AWS Console Clone Completion

## Overview

This document covers the architecture, component hierarchy, data flows, API specifications, and implementation strategy for completing the AWS Console Clone to full feature parity. The application is a Next.js 16 (React 19, TypeScript strict) web app using Cloudscape Design System, AWS SDK v3, better-sqlite3, xterm.js, and Zustand.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser (Client)                         │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  AppShell.tsx                                            │   │
│  │  ├── TopNavigation (search, region, theme, terminal btn) │   │
│  │  ├── SideNavigation (NAVIGATION_ITEMS)                   │   │
│  │  ├── AppLayout content → {children} (service pages)     │   │
│  │  └── SplitPanel → xterm Terminal                        │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  State: Zustand (useSettingsStore) + React local state          │
│  Data: TanStack Query for server state (future) / fetch() now   │
└──────────────────────┬──────────────────────────────────────────┘
                       │ HTTP (fetch)
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Next.js 16 API Routes                       │
│                   src/app/api/{service}/route.ts                │
│                                                                 │
│  GET  → list resources     (ListXxxCommand)                    │
│  POST → create / action    (body.action switch dispatch)       │
│  PUT  → update resource    (UpdateXxxCommand)                  │
│  DELETE → remove resource  (?name= or ?id= query param)        │
│                                                                 │
│  Special routes:                                                │
│  /api/terminal  POST → child_process.spawn aws CLI             │
│  /api/terminal  GET  → terminal history from SQLite            │
│  /api/widgets   GET/PUT/POST → widget config from SQLite       │
│  /api/health    GET  → provider detection                      │
└──────────────────────┬──────────────────────────────────────────┘
                       │ AWS SDK v3
                       ▼
┌──────────────────────────────────────────────────────────────┐
│              aws-clients.ts — getClient() factory            │
│              All 98 clients → http://localhost:4566          │
│              (Ministack or LocalStack)                       │
└──────────────────────────────────────────────────────────────┘
                       │
┌──────────────────────▼───────────────────────────────────────┐
│              SQLite (better-sqlite3)  data/console.db        │
│              db.ts — widget_config, favorites,               │
│              recently_visited, terminal_history              │
└──────────────────────────────────────────────────────────────┘
```

---

## Component Hierarchy

```
src/
├── app/
│   ├── layout.tsx                    — root layout, ThemeProvider, AppShell
│   ├── page.tsx                      — Dashboard (WidgetContainer)
│   ├── api/
│   │   ├── health/route.ts
│   │   ├── terminal/route.ts         ← NEW
│   │   ├── widgets/route.ts
│   │   ├── favorites/route.ts
│   │   ├── recently-visited/route.ts
│   │   ├── {18 existing services}/
│   │   └── {43 new services}/        ← NEW (batched in 6 groups)
│   └── {147 service pages}/
│       ├── {42 stub pages}           ← REPLACE with real implementations
│       └── {existing real pages}
│
├── components/
│   ├── AppShell.tsx
│   ├── JsonEditor.tsx                — enhanced with IAM policy templates
│   ├── IamPolicyEditor.tsx           ← NEW wrapper around JsonEditor
│   ├── ResourceTable.tsx
│   ├── TagEditor.tsx
│   ├── ConfirmModal.tsx
│   └── widgets/
│       ├── Widget.tsx
│       ├── WidgetContainer.tsx       — enhanced with drag-and-drop
│       ├── AwsHealthWidget.tsx
│       ├── CostUsageWidget.tsx
│       └── FavoritesWidget.tsx
│
├── lib/
│   ├── aws-clients.ts
│   └── db.ts                         — terminal_history table added
│
├── hooks/
│   └── useGlobalSearch.ts
│
├── stores/
│   └── settings.ts
│
└── constants/
    ├── navigation.ts
    └── regions.ts
```

---

## Data Flow — Service Page Request Cycle

```
1. User navigates to /kinesis

2. page.tsx mounts
   └─ useEffect → fetch("/api/kinesis")

3. /api/kinesis/route.ts GET handler
   └─ kinesis.send(new ListStreamsCommand({}))
      └─ getClient(KinesisClient) → cached singleton → http://localhost:4566

4. Ministack/LocalStack responds
   └─ route.ts returns NextResponse.json({ streams: [...] })

5. page.tsx setState({ streams, loading: false })
   └─ Cloudscape Table renders rows

6. Error path: SDK throws
   └─ catch → NextResponse.json({ error: message }, { status: 500 })
      └─ page.tsx shows Alert type="error"
```

---

## Data Flow — Widget Persistence

```
1. User drags widget from position A to position B
   └─ onDragEnd handler computes new position_x / position_y

2. PUT /api/widgets  { userId, widgetId, updates: { position_x, position_y } }
   └─ db.ts updateWidgetConfig(userId, widgetId, updates)
      └─ SQLite UPDATE widget_config SET position_x=?, position_y=? ...

3. Page re-renders with optimistic update (local state)
   └─ On next load: GET /api/widgets → reads from SQLite
```

---

## Data Flow — Terminal Execution

```
1. User types "aws s3 ls" in xterm, presses Enter

2. AppShell.tsx executeCommand("aws s3 ls", term)
   └─ fetch("/api/terminal", { method: "POST", body: { command: "aws s3 ls" } })

3. /api/terminal POST handler
   └─ spawn("aws", ["s3", "ls"], {
        env: {
          ...process.env,
          AWS_ENDPOINT_URL: "http://localhost:4566",
          AWS_ACCESS_KEY_ID: "test",
          AWS_SECRET_ACCESS_KEY: "test",
          AWS_DEFAULT_REGION: "us-east-1"
        }
      })
   └─ collect stdout + stderr, wait for exit

4. Save to SQLite terminal_history table

5. Return { output: "...", exitCode: 0 }

6. xterm writes output to terminal display
```

---

## Database Schema Additions

The existing `db.ts` has three tables. One addition is needed:

```sql
CREATE TABLE IF NOT EXISTS terminal_history (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id  TEXT    NOT NULL,
  command     TEXT    NOT NULL,
  output      TEXT    NOT NULL DEFAULT '',
  exit_code   INTEGER NOT NULL DEFAULT 0,
  executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_terminal_history_session
  ON terminal_history(session_id, executed_at DESC);
```

**Updated `db.ts` exports:**

```typescript
export interface TerminalHistoryEntry {
  id: number;
  session_id: string;
  command: string;
  output: string;
  exit_code: number;
  executed_at: string;
}

export function addTerminalHistory(
  sessionId: string,
  command: string,
  output: string,
  exitCode: number
): void

export function getTerminalHistory(
  sessionId: string,
  limit: number = 100
): TerminalHistoryEntry[]
```

The `terminal_history` table keeps only the last 500 entries per session to prevent unbounded growth.

---

## Terminal Execution Design

### API Route: `/api/terminal`

```typescript
// GET — fetch history for a session
// Query: ?sessionId=<id>&limit=<n>
// Returns: { history: TerminalHistoryEntry[] }

// POST — execute a command
// Body: { command: string; sessionId: string }
// Returns: { output: string; exitCode: number; error?: string }
```

### Execution Implementation

```typescript
import { spawn } from "child_process";

function runAwsCommand(
  args: string[],
  env: NodeJS.ProcessEnv
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  return new Promise((resolve) => {
    const proc = spawn("aws", args, { env });
    let stdout = "";
    let stderr = "";
    proc.stdout.on("data", (d) => { stdout += d.toString(); });
    proc.stderr.on("data", (d) => { stderr += d.toString(); });
    proc.on("close", (code) => {
      resolve({ stdout, stderr, exitCode: code ?? 1 });
    });
    proc.on("error", (err) => {
      resolve({ stdout: "", stderr: err.message, exitCode: 1 });
    });
    // 30-second timeout
    setTimeout(() => { proc.kill(); resolve({ stdout, stderr: "Timeout", exitCode: 124 }); }, 30_000);
  });
}
```

**Security:** Only `aws` CLI commands are executed (args[0] must be `aws`). The command string is split on whitespace and passed as an args array — never concatenated into a shell string — preventing shell injection.

**Command parsing:** The POST body `command` field is split using a simple shell-aware tokenizer that respects quoted strings. Example: `aws s3 cp "my file.txt" s3://bucket/` → `["aws", "s3", "cp", "my file.txt", "s3://bucket/"]`.

---

## IAM Policy Editor Integration

### Component: `IamPolicyEditor.tsx`

Wraps the existing `JsonEditor.tsx` and adds:

1. **Policy templates** — a ButtonDropdown with common templates:
   - ReadOnly (s3:Get*, s3:List*)
   - AdminAccess (Action: "*", Resource: "*")
   - LambdaExecution (logs:*, xray:*)
   - Custom (blank)

2. **Template structure:**

```typescript
interface PolicyTemplate {
  id: string;
  label: string;
  document: object;
}

const POLICY_TEMPLATES: PolicyTemplate[] = [
  { id: "readonly-s3", label: "S3 Read Only", document: { ... } },
  { id: "admin",       label: "Administrator Access", document: { ... } },
  { id: "lambda-exec", label: "Lambda Execution Role", document: { ... } },
];
```

3. **Integration into IAM pages:** The existing `src/app/iam/page.tsx` role creation modal should replace its placeholder textarea with `<IamPolicyEditor>`. The policy document is passed alongside the role creation request body.

```typescript
// In IAM create-role modal
import IamPolicyEditor from "@/components/IamPolicyEditor";

const [policyDoc, setPolicyDoc] = useState(
  JSON.stringify({ Version: "2012-10-17", Statement: [] }, null, 2)
);
// ...
<IamPolicyEditor
  label="Permissions Policy"
  value={policyDoc}
  onChange={setPolicyDoc}
/>
```

The `JsonEditor` already handles real-time validation and auto-formatting on blur — no additional validation logic is needed.

---

## Widget System Design

### Drag-and-Drop (HTML5, no external library)

The `WidgetContainer` is enhanced with a drag-and-drop controller:

```typescript
// State
const [draggedId, setDraggedId] = useState<string | null>(null);
const [order, setOrder] = useState<string[]>(widgetIds);

// Each widget wrapper
<div
  draggable
  onDragStart={() => setDraggedId(id)}
  onDragOver={(e) => { e.preventDefault(); }}
  onDrop={() => handleDrop(id)}
>
  <Widget ... />
</div>
```

`handleDrop(targetId)` swaps positions in local state and immediately calls:

```
PUT /api/widgets { widgetId, updates: { position_x, position_y } }
```

for both the dragged and target widgets.

### Resize

The Widget component already supports `size: "regular" | "extended"` via `onResize`. Extended maps to `colspan: 12` (full width), regular to `colspan: 6` (half width). On resize:

```
PUT /api/widgets { widgetId, updates: { width: 2 | 1 } }
```

### Widget Visibility Toggle

When `onRemove` fires, the widget is hidden by setting `visible = 0` in SQLite:

```
PUT /api/widgets { widgetId, updates: { visible: 0 } }
```

The customization panel (accessible via the "Customize" button) shows all widgets including hidden ones, with toggles to restore them.

---

## API Route Specifications — 43 New Services

All routes follow the standard pattern:
- Import the appropriate SDK singleton from `@/lib/aws-clients`
- `GET`: list primary resources
- `POST`: action-dispatched via `body.action`; default action creates
- `DELETE`: remove by ID from query params
- All errors: `catch (error: any) → NextResponse.json({ error: error.message }, { status: 500 })`

### Batch 1 — Networking (8 routes)

**`/api/apigateway`** — API Gateway v1
```typescript
import { apigateway } from "@/lib/aws-clients";
// GET → GetRestApisCommand → { apis: [...] }
// POST action="createApi" → CreateRestApiCommand({ name, description })
// POST action="createResource" → CreateResourceCommand
// POST action="createMethod"  → PutMethodCommand
// DELETE ?restApiId= → DeleteRestApiCommand
```

**`/api/apigatewayv2`** — API Gateway v2 (HTTP/WebSocket)
```typescript
import { apigatewayv2 } from "@/lib/aws-clients";
// GET → GetApisCommand → { apis: [...] }
// POST action="create" → CreateApiCommand({ Name, ProtocolType })
// POST action="createStage" → CreateStageCommand
// DELETE ?apiId= → DeleteApiCommand
```

**`/api/cloudfront`** — CloudFront Distributions
```typescript
import { cloudfront } from "@/lib/aws-clients";
// GET → ListDistributionsCommand → { distributions: [...] }
// POST action="create" → CreateDistributionCommand
// DELETE ?id=&etag= → DeleteDistributionCommand
```

**`/api/servicediscovery`** — AWS Cloud Map
```typescript
import { servicediscovery } from "@/lib/aws-clients";
// GET → ListNamespacesCommand → { namespaces: [...] }
// POST action="createNamespace" → CreateHttpNamespaceCommand
// POST action="createService"   → CreateServiceCommand
// DELETE ?id= → DeleteNamespaceCommand
```

**`/api/ses`** — SES v1 Email
```typescript
import { ses } from "@/lib/aws-clients";
// GET → ListIdentitiesCommand → { identities: [...] }
// POST action="verify" → VerifyEmailIdentityCommand({ EmailAddress })
// POST action="send"   → SendEmailCommand({ Source, Destination, Message })
// DELETE ?identity= → DeleteIdentityCommand
```

**`/api/sesv2`** — SES v2 Email
```typescript
import { sesv2 } from "@/lib/aws-clients";
// GET → ListEmailIdentitiesCommand → { identities: [...] }
// POST action="createIdentity" → CreateEmailIdentityCommand
// POST action="send"           → SendEmailCommand
// DELETE ?identityName= → DeleteEmailIdentityCommand
```

**`/api/wafv2`** — WAF v2 Web ACLs
```typescript
import { wafv2 } from "@/lib/aws-clients";
// GET → ListWebACLsCommand({ Scope: "REGIONAL" }) → { webAcls: [...] }
// POST action="create" → CreateWebACLCommand
// DELETE ?name=&id=&lockToken= → DeleteWebACLCommand
```

**`/api/route53resolver`** — Route 53 Resolver
```typescript
import { route53resolver } from "@/lib/aws-clients";
// GET → ListResolverEndpointsCommand → { endpoints: [...] }
// POST action="createEndpoint" → CreateResolverEndpointCommand
// DELETE ?id= → DeleteResolverEndpointCommand
```

---

### Batch 2 — Compute (4 routes)

**`/api/ecs`** — ECS Clusters and Services
```typescript
import { ecs } from "@/lib/aws-clients";
// GET → ListClustersCommand then DescribeClustersCommand → { clusters: [...] }
// POST action="createCluster" → CreateClusterCommand({ clusterName })
// POST action="createService" → CreateServiceCommand({ cluster, serviceName, taskDefinition, desiredCount })
// POST action="listServices"  → ListServicesCommand({ cluster })
// DELETE ?cluster= → DeleteClusterCommand
```

**`/api/emr`** — EMR Clusters
```typescript
import { emr } from "@/lib/aws-clients";
// GET → ListClustersCommand({ ClusterStates: ["RUNNING","WAITING"] }) → { clusters: [...] }
// POST action="create" → RunJobFlowCommand({ Name, Instances, Steps })
// DELETE ?clusterId= → TerminateJobFlowsCommand
```

**`/api/batch`** — AWS Batch
```typescript
import { batch } from "@/lib/aws-clients";
// GET → DescribeComputeEnvironmentsCommand + DescribeJobQueuesCommand
//     → { computeEnvironments: [...], jobQueues: [...] }
// POST action="createComputeEnv" → CreateComputeEnvironmentCommand
// POST action="createJobQueue"   → CreateJobQueueCommand
// POST action="submitJob"        → SubmitJobCommand
// DELETE ?name=&type=(ce|queue) → DeleteComputeEnvironmentCommand | DeleteJobQueueCommand
```

**`/api/eks`** — EKS Clusters
```typescript
import { eks } from "@/lib/aws-clients";
// GET → ListClustersCommand → then DescribeClusterCommand for each → { clusters: [...] }
// POST action="create" → CreateClusterCommand({ name, version, resourcesVpcConfig })
// DELETE ?name= → DeleteClusterCommand
```

---

### Batch 3 — Storage (4 routes)

**`/api/efs`** — Elastic File System
```typescript
import { efs } from "@/lib/aws-clients";
// GET → DescribeFileSystemsCommand → { fileSystems: [...] }
// POST action="create" → CreateFileSystemCommand({ CreationToken, PerformanceMode })
// DELETE ?fileSystemId= → DeleteFileSystemCommand
```

**`/api/backup`** — AWS Backup
```typescript
import { backup } from "@/lib/aws-clients";
// GET → ListBackupVaultsCommand → { backupVaults: [...] }
// POST action="createVault"     → CreateBackupVaultCommand
// POST action="startBackupJob"  → StartBackupJobCommand
// DELETE ?vaultName= → DeleteBackupVaultCommand
```

**`/api/s3-files`** — S3 Object Browser (nested under S3)
```typescript
import { s3 } from "@/lib/aws-clients";
// GET ?bucket=&prefix= → ListObjectsV2Command → { objects: [...], prefixes: [...] }
// POST action="upload"   → PutObjectCommand (via multipart form)
// POST action="copy"     → CopyObjectCommand
// DELETE ?bucket=&key= → DeleteObjectCommand
```

**`/api/s3control`** — S3 Control (Access Points)
```typescript
import { s3control } from "@/lib/aws-clients";
// GET ?accountId= → ListAccessPointsCommand → { accessPoints: [...] }
// POST action="createAccessPoint" → CreateAccessPointCommand
// DELETE ?accountId=&name= → DeleteAccessPointCommand
```

---

### Batch 4 — Database & Analytics (8 routes)

**`/api/opensearch`** — OpenSearch Service
```typescript
import { opensearch } from "@/lib/aws-clients";
// GET → ListDomainNamesCommand → { domainNames: [...] }
// POST action="create" → CreateDomainCommand({ DomainName, EngineVersion })
// DELETE ?domainName= → DeleteDomainCommand
```

**`/api/kinesis`** — Kinesis Data Streams
```typescript
import { kinesis } from "@/lib/aws-clients";
// GET → ListStreamsCommand → { streams: [...] }
// POST action="create"      → CreateStreamCommand({ StreamName, ShardCount })
// POST action="putRecord"   → PutRecordCommand({ StreamName, Data, PartitionKey })
// DELETE ?streamName= → DeleteStreamCommand
```

**`/api/firehose`** — Kinesis Data Firehose
```typescript
import { firehose } from "@/lib/aws-clients";
// GET → ListDeliveryStreamsCommand → { deliveryStreamNames: [...] }
// POST action="create" → CreateDeliveryStreamCommand
// DELETE ?streamName= → DeleteDeliveryStreamCommand
```

**`/api/msk`** — Managed Streaming for Kafka
```typescript
import { kafka } from "@/lib/aws-clients";
// GET → ListClustersV2Command → { clusterInfoList: [...] }
// POST action="create" → CreateClusterV2Command
// DELETE ?clusterArn= → DeleteClusterCommand
```

**`/api/glue`** — AWS Glue
```typescript
import { glue } from "@/lib/aws-clients";
// GET → GetDatabasesCommand + GetJobsCommand
//     → { databases: [...], jobs: [...] }
// POST action="createDatabase" → CreateDatabaseCommand
// POST action="createJob"      → CreateJobCommand
// POST action="startJobRun"    → StartJobRunCommand
// DELETE ?type=(db|job)&name= → DeleteDatabaseCommand | DeleteJobCommand
```

**`/api/athena`** — Amazon Athena
```typescript
import { athena } from "@/lib/aws-clients";
// GET → ListWorkGroupsCommand + ListDataCatalogsCommand
//     → { workgroups: [...], catalogs: [...] }
// POST action="startQuery"    → StartQueryExecutionCommand({ QueryString, WorkGroup })
// POST action="getQueryState" → GetQueryExecutionCommand({ QueryExecutionId })
// POST action="getResults"    → GetQueryResultsCommand({ QueryExecutionId })
```

**`/api/redshift`** — Amazon Redshift
```typescript
import { redshift } from "@/lib/aws-clients";
// GET → DescribeClustersCommand → { clusters: [...] }
// POST action="create"         → CreateClusterCommand
// POST action="pauseCluster"   → PauseClusterCommand
// POST action="resumeCluster"  → ResumeClusterCommand
// DELETE ?identifier= → DeleteClusterCommand
```

**`/api/memorydb`** — MemoryDB for Redis
```typescript
import { memorydb } from "@/lib/aws-clients";
// GET → DescribeClustersCommand → { clusters: [...] }
// POST action="create" → CreateClusterCommand
// DELETE ?name= → DeleteClusterCommand
```

---

### Batch 5 — Security & Developer Tools (8 routes)

**`/api/cognito`** — Cognito User Pools
```typescript
import { cognitoIdp } from "@/lib/aws-clients";
// GET → ListUserPoolsCommand({ MaxResults: 60 }) → { userPools: [...] }
// POST action="createPool"  → CreateUserPoolCommand({ PoolName })
// POST action="createUser"  → AdminCreateUserCommand({ UserPoolId, Username })
// POST action="listUsers"   → ListUsersCommand({ UserPoolId })
// DELETE ?poolId= → DeleteUserPoolCommand
```

**`/api/codepipeline`** — CodePipeline
```typescript
import { codepipeline } from "@/lib/aws-clients";
// GET → ListPipelinesCommand → { pipelines: [...] }
// POST action="create"          → CreatePipelineCommand
// POST action="startExecution"  → StartPipelineExecutionCommand
// POST action="listExecutions"  → ListPipelineExecutionsCommand
// DELETE ?name= → DeletePipelineCommand
```

**`/api/codebuild`** — CodeBuild
```typescript
import { codebuild } from "@/lib/aws-clients";
// GET → ListProjectsCommand → then BatchGetProjectsCommand → { projects: [...] }
// POST action="create"   → CreateProjectCommand
// POST action="startBuild" → StartBuildCommand({ projectName })
// DELETE ?name= → DeleteProjectCommand
```

**`/api/cloudwatch-logs`** — CloudWatch Logs
```typescript
import { cloudwatchLogs } from "@/lib/aws-clients";
// GET → DescribeLogGroupsCommand → { logGroups: [...] }
// POST action="createGroup"  → CreateLogGroupCommand({ logGroupName })
// POST action="getEvents"    → GetLogEventsCommand({ logGroupName, logStreamName })
// POST action="filterEvents" → FilterLogEventsCommand({ logGroupName, filterPattern })
// DELETE ?logGroupName= → DeleteLogGroupCommand
```

**`/api/ssm`** — Systems Manager Parameters
```typescript
import { ssm } from "@/lib/aws-clients";
// GET → DescribeParametersCommand → { parameters: [...] }
// POST action="put"    → PutParameterCommand({ Name, Value, Type })
// POST action="get"    → GetParameterCommand({ Name, WithDecryption })
// DELETE ?name= → DeleteParameterCommand
```

**`/api/cloudcontrol`** — Cloud Control API
```typescript
import { cloudcontrol } from "@/lib/aws-clients";
// GET ?typeName= → ListResourcesCommand({ TypeName }) → { resources: [...] }
// POST action="create" → CreateResourceCommand({ TypeName, DesiredState })
// DELETE ?typeName=&identifier= → DeleteResourceCommand
```

**`/api/resource-groups`** — Resource Groups
```typescript
import { resourceGroups } from "@/lib/aws-clients";
// GET → ListGroupsCommand → { groups: [...] }
// POST action="create"       → CreateGroupCommand({ Name, ResourceQuery })
// POST action="listResources" → ListGroupResourcesCommand({ GroupName })
// DELETE ?name= → DeleteGroupCommand
```

**`/api/transfer`** — AWS Transfer Family
```typescript
import { transfer } from "@/lib/aws-clients";
// GET → ListServersCommand → { servers: [...] }
// POST action="create"   → CreateServerCommand({ Protocols, EndpointType })
// POST action="createUser" → CreateUserCommand({ ServerId, UserName, Role })
// DELETE ?serverId= → DeleteServerCommand
```

---

### Batch 6 — AI/ML, IoT, Management (11 routes)

**`/api/bedrock`** — Amazon Bedrock Foundation Models
```typescript
import { bedrock } from "@/lib/aws-clients";
// GET → ListFoundationModelsCommand → { modelSummaries: [...] }
// POST action="listCustomModels" → ListCustomModelsCommand
// (Bedrock runtime invocations are a separate route)
```

**`/api/bedrock-runtime`** — Bedrock Runtime (model invocation)
```typescript
import { bedrockRuntime } from "@/lib/aws-clients";
// POST action="invoke" → InvokeModelCommand({ modelId, body, contentType })
//   → { response: decodedBody }
```

**`/api/bedrock-agent`** — Bedrock Agents
```typescript
import { bedrockAgent } from "@/lib/aws-clients";
// GET → ListAgentsCommand → { agentSummaries: [...] }
// POST action="create"     → CreateAgentCommand({ agentName, foundationModel })
// POST action="invoke"     → use bedrockAgentRuntime InvokeAgentCommand
// DELETE ?agentId= → DeleteAgentCommand
```

**`/api/sagemaker`** — SageMaker
```typescript
import { sagemaker } from "@/lib/aws-clients";
// GET → ListNotebookInstancesCommand + ListEndpointsCommand
//     → { notebookInstances: [...], endpoints: [...] }
// POST action="createNotebook"  → CreateNotebookInstanceCommand
// POST action="createEndpoint"  → CreateEndpointCommand
// DELETE ?type=(notebook|endpoint)&name= → DeleteNotebookInstanceCommand | DeleteEndpointCommand
```

**`/api/iot`** — AWS IoT Core
```typescript
import { iot } from "@/lib/aws-clients";
// GET → ListThingsCommand + ListTopicRulesCommand
//     → { things: [...], rules: [...] }
// POST action="createThing"      → CreateThingCommand({ thingName })
// POST action="createTopicRule"  → CreateTopicRuleCommand
// POST action="publish"          → use iotData PublishCommand
// DELETE ?type=(thing|rule)&name= → DeleteThingCommand | DeleteTopicRuleCommand
```

**`/api/sfn`** — Step Functions
```typescript
import { sfn } from "@/lib/aws-clients";
// GET → ListStateMachinesCommand → { stateMachines: [...] }
// POST action="create"         → CreateStateMachineCommand({ name, definition, roleArn })
// POST action="startExecution" → StartExecutionCommand({ stateMachineArn, input })
// POST action="listExecutions" → ListExecutionsCommand({ stateMachineArn })
// DELETE ?arn= → DeleteStateMachineCommand
```

**`/api/pipes`** — EventBridge Pipes
```typescript
import { pipes } from "@/lib/aws-clients";
// GET → ListPipesCommand → { pipes: [...] }
// POST action="create" → CreatePipeCommand({ name, source, target, roleArn })
// POST action="start"  → StartPipeCommand({ name })
// POST action="stop"   → StopPipeCommand({ name })
// DELETE ?name= → DeletePipeCommand
```

**`/api/scheduler`** — EventBridge Scheduler
```typescript
import { scheduler } from "@/lib/aws-clients";
// GET → ListSchedulesCommand → { schedules: [...] }
// POST action="create" → CreateScheduleCommand({ name, scheduleExpression, target, flexibleTimeWindow })
// DELETE ?name= → DeleteScheduleCommand
```

**`/api/appconfig`** — AWS AppConfig
```typescript
import { ssm } from "@/lib/aws-clients"; // AppConfig uses SSM client in SDK v3
// Note: @aws-sdk/client-appconfig is separate — add to dependencies
// GET → ListApplicationsCommand → { items: [...] }
// POST action="createApp"    → CreateApplicationCommand
// POST action="createConfig" → CreateConfigurationProfileCommand
// DELETE ?appId= → DeleteApplicationCommand
```

**`/api/xray`** — AWS X-Ray
```typescript
import { xray } from "@/lib/aws-clients";
// GET → GetServiceGraphCommand({ StartTime, EndTime }) → { services: [...] }
// POST action="getSamplingRules" → GetSamplingRulesCommand
// POST action="putTraceSegments" → PutTraceSegmentsCommand
```

**`/api/organizations`** — AWS Organizations
```typescript
import { organizations } from "@/lib/aws-clients";
// GET → ListAccountsCommand + DescribeOrganizationCommand
//     → { accounts: [...], organization: {...} }
// POST action="createAccount" → CreateAccountCommand({ Email, AccountName })
// POST action="moveAccount"   → MoveAccountCommand
```

---

## Service Page Implementation Pattern

Every stub page follows this template. Replace "Kinesis" with the target service:

```typescript
"use client";
import React, { useEffect, useState } from "react";
import Header from "@cloudscape-design/components/header";
import Table from "@cloudscape-design/components/table";
import Button from "@cloudscape-design/components/button";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Container from "@cloudscape-design/components/container";
import Alert from "@cloudscape-design/components/alert";
import Modal from "@cloudscape-design/components/modal";
import FormField from "@cloudscape-design/components/form-field";
import Input from "@cloudscape-design/components/input";

interface KinesisStream {
  StreamName: string;
  StreamStatus: string;
  StreamARN: string;
}

export default function KinesisPage() {
  const [streams, setStreams] = useState<KinesisStream[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createModal, setCreateModal] = useState(false);
  const [streamName, setStreamName] = useState("");

  const fetchStreams = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/kinesis");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setStreams(data.streams || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStreams(); }, []);

  const createStream = async () => {
    await fetch("/api/kinesis", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ StreamName: streamName, ShardCount: 1 }),
    });
    setCreateModal(false);
    setStreamName("");
    fetchStreams();
  };

  const deleteStream = async (name: string) => {
    await fetch(`/api/kinesis?streamName=${encodeURIComponent(name)}`, {
      method: "DELETE",
    });
    fetchStreams();
  };

  return (
    <div style={{ padding: "16px" }}>
      <SpaceBetween size="l">
        <Header variant="h1">Kinesis — Data Streams</Header>
        {error && <Alert type="error" header="Error loading streams">{error}</Alert>}
        <Container>
          <Table
            header={
              <Header
                variant="h2"
                actions={
                  <Button onClick={() => setCreateModal(true)}>
                    Create stream
                  </Button>
                }
              >
                Streams ({streams.length})
              </Header>
            }
            items={streams}
            loading={loading}
            columnDefinitions={[
              { header: "Name", cell: (i) => i.StreamName },
              { header: "Status", cell: (i) => i.StreamStatus },
              { header: "ARN", cell: (i) => i.StreamARN },
              {
                header: "Actions",
                cell: (i) => (
                  <Button
                    onClick={() => deleteStream(i.StreamName)}
                    formAction="none"
                  >
                    Delete
                  </Button>
                ),
              },
            ]}
            empty={<Box textAlign="center">No streams found.</Box>}
          />
        </Container>
        <Modal
          visible={createModal}
          onDismiss={() => setCreateModal(false)}
          header="Create Data Stream"
          footer={
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setCreateModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={createStream}>
                Create
              </Button>
            </SpaceBetween>
          }
        >
          <FormField label="Stream name">
            <Input
              value={streamName}
              onChange={(e) => setStreamName(e.detail.value)}
              placeholder="my-data-stream"
            />
          </FormField>
        </Modal>
      </SpaceBetween>
    </div>
  );
}
```

Key differences from stubs:
- Real typed interface for the resource
- `error` state + `Alert` component for error display
- `encodeURIComponent` on query params in DELETE calls
- `try/catch/finally` with proper `setLoading(false)` in finally
- No `any` types except where forced by SDK response shapes

---

## Implementation Batching Strategy

Six sequential batches allow progress tracking without merge conflicts across the 43 new routes.

| Batch | Services | New API Routes | Priority |
|-------|----------|---------------|----------|
| 1 — Networking | apigateway, apigatewayv2, cloudfront, servicediscovery, ses, sesv2, wafv2, route53resolver | 8 | High — many existing stub pages |
| 2 — Compute | ecs, emr, batch, eks | 4 | High — ecs-cluster/ecs-service dirs exist |
| 3 — Storage | efs, backup, s3-files, s3control | 4 | Medium |
| 4 — Database & Analytics | opensearch, kinesis, firehose, msk, glue, athena, redshift, memorydb | 8 | Medium |
| 5 — Security & DevOps | cognito, codepipeline, codebuild, cloudwatch-logs, ssm, cloudcontrol, resource-groups, transfer | 8 | Medium |
| 6 — AI/ML, IoT, Management | bedrock, bedrock-runtime, bedrock-agent, sagemaker, iot, sfn, pipes, scheduler, xray, organizations, appconfig | 11 | Lower — partial emulator support |

**Additional items across all batches:**
- `/api/terminal` route (Batch 1, high priority — AppShell already wired)
- `terminal_history` table addition to `db.ts` (Batch 1)
- `IamPolicyEditor.tsx` component + IAM page integration (Batch 2)
- WidgetContainer drag-and-drop (Batch 3)
- Test suite setup (Batch 5)

---

## Testing Strategy

The project has no test infrastructure. The plan adds vitest with minimal configuration targeting API route correctness.

### Setup

Add to `devDependencies`:
```json
"vitest": "^1.0.0",
"@vitest/coverage-v8": "^1.0.0"
```

Add to `package.json` scripts:
```json
"test": "vitest --run",
"test:coverage": "vitest --run --coverage"
```

Add `vitest.config.ts`:
```typescript
import { defineConfig } from "vitest/config";
import path from "path";
export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
```

### Test Pattern for API Routes

Rather than spinning up a Next.js server, tests import the route handler directly and mock the AWS clients:

```typescript
// src/app/api/kinesis/__tests__/route.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST, DELETE } from "../route";

vi.mock("@/lib/aws-clients", () => ({
  kinesis: {
    send: vi.fn(),
  },
}));

import { kinesis } from "@/lib/aws-clients";

describe("GET /api/kinesis", () => {
  it("returns streams array on success", async () => {
    vi.mocked(kinesis.send).mockResolvedValueOnce({
      StreamNames: ["my-stream"],
    });
    const res = await GET();
    const body = await res.json();
    expect(body.streams).toEqual(["my-stream"]);
    expect(res.status).toBe(200);
  });

  it("returns 500 with error message when SDK throws", async () => {
    vi.mocked(kinesis.send).mockRejectedValueOnce(new Error("Connection refused"));
    const res = await GET();
    const body = await res.json();
    expect(body.error).toBe("Connection refused");
    expect(res.status).toBe(500);
  });
});
```

Test files go in `src/app/api/{service}/__tests__/route.test.ts`.

Each service test covers:
1. GET happy path — response shape
2. GET error path — 500 with `error` field
3. POST create action — happy path
4. DELETE — happy path

---

## TypeScript Conventions

All new code follows the existing strict mode pattern:

```typescript
// ✅ Typed resource interfaces
interface KinesisStream {
  StreamName: string;
  StreamStatus: string;
  StreamARN: string;
}

// ✅ Typed error handling
} catch (err: unknown) {
  setError(err instanceof Error ? err.message : "Unknown error");
}

// ✅ SDK error in API routes
} catch (error: unknown) {
  const message = error instanceof Error ? error.message : "Unknown error";
  return NextResponse.json({ error: message }, { status: 500 });
}

// ✅ Discriminated union for widget size
type WidgetSize = "regular" | "extended";
```

The `any` type is only permitted for AWS SDK response shapes that lack specific TypeScript types (marked with `// eslint-disable-next-line @typescript-eslint/no-explicit-any` + comment explaining why).

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: API route error propagation

*For any* API route handler, when the underlying AWS SDK call throws an error with a message string, the route SHALL return a JSON response with an `error` field equal to that message and an HTTP status code of 500.

**Validates: Requirements 1.5, 8.6**

---

### Property 2: JSON editor validation correctness

*For any* string value passed to the `JsonEditor` component, after the user has interacted with the field (`touched === true`), the `errorText` prop passed to `FormField` SHALL be non-undefined if and only if the string is non-empty and not parseable as valid JSON.

**Validates: Requirements 4.2**

---

### Property 3: Widget configuration persistence round-trip

*For any* widget configuration object containing `widget_id`, `position_x`, `position_y`, `width`, `height`, and `visible` fields, calling `updateWidgetConfig` with those values and then `getWidgetConfig` SHALL return a list that contains an entry where all those fields match the values that were written.

**Validates: Requirements 6.2, 7.3, 7.5, 7.6**

---

### Property 4: Widget visibility exclusion

*For any* `widget_id` in the database, after calling `updateWidgetConfig(userId, widgetId, { visible: 0 })`, querying `getWidgetConfig(userId)` filtered to `visible = 1` SHALL NOT include any entry with that `widget_id`.

**Validates: Requirements 7.4**

---

### Property 5: Terminal history persistence round-trip

*For any* command string and session ID, calling `addTerminalHistory(sessionId, command, output, exitCode)` and then `getTerminalHistory(sessionId)` SHALL return a list containing an entry where `command` equals the stored command and `session_id` equals the provided session ID.

**Validates: Requirements 6.6**

---

### Property 6: Form pre-population completeness

*For any* resource data object returned by an API route, when that object is used to initialize a modification form's state, each form field's initial value SHALL equal the corresponding field from the resource data object (no field is left at its default/empty value when source data is present).

**Validates: Requirements 2.6**

---

### Property 7: Form validation rejection

*For any* form submission state where at least one required field is an empty string or whitespace-only string, the form's submit handler SHALL set a validation error state and SHALL NOT call the network fetch function.

**Validates: Requirements 2.2**

---

### Property 8: AWS SDK pass-through fidelity

*For any* mocked AWS SDK response object returned by a client's `send()` method, the corresponding API route SHALL include all top-level fields from that response object in the JSON response body without modification, omission, or addition of extra fields beyond the envelope key (e.g., `streams`, `functions`, `queues`).

**Validates: Requirements 8.5**

---

### Property 9: Nested resource parent association

*For any* parent resource identifier and nested resource creation request submitted to the appropriate API route, the route SHALL pass the parent identifier to the AWS SDK create command as the designated parent field (e.g., `cluster` for ECS services, `UserPoolId` for Cognito users), ensuring the nested resource is associated with the correct parent.

**Validates: Requirements 3.3**
