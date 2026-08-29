# Implementation Plan: AWS Console Clone Completion

## Overview

This plan implements 43 missing API routes, replaces 42+ stub service pages, adds the terminal API route, builds the IAM Policy Editor component, extends the SQLite persistence layer, wires widget drag-and-drop/resize/visibility, and establishes a vitest test suite. Every non-root task declares its dependencies so the execution order forms a valid DAG.

---

## Tasks

- [x] 1. Add `terminal_history` table to SQLite persistence layer and configure vitest
  - Modify `src/lib/db.ts`: add `terminal_history` table DDL inside `initializeDatabase()` (after the `recently_visited` block), add `TerminalHistoryEntry` interface, and export `addTerminalHistory()` and `getTerminalHistory()` functions
  - Keep the 500-entry cap per session (DELETE WHERE id NOT IN top-500 by executed_at DESC)
  - Create `vitest.config.ts` at the workspace root with `environment: "node"`, `globals: true`, and `alias: { "@": "./src" }`
  - Add `"vitest": "^1.6.0"` and `"@vitest/coverage-v8": "^1.6.0"` to `devDependencies` in `package.json`
  - Add `"test": "vitest --run"` and `"test:coverage": "vitest --run --coverage"` to `package.json` scripts
  - _Requirements: 6.1, 6.6, 6.7, 9.1, 9.6_
  - **Acceptance criteria:**
    - `src/lib/db.ts` compiles under `tsc --noEmit`
    - `getDatabase()` creates `terminal_history` table on first call (idempotent)
    - `addTerminalHistory` + `getTerminalHistory` round-trip stores and retrieves a row
    - `npx vitest --run` exits 0 (no tests yet, just config validation)
    - `package.json` scripts include `test` and `test:coverage`

- [x] 2. Implement `/api/terminal` route
  - Depends on: #1
  - Create `src/app/api/terminal/route.ts`
  - `GET` handler: parse `?sessionId=&limit=` query params, call `getTerminalHistory(sessionId, limit)`, return `{ history }`
  - `POST` handler: parse `{ command, sessionId }` from body; validate that the trimmed command starts with `"aws "` — if not, return `{ error: "Only aws CLI commands are supported", exitCode: 1 }` with status 400; split the command string using a quoted-string-aware tokenizer (handle `"my file.txt"` style quotes); `spawn("aws", args.slice(1), { env: { ...process.env, AWS_ENDPOINT_URL, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_DEFAULT_REGION } })`; collect stdout + stderr; 30-second kill timeout; call `addTerminalHistory(sessionId, command, combined, exitCode)`; return `{ output, exitCode }`
  - All errors return `{ error: message }` with status 500
  - _Requirements: 5.2, 5.3, 5.5, 6.6_
  - **Acceptance criteria:**
    - `GET /api/terminal?sessionId=abc` returns `{ history: [] }` when no rows exist
    - `POST /api/terminal` with a non-`aws` command returns status 400
    - Route compiles with no TypeScript errors

- [x] 3. Build `IamPolicyEditor.tsx` component
  - No dependencies
  - Create `src/components/IamPolicyEditor.tsx`
  - Props interface: `{ label?: string; value: string; onChange: (v: string) => void }`
  - Render a `ButtonDropdown` (Cloudscape) with 4 items: "S3 Read Only", "Administrator Access", "Lambda Execution Role", "Blank policy"; clicking one sets `onChange(JSON.stringify(template, null, 2))`
  - Below the dropdown, render `<JsonEditor label={label} value={value} onChange={onChange} />`
  - Define the 4 `POLICY_TEMPLATES` as typed `PolicyTemplate[]` constants inside the file
  - _Requirements: 4.1, 4.4, 4.6_
  - **Acceptance criteria:**
    - Component renders without errors in a Next.js page
    - Selecting "S3 Read Only" template populates a valid JSON policy string
    - `tsc --noEmit` passes

- [x] 4. Integrate `IamPolicyEditor` into IAM service pages
  - Depends on: #3
  - Modify `src/app/iam/page.tsx`: replace the existing placeholder textarea in the role-creation modal with `<IamPolicyEditor label="Permissions Policy" value={policyDoc} onChange={setPolicyDoc} />`; add `const [policyDoc, setPolicyDoc] = useState(JSON.stringify({ Version: "2012-10-17", Statement: [] }, null, 2))`; pass `policyDoc` as part of the create-role request body
  - _Requirements: 4.5_
  - **Acceptance criteria:**
    - `src/app/iam/page.tsx` compiles with no TypeScript errors
    - `IamPolicyEditor` import resolves at `@/components/IamPolicyEditor`

- [x] 5. Implement Batch 1 — Networking API routes (8 routes)
  - Depends on: #1
  - Create the following files, each exporting typed `GET`, `POST`, `DELETE` handlers:
    - `src/app/api/apigateway/route.ts` — import `apigateway` from `@/lib/aws-clients`; GET → `GetRestApisCommand`; POST actions: `createApi` (CreateRestApiCommand), `createResource`, `createMethod`; DELETE `?restApiId=`
    - `src/app/api/apigatewayv2/route.ts` — import `apigatewayv2`; GET → `GetApisCommand`; POST actions: `create`, `createStage`; DELETE `?apiId=`
    - `src/app/api/cloudfront/route.ts` — import `cloudfront`; GET → `ListDistributionsCommand`; POST action `create`; DELETE `?id=&etag=`
    - `src/app/api/servicediscovery/route.ts` — import `servicediscovery`; GET → `ListNamespacesCommand`; POST actions: `createNamespace`, `createService`; DELETE `?id=`
    - `src/app/api/ses/route.ts` — import `ses`; GET → `ListIdentitiesCommand`; POST actions: `verify`, `send`; DELETE `?identity=`
    - `src/app/api/sesv2/route.ts` — import `sesv2`; GET → `ListEmailIdentitiesCommand`; POST actions: `createIdentity`, `send`; DELETE `?identityName=`
    - `src/app/api/wafv2/route.ts` — import `wafv2`; GET → `ListWebACLsCommand({ Scope: "REGIONAL" })`; POST action `create`; DELETE `?name=&id=&lockToken=`
    - `src/app/api/route53resolver/route.ts` — import `route53resolver`; GET → `ListResolverEndpointsCommand`; POST action `createEndpoint`; DELETE `?id=`
  - All catch blocks: `return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })`
  - _Requirements: 1.1, 1.3, 8.1, 8.4, 8.5, 8.6_
  - **Acceptance criteria:**
    - All 8 files compile with no TypeScript errors
    - GET handlers return the documented envelope key (e.g., `apis`, `distributions`, `identities`)
    - Error path returns `{ error }` with status 500

- [x] 6. Implement Batch 2 — Compute API routes (4 routes)
  - Depends on: #1
  - Create:
    - `src/app/api/ecs/route.ts` — import `ecs`; GET → `ListClustersCommand` then `DescribeClustersCommand`; POST actions: `createCluster`, `createService`, `listServices`; DELETE `?cluster=`
    - `src/app/api/emr/route.ts` — import `emr`; GET → `ListClustersCommand({ ClusterStates: ["RUNNING","WAITING"] })`; POST action `create` → `RunJobFlowCommand`; DELETE `?clusterId=` → `TerminateJobFlowsCommand`
    - `src/app/api/batch/route.ts` — import `batch`; GET → `DescribeComputeEnvironmentsCommand` + `DescribeJobQueuesCommand`; POST actions: `createComputeEnv`, `createJobQueue`, `submitJob`; DELETE `?name=&type=`
    - `src/app/api/eks/route.ts` — import `eks`; GET → `ListClustersCommand` then `DescribeClusterCommand` per name; POST action `create`; DELETE `?name=`
  - _Requirements: 1.1, 1.3, 8.1, 8.4, 8.5, 8.6_
  - **Acceptance criteria:**
    - All 4 files compile with no TypeScript errors
    - `ecs` GET returns `{ clusters: [...] }`, `batch` GET returns `{ computeEnvironments, jobQueues }`

- [x] 7. Implement Batch 3 — Storage API routes (4 routes)
  - Depends on: #1
  - Create:
    - `src/app/api/efs/route.ts` — import `efs`; GET → `DescribeFileSystemsCommand`; POST action `create`; DELETE `?fileSystemId=`
    - `src/app/api/backup/route.ts` — import `backup`; GET → `ListBackupVaultsCommand`; POST actions: `createVault`, `startBackupJob`; DELETE `?vaultName=`
    - `src/app/api/s3-files/route.ts` — import `s3`; GET `?bucket=&prefix=` → `ListObjectsV2Command`; POST actions: `upload` (PutObjectCommand), `copy` (CopyObjectCommand); DELETE `?bucket=&key=`
    - `src/app/api/s3control/route.ts` — import `s3control`; GET `?accountId=` → `ListAccessPointsCommand`; POST action `createAccessPoint`; DELETE `?accountId=&name=`
  - _Requirements: 1.1, 1.3, 8.1, 8.4, 8.5, 8.6_
  - **Acceptance criteria:**
    - All 4 files compile with no TypeScript errors
    - `s3-files` GET returns `{ objects, prefixes }`

- [x] 8. Implement Batch 4 — Database & Analytics API routes (8 routes)
  - Depends on: #1
  - Create:
    - `src/app/api/opensearch/route.ts` — import `opensearch`; GET → `ListDomainNamesCommand`; POST action `create`; DELETE `?domainName=`
    - `src/app/api/kinesis/route.ts` — import `kinesis`; GET → `ListStreamsCommand`; POST actions: `create` (CreateStreamCommand), `putRecord`; DELETE `?streamName=`
    - `src/app/api/firehose/route.ts` — import `firehose`; GET → `ListDeliveryStreamsCommand`; POST action `create`; DELETE `?streamName=`
    - `src/app/api/msk/route.ts` — import `kafka`; GET → `ListClustersV2Command`; POST action `create`; DELETE `?clusterArn=`
    - `src/app/api/glue/route.ts` — import `glue`; GET → `GetDatabasesCommand` + `GetJobsCommand`; POST actions: `createDatabase`, `createJob`, `startJobRun`; DELETE `?type=&name=`
    - `src/app/api/athena/route.ts` — import `athena`; GET → `ListWorkGroupsCommand` + `ListDataCatalogsCommand`; POST actions: `startQuery`, `getQueryState`, `getResults`
    - `src/app/api/redshift/route.ts` — import `redshift`; GET → `DescribeClustersCommand`; POST actions: `create`, `pauseCluster`, `resumeCluster`; DELETE `?identifier=`
    - `src/app/api/memorydb/route.ts` — import `memorydb`; GET → `DescribeClustersCommand`; POST action `create`; DELETE `?name=`
  - _Requirements: 1.1, 1.3, 8.1, 8.4, 8.5, 8.6_
  - **Acceptance criteria:**
    - All 8 files compile with no TypeScript errors
    - `glue` GET returns `{ databases, jobs }`; `athena` GET returns `{ workgroups, catalogs }`

- [x] 9. Implement Batch 5 — Security & Developer Tools API routes (8 routes)
  - Depends on: #1
  - Create:
    - `src/app/api/cognito/route.ts` — import `cognitoIdp`; GET → `ListUserPoolsCommand({ MaxResults: 60 })`; POST actions: `createPool`, `createUser`, `listUsers`; DELETE `?poolId=`
    - `src/app/api/codepipeline/route.ts` — import `codepipeline`; GET → `ListPipelinesCommand`; POST actions: `create`, `startExecution`, `listExecutions`; DELETE `?name=`
    - `src/app/api/codebuild/route.ts` — import `codebuild`; GET → `ListProjectsCommand` then `BatchGetProjectsCommand`; POST actions: `create`, `startBuild`; DELETE `?name=`
    - `src/app/api/cloudwatch-logs/route.ts` — import `cloudwatchLogs`; GET → `DescribeLogGroupsCommand`; POST actions: `createGroup`, `getEvents`, `filterEvents`; DELETE `?logGroupName=`
    - `src/app/api/ssm/route.ts` — import `ssm`; GET → `DescribeParametersCommand`; POST actions: `put`, `get`; DELETE `?name=`
    - `src/app/api/cloudcontrol/route.ts` — import `cloudcontrol`; GET `?typeName=` → `ListResourcesCommand`; POST action `create`; DELETE `?typeName=&identifier=`
    - `src/app/api/resource-groups/route.ts` — import `resourceGroups`; GET → `ListGroupsCommand`; POST actions: `create`, `listResources`; DELETE `?name=`
    - `src/app/api/transfer/route.ts` — import `transfer`; GET → `ListServersCommand`; POST actions: `create`, `createUser`; DELETE `?serverId=`
  - _Requirements: 1.1, 1.3, 3.3, 8.1, 8.4, 8.5, 8.6_
  - **Acceptance criteria:**
    - All 8 files compile with no TypeScript errors
    - `cognito` POST action `createUser` passes `UserPoolId` from body to `AdminCreateUserCommand` (Requirement 3.3 / Property 9)

- [x] 10. Implement Batch 6 — AI/ML, IoT & Management API routes (11 routes)
  - Depends on: #1
  - Create:
    - `src/app/api/bedrock/route.ts` — import `bedrock`; GET → `ListFoundationModelsCommand`; POST action `listCustomModels`
    - `src/app/api/bedrock-runtime/route.ts` — import `bedrockRuntime`; POST action `invoke` → `InvokeModelCommand({ modelId, body, contentType })`; decode response body; return `{ response }`
    - `src/app/api/bedrock-agent/route.ts` — import `bedrockAgent`; GET → `ListAgentsCommand`; POST actions: `create`, `invoke` (via `bedrockAgentRuntime`); DELETE `?agentId=`
    - `src/app/api/sagemaker/route.ts` — import `sagemaker`; GET → `ListNotebookInstancesCommand` + `ListEndpointsCommand`; POST actions: `createNotebook`, `createEndpoint`; DELETE `?type=&name=`
    - `src/app/api/iot/route.ts` — import `iot`; GET → `ListThingsCommand` + `ListTopicRulesCommand`; POST actions: `createThing`, `createTopicRule`, `publish` (via `iotData`); DELETE `?type=&name=`
    - `src/app/api/sfn/route.ts` — import `sfn`; GET → `ListStateMachinesCommand`; POST actions: `create`, `startExecution`, `listExecutions`; DELETE `?arn=`
    - `src/app/api/pipes/route.ts` — import `pipes`; GET → `ListPipesCommand`; POST actions: `create`, `start`, `stop`; DELETE `?name=`
    - `src/app/api/scheduler/route.ts` — import `scheduler`; GET → `ListSchedulesCommand`; POST action `create`; DELETE `?name=`
    - `src/app/api/appconfig/route.ts` — import `ssm` from `@/lib/aws-clients` and `@aws-sdk/client-appconfig` separately (note: AppConfig has its own SDK package `@aws-sdk/client-appconfig`); if the package is absent, add it; GET → `ListApplicationsCommand`; POST actions: `createApp`, `createConfig`; DELETE `?appId=`
    - `src/app/api/xray/route.ts` — import `xray`; GET → `GetServiceGraphCommand({ StartTime, EndTime })` using last 1 hour; POST actions: `getSamplingRules`, `putTraceSegments`
    - `src/app/api/organizations/route.ts` — import `organizations`; GET → `ListAccountsCommand` + `DescribeOrganizationCommand`; POST actions: `createAccount`, `moveAccount`
  - _Requirements: 1.1, 1.3, 8.1, 8.4, 8.5, 8.6_
  - **Acceptance criteria:**
    - All 11 files compile with no TypeScript errors
    - `bedrock` GET returns `{ modelSummaries }`; `sagemaker` GET returns `{ notebookInstances, endpoints }`

- [x] 11. Replace stub pages — Batch 1 Networking (8 pages)
  - Depends on: #5
  - Replace content (do NOT rename files) of:
    - `src/app/servicediscovery/page.tsx` — namespaces table, create namespace modal (name field), delete action; fetch from `/api/servicediscovery`
    - `src/app/ses/page.tsx` — identities table, verify email identity modal, delete action; fetch from `/api/ses`
    - `src/app/sesv2/page.tsx` — email identities table, create identity modal, delete action; fetch from `/api/sesv2`
    - `src/app/cloudfront/page.tsx` — distributions table (Id, DomainName, Status), create distribution modal, delete action; fetch from `/api/cloudfront`
    - `src/app/wafv2/page.tsx` — Web ACLs table (Name, Id, ARN), create WebACL modal, delete action; fetch from `/api/wafv2`
    - `src/app/waf/page.tsx` — redirect or stub noting WAF v2 is preferred; link to `/wafv2`
    - `src/app/waf-classic/page.tsx` — same minimal redirect pattern
    - `src/app/ec2-resolver/page.tsx` — resolver endpoints table; fetch from `/api/route53resolver`
  - Each page: typed interface, `loading` state, `error` state + Cloudscape `Alert`, `encodeURIComponent` on DELETE query params, `try/catch/finally` with `setLoading(false)` in finally, no `any` types
  - _Requirements: 1.1, 1.2, 1.4, 1.5, 2.1, 2.2_
  - **Acceptance criteria:**
    - All 8 pages compile with no TypeScript errors
    - Each page renders a Cloudscape `Table` with at least 2 column definitions
    - Error state renders `<Alert type="error">`

- [x] 12. Replace stub pages — Batch 2 Compute (4 pages)
  - Depends on: #6, #4
  - Replace content of:
    - `src/app/ecs-cluster/page.tsx` — clusters table (ClusterName, Status, RunningTasksCount), create cluster modal; fetch from `/api/ecs`; nested services tab via `listServices` action
    - `src/app/ecs-service/page.tsx` — prompt user to select a cluster first; list services for selected cluster via `POST /api/ecs` action `listServices`
    - `src/app/emr/page.tsx` — clusters table (Id, Name, Status), create cluster modal; fetch from `/api/emr`
    - `src/app/eks-cluster/page.tsx` — clusters table (name, version, status), create cluster modal; fetch from `/api/eks`
  - _Requirements: 1.1, 1.2, 1.4, 1.5, 2.1, 3.1, 3.2_
  - **Acceptance criteria:**
    - All 4 pages compile with no TypeScript errors
    - `ecs-service` page passes the selected cluster name as `cluster` field to `createService` action body (Property 9 / Requirement 3.3)

- [x] 13. Replace stub pages — Batch 3 Storage (4 pages)
  - Depends on: #7
  - Replace content of:
    - `src/app/efs/page.tsx` — file systems table (FileSystemId, LifeCycleState, SizeInBytes), create modal; fetch from `/api/efs`
    - `src/app/backup/page.tsx` — backup vaults table (BackupVaultName, NumberOfRecoveryPoints), create vault modal; fetch from `/api/backup`
    - `src/app/s3-files/page.tsx` — object browser: bucket selector input, object list table (Key, Size, LastModified), folder navigation via prefix; fetch from `/api/s3-files?bucket=&prefix=`; upload button opens file input; delete object action
    - `src/app/s3-tables/page.tsx` — redirect or minimal page linking to S3 bucket list at `/s3`
  - _Requirements: 1.1, 1.2, 1.4, 1.5, 2.1, 2.3_
  - **Acceptance criteria:**
    - All 4 pages compile with no TypeScript errors
    - `s3-files` page uses `encodeURIComponent` for both `bucket` and `key` params

- [x] 14. Replace stub pages — Batch 4 Database & Analytics (8 pages)
  - Depends on: #8
  - Replace content of:
    - `src/app/opensearch/page.tsx` — domain names table, create domain modal (DomainName, EngineVersion); fetch from `/api/opensearch`
    - `src/app/kinesis/page.tsx` — streams table (StreamName, StreamStatus, StreamARN), create stream modal; fetch from `/api/kinesis`
    - `src/app/firehose/page.tsx` — delivery streams table, create stream modal; fetch from `/api/firehose`
    - `src/app/msk/page.tsx` — Kafka clusters table (ClusterName, ClusterType, State), create cluster modal; fetch from `/api/msk`
    - `src/app/glue-catalog/page.tsx` — databases table; create database modal; fetch from `/api/glue`
    - `src/app/glue-job/page.tsx` — jobs table (Name, JobRunState, CreatedOn), create job modal, start job run action; fetch from `/api/glue`
    - `src/app/athena-workgroup/page.tsx` — workgroups table + catalogs table; start query modal (QueryString, WorkGroup); fetch from `/api/athena`
    - `src/app/mwaa/page.tsx` — minimal page noting MWAA is not emulated; link to `/athena-workgroup`
  - _Requirements: 1.1, 1.2, 1.4, 1.5, 2.1_
  - **Acceptance criteria:**
    - All 8 pages compile with no TypeScript errors

- [x] 15. Replace stub pages — Batch 5 Security & Developer Tools (8 pages)
  - Depends on: #9
  - Replace content of:
    - `src/app/cognito/page.tsx` — user pools table, create pool modal, list users inline panel; fetch from `/api/cognito`
    - `src/app/codepipeline/page.tsx` — pipelines table, create pipeline modal, start execution action; fetch from `/api/codepipeline`
    - `src/app/codebuild/page.tsx` — projects table, create project modal, start build action; fetch from `/api/codebuild`
    - `src/app/cloudwatch-logs/page.tsx` — log groups table, create log group modal, filter events modal; fetch from `/api/cloudwatch-logs`
    - `src/app/systems-manager-parameter-store/page.tsx` — parameters table (Name, Type, LastModifiedDate), put parameter modal, get/decrypt action; fetch from `/api/ssm`
    - `src/app/cloudcontrol/page.tsx` — resource type selector input + resources table; fetch from `/api/cloudcontrol?typeName=`
    - `src/app/resource-groups/page.tsx` — resource groups table, create group modal; fetch from `/api/resource-groups`
    - `src/app/transfer/page.tsx` — Transfer Family servers table (ServerId, State, Protocols), create server modal; fetch from `/api/transfer`
  - _Requirements: 1.1, 1.2, 1.4, 1.5, 2.1, 3.1, 3.2, 3.3_
  - **Acceptance criteria:**
    - All 8 pages compile with no TypeScript errors
    - `cognito` page passes `UserPoolId` when creating a user (Requirement 3.3)

- [-] 16. Replace stub pages — Batch 6 AI/ML, IoT & Management (11 pages)
  - Depends on: #10
  - Replace content of:
    - `src/app/bedrock-agent/page.tsx` — agents table, create agent modal (agentName, foundationModel); fetch from `/api/bedrock-agent`
    - `src/app/bedrock-runtime/page.tsx` — model invocation form (modelId selector, prompt textarea, response display); POST to `/api/bedrock-runtime`
    - `src/app/bedrock-agentcore/page.tsx` — minimal page noting AgentCore; link to `/bedrock-agent`
    - `src/app/sagemaker/page.tsx` — two tabs: Notebook Instances + Endpoints; create modals for each; fetch from `/api/sagemaker`
    - `src/app/iot/page.tsx` — two tabs: Things + Rules; create thing modal, create topic rule modal; fetch from `/api/iot`
    - `src/app/iot-core/page.tsx` — redirect to `/iot`
    - `src/app/step-functions/page.tsx` — state machines table, create state machine modal (name, definition JSON via `JsonEditor`, roleArn), start execution action; fetch from `/api/sfn`
    - `src/app/eventbridge-pipe/page.tsx` — pipes table, create pipe modal; fetch from `/api/pipes`
    - `src/app/eventbridge-scheduler/page.tsx` — schedules table, create schedule modal; fetch from `/api/scheduler`
    - `src/app/appconfig/page.tsx` — applications table, create application modal; fetch from `/api/appconfig`
    - `src/app/x-ray/page.tsx` — service graph display (JSON viewer of services array), sampling rules list; fetch from `/api/xray`
    - `src/app/organizations/page.tsx` — accounts table + organization info box; create account modal; fetch from `/api/organizations`
  - _Requirements: 1.1, 1.2, 1.4, 1.5, 2.1_
  - **Acceptance criteria:**
    - All 11 pages (plus `iot-core` and `bedrock-agentcore` minimal pages) compile with no TypeScript errors

- [x] 17. Implement widget drag-and-drop in `WidgetContainer.tsx`
  - No dependencies (self-contained UI change)
  - Modify `src/components/widgets/WidgetContainer.tsx`:
    - Add state: `const [draggedId, setDraggedId] = useState<string | null>(null)` and `const [order, setOrder] = useState<string[]>` (initialised from widget IDs prop or default order)
    - Add a `widgetIds` prop to `WidgetContainerProps`; render children in the order defined by `order` state
    - Wrap each widget slot in a `<div draggable onDragStart={() => setDraggedId(id)} onDragOver={(e) => e.preventDefault()} onDrop={() => handleDrop(id)}>` container
    - Implement `handleDrop(targetId)`: swap positions in `order` state; call `PUT /api/widgets` for both the dragged and target widget with updated `position_x` / `position_y`
    - Persist reorder optimistically (local state first, then fetch in background)
  - _Requirements: 7.1, 7.5_
  - **Acceptance criteria:**
    - `WidgetContainer.tsx` compiles with no TypeScript errors
    - `draggedId` state resets to `null` after drop

- [-] 18. Implement widget resize and visibility toggle
  - Depends on: #17
  - Modify `src/components/widgets/Widget.tsx`:
    - Add resize toggle button: clicking cycles `size` between `"regular"` (colspan 6) and `"extended"` (colspan 12); on change call `PUT /api/widgets { widgetId, updates: { width: 2 | 1 } }`
    - Add remove button (visible only in customize mode, passed via prop `isCustomizing`): clicking calls `PUT /api/widgets { widgetId, updates: { visible: 0 } }` then removes the widget from local `order` state in `WidgetContainer`
  - Modify `src/components/widgets/WidgetContainer.tsx`: pass `isCustomizing` to each `Widget`; render a "restore hidden widgets" panel in customize mode that lists widgets with `visible = 0` (fetched from `GET /api/widgets`) and a toggle to set `visible: 1`
  - _Requirements: 7.4, 7.6_
  - **Acceptance criteria:**
    - `Widget.tsx` and `WidgetContainer.tsx` compile with no TypeScript errors
    - Resize button is only visible when a widget is rendered; remove button only in customize mode

- [ ] 19. Write core API route tests (vitest)
  - Depends on: #1, #5, #6, #7, #8, #9, #10
  - Create test files covering 6 representative services — one from each batch:
    - `src/app/api/ses/__tests__/route.test.ts` (Batch 1): mock `ses` client; test GET happy path returns `{ identities }`, GET error returns `{ error }` with status 500, POST `verify` action happy path
    - `src/app/api/ecs/__tests__/route.test.ts` (Batch 2): mock `ecs` client; test GET happy path returns `{ clusters }`, GET error returns status 500, POST `createCluster` happy path
    - `src/app/api/efs/__tests__/route.test.ts` (Batch 3): mock `efs` client; test GET happy path returns `{ fileSystems }`, GET error, POST create
    - `src/app/api/kinesis/__tests__/route.test.ts` (Batch 4): mock `kinesis` client; test GET returns `{ streams }`, GET error, POST `create`
    - `src/app/api/cognito/__tests__/route.test.ts` (Batch 5): mock `cognitoIdp`; test GET returns `{ userPools }`, GET error, POST `createUser` passes `UserPoolId` through to SDK call
    - `src/app/api/sfn/__tests__/route.test.ts` (Batch 6): mock `sfn`; test GET returns `{ stateMachines }`, GET error, POST `create`
  - Each test file uses `vi.mock("@/lib/aws-clients", ...)` with `vi.fn()` on the `send` method
  - Also add `src/lib/__tests__/db.test.ts`: test `addTerminalHistory` + `getTerminalHistory` round-trip using an in-memory SQLite path override; test `updateWidgetConfig` + `getWidgetConfig` round-trip (Properties 3, 5)
  - _Requirements: 9.1, 9.2, 9.3, 9.6_

  - [ ]* 19.1 Write property test for API route error propagation (Property 1)
    - **Property 1: API route error propagation** — for any SDK `send()` mock that rejects with `new Error(msg)`, the route must return `{ error: msg }` with status 500
    - **Validates: Requirements 1.5, 8.6**
    - Use `@fast-check/vitest` (add to devDependencies) or hand-roll a loop over random error message strings
    - Add test to `src/app/api/kinesis/__tests__/route.test.ts`

  - [ ]* 19.2 Write property test for widget configuration persistence round-trip (Property 3)
    - **Property 3: Widget configuration persistence round-trip**
    - **Validates: Requirements 6.2, 7.3, 7.5, 7.6**
    - In `src/lib/__tests__/db.test.ts`: generate random `position_x`, `position_y`, `width`, `height` values; call `updateWidgetConfig`; assert `getWidgetConfig` returns matching values

  - [ ]* 19.3 Write property test for terminal history persistence round-trip (Property 5)
    - **Property 5: Terminal history persistence round-trip**
    - **Validates: Requirements 6.6**
    - In `src/lib/__tests__/db.test.ts`: for random command strings and session IDs, assert `addTerminalHistory` + `getTerminalHistory` returns a row with matching fields

  - **Acceptance criteria:**
    - `npx vitest --run` exits 0 with all non-optional tests passing
    - Each test file has at minimum 3 test cases (GET happy, GET error, POST action)
    - `db.test.ts` verifies both widget and terminal persistence round-trips

- [~] 20. Build verification and final TypeScript check
  - Depends on: #2, #4, #11, #12, #13, #14, #15, #16, #17, #18, #19
  - Run `npx tsc --noEmit` — fix any remaining type errors surfaced across all new files
  - Run `npx next build` — resolve any import or module-resolution errors that only manifest at build time
  - Run `npx vitest --run` — confirm all non-optional tests pass
  - If `appconfig` route requires `@aws-sdk/client-appconfig` and it is missing from `package.json`, add it with `npm install --save @aws-sdk/client-appconfig@^3.1121.0`
  - _Requirements: 10.1, 10.2, 10.3, 11.1, 11.2, 11.3, 9.6_
  - **Acceptance criteria:**
    - `tsc --noEmit` exits 0
    - `next build` completes without errors
    - `vitest --run` exits 0
    - No `any` types except where annotated with the required ESLint disable comment

---

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Tasks #3 and #17 have no dependencies and can start in parallel with any other root or early tasks
- Tasks #5–#10 (API route batches) depend only on #1 and can run in parallel with each other
- Tasks #11–#16 (page batches) each depend on their corresponding route batch; within a page batch, individual pages are independent
- Task #19 depends on all route batches being complete so mocks can be validated against real handler exports
- Each task references specific requirements and design properties for traceability
- Checkpoints are embedded in the acceptance criteria of each task rather than as separate tasks to keep the list atomic

---

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1", "3", "17"] },
    { "id": 1, "tasks": ["2", "4", "5", "6", "7", "8", "9", "10"] },
    { "id": 2, "tasks": ["11", "12", "13", "14", "15", "16", "18"] },
    { "id": 3, "tasks": ["19"] },
    { "id": 4, "tasks": ["19.1", "19.2", "19.3"] },
    { "id": 5, "tasks": ["20"] }
  ]
}
```
