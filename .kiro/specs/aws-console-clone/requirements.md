# Requirements Document

## Introduction

This specification covers the production-grade AWS Web Console clone running entirely against local AWS emulators (LocalStack and Ministack). The project is a Next.js 16 application using the Cloudscape Design System. It currently has 130+ service page stubs, 15 partially-implemented API routes, and a basic navigation shell. The goal is 100% functional equivalence with the real AWS Console for every service supported by the emulators — pixel-perfect UI, full CRUD operations, real AWS SDK calls, and the exact same workflows and navigation patterns as the real console.

The system is composed of a Next.js frontend (using Cloudscape components), a set of Next.js API route handlers (the Backend), and a local AWS emulator (LocalStack or Ministack running at `http://localhost:4566`).

---

## Glossary

- **Console**: This application — the AWS Web Console clone.
- **Backend**: The Next.js API route handlers under `src/app/api/`.
- **Emulator**: The local AWS service emulator (LocalStack or Ministack) running at port 4566.
- **AppShell**: The top-level layout component containing the TopNavigation, SideNavigation, and main content area.
- **ServicePage**: A Next.js page component (`src/app/{service}/page.tsx`) that provides the UI for a single AWS service.
- **ResourceTable**: A Cloudscape `Table` component configured with multi-select, filtering, sorting, pagination, and inline action buttons.
- **DetailPanel**: A side panel (Cloudscape `SplitPanel`) or detail page that shows the full attributes of a selected resource.
- **WizardModal**: A multi-step Cloudscape `Wizard` component used for resource creation workflows matching AWS Console wizard patterns.
- **CRUD**: Create, Read (list + detail), Update, Delete operations against the Emulator via the Backend.
- **ARN**: Amazon Resource Name — a unique identifier for an AWS resource.
- **Provider**: Either "ministack" or "localstack" — detected at runtime from `/_ministack/health` or `/_localstack/health`.
- **Region**: The AWS region used for all API calls, configurable globally via the Console's region selector (default: `us-east-1`).
- **Tag**: A key-value metadata pair attached to an AWS resource.
- **Cloudscape**: The `@cloudscape-design/components` React component library used for all UI elements.

---

## Requirements

---

### Requirement 1: Visual Parity — Global Design Tokens and Color System

**User Story:** As a developer using this Console, I want the visual design to exactly match the real AWS Console so that the experience feels native and familiar.

#### Acceptance Criteria

1. THE Console SHALL use the Cloudscape Design System's dark theme as the default mode, matching AWS Console's dark palette (`#0b0d14` background, `#232f3e` panel backgrounds, `#1a2332` card backgrounds, `#3d4755` borders).
2. THE Console SHALL provide a light/dark theme toggle that persists the selection in `localStorage` under the key `"theme"` and applies it via `applyMode()` from `@cloudscape-design/global-styles`.
3. THE Console SHALL render all interactive elements (buttons, links, inputs, tables, badges, status indicators) exclusively using Cloudscape components — no custom HTML elements shall be used where a Cloudscape equivalent exists.
4. WHEN a resource has a status of "running", "available", "active", or "enabled", THE Console SHALL render a green `StatusIndicator` with `type="success"`.
5. WHEN a resource has a status of "stopped", "inactive", "disabled", or "deleted", THE Console SHALL render a grey `StatusIndicator` with `type="stopped"`.
6. WHEN a resource has a status of "pending", "creating", "modifying", or "starting", THE Console SHALL render a blue `StatusIndicator` with `type="in-progress"`.
7. WHEN a resource has a status of "error", "failed", or "impaired", THE Console SHALL render a red `StatusIndicator` with `type="error"`.
8. THE Console SHALL use Cloudscape's `SpaceBetween`, `Container`, `Header`, `Box`, and `Grid` layout primitives for all page layouts — no custom CSS grid or flexbox layouts shall be used for page structure.

---

### Requirement 2: Global Navigation Shell

**User Story:** As a user, I want a navigation structure that matches the real AWS Console so that I can find and switch between services quickly.

#### Acceptance Criteria

1. THE AppShell SHALL render a `TopNavigation` bar containing: the AWS logo and "AWS Console" title linking to `/`, a global search input, a region selector dropdown, a notifications icon, a help icon, and a profile/account menu.
2. THE AppShell SHALL render a `SideNavigation` component with all 130+ supported services organized into the following categories: Compute, Storage, Database, Networking & Content Delivery, Security & Identity, Management & Governance, Application Integration, Developer Tools, Analytics, Containers, Monitoring & Observability.
3. WHEN the user selects a region from the region selector, THE AppShell SHALL update the `region` state in the Zustand `useSettingsStore`, re-initialize all AWS SDK clients with the new region, and reload the current service page data.
4. THE SideNavigation SHALL support collapsible category groups, with each group remembering its expanded/collapsed state in `localStorage`.
5. WHEN the user navigates to a service page, THE SideNavigation SHALL highlight the active service link using the `activeHref` prop matching the current `pathname`.
6. THE AppShell SHALL render a `BreadcrumbGroup` below the `TopNavigation` on every page, reflecting the current navigation path (e.g., Home > EC2 > Instances > i-abc123).
7. WHEN the user types in the global search input with at least 3 characters, THE Console SHALL display a dropdown of matching service names and link directly to their pages.
8. THE TopNavigation SHALL display the currently detected Provider (ministack/localstack) as a badge next to the region selector.
9. WHEN the Provider is "unknown" or unreachable, THE TopNavigation SHALL display a red warning badge and the Console SHALL remain functional with degraded error states on all service pages.

---

### Requirement 3: Provider Detection and AWS Client Initialization

**User Story:** As a developer, I want the Console to automatically detect whether Ministack or LocalStack is running so that all API calls route correctly without manual configuration.

#### Acceptance Criteria

1. WHEN the Console first loads, THE Backend SHALL call `/_ministack/health` first, then `/_localstack/health`, and set the detected provider in the API response at `/api/health`.
2. THE Backend SHALL initialize all AWS SDK clients using `process.env.AWS_ENDPOINT_URL` (defaulting to `http://localhost:4566`), `process.env.AWS_DEFAULT_REGION` (defaulting to `us-east-1`), and credential pair `accessKeyId: "test"`, `secretAccessKey: "test"`.
3. THE Backend SHALL set `forcePathStyle: true` on all S3 SDK clients to enable path-style bucket access against the Emulator.
4. WHEN a region change is detected from the `useSettingsStore`, THE Backend SHALL pass the updated region in an `x-aws-region` request header, and API route handlers SHALL read this header to override the default region for that request.
5. IF the Emulator is unreachable during a Backend API call, THEN THE Backend SHALL return a JSON response with `{ "error": "<message>", "code": "EMULATOR_UNREACHABLE" }` and HTTP status 503.
6. THE Backend SHALL expose AWS SDK clients for all services listed in `src/lib/aws-clients.ts` plus: `@aws-sdk/client-sfn` (Step Functions), `@aws-sdk/client-eventbridge`, `@aws-sdk/client-logs` (CloudWatch Logs), `@aws-sdk/client-apigatewayv2`, `@aws-sdk/client-acm`, `@aws-sdk/client-ecr`, `@aws-sdk/client-eks`, `@aws-sdk/client-kinesis`, `@aws-sdk/client-firehose`, `@aws-sdk/client-glue`, `@aws-sdk/client-athena`, `@aws-sdk/client-cognito-identity-provider`, `@aws-sdk/client-ses`, `@aws-sdk/client-pinpoint`.

---

### Requirement 4: Shared ResourceTable Component

**User Story:** As a user, I want every service's resource list to behave consistently — with sorting, filtering, multi-select, and pagination — matching the real AWS Console's table behavior.

#### Acceptance Criteria

1. THE ResourceTable SHALL support column header click-to-sort (ascending/descending) using Cloudscape `Table`'s `sortingColumn` and `onSortingChange` props.
2. THE ResourceTable SHALL render a Cloudscape `TextFilter` above the table that filters the displayed rows client-side by matching any column value.
3. THE ResourceTable SHALL support checkbox multi-selection via `selectionType="multi"`, with the count of selected items displayed in the table `Header` (e.g., "Instances (3 of 12 selected)").
4. THE ResourceTable SHALL render a Cloudscape `Pagination` component below the table for lists exceeding 25 items.
5. WHEN one or more rows are selected, THE ResourceTable SHALL enable a bulk-action toolbar above the table containing contextual action buttons (e.g., "Start", "Stop", "Delete", "Add tags").
6. THE ResourceTable SHALL render a Cloudscape `CollectionPreferences` panel allowing the user to show/hide columns and change page size, with preferences persisted in `localStorage` per service.
7. WHEN the ResourceTable is loading, THE ResourceTable SHALL display a Cloudscape loading spinner via the `loading` prop.
8. WHEN the ResourceTable has no data, THE ResourceTable SHALL display a Cloudscape `Box` with centered text and a "Create [Resource]" primary button.

---

### Requirement 5: S3 — Full Bucket and Object Management

**User Story:** As a developer, I want complete S3 bucket and object management so that I can test all storage workflows against the local emulator.

#### Acceptance Criteria

1. WHEN the user navigates to `/s3`, THE Console SHALL display a ResourceTable listing all S3 buckets with columns: Name, Region, Access, Versioning status, Encryption, Creation date.
2. WHEN the user clicks "Create bucket", THE Console SHALL open a WizardModal with steps: General configuration (name, region), Object ownership (ACLs disabled/enabled), Block Public Access settings, Bucket versioning (enabled/disabled/suspended), Encryption (SSE-S3 or SSE-KMS), Tags.
3. WHEN the user submits the create bucket wizard, THE Backend SHALL call `CreateBucketCommand` with all configured settings, then call `PutBucketVersioningCommand`, `PutBucketEncryptionCommand`, and `PutPublicAccessBlockCommand` as separate SDK operations.
4. WHEN the user clicks a bucket name, THE Console SHALL navigate to `/s3/[bucketName]` and display a tabbed detail page with tabs: Objects, Properties, Permissions, Metrics, Management, Access points.
5. WHEN the user is on the Objects tab of a bucket, THE Console SHALL display a hierarchical object browser with prefix-based folder navigation, object name, size, storage class, last modified, and download/delete per-object actions.
6. WHEN the user clicks "Upload", THE Console SHALL display a multi-file upload modal with drag-and-drop support, storage class selection (Standard, Standard-IA, Intelligent-Tiering, Glacier), and optional server-side encryption setting per object.
7. WHEN the user selects an object and clicks "Download", THE Backend SHALL call `GetObjectCommand` and stream the response back as a file download with the correct `Content-Disposition` header.
8. WHEN the user selects an object and clicks "Create presigned URL", THE Backend SHALL call `getSignedUrl` with `GetObjectCommand` and return a presigned URL valid for the user-specified duration (1 hour, 1 day, 7 days).
9. WHEN the user is on the Properties tab, THE Console SHALL display and allow editing of: bucket versioning, default encryption, server access logging, static website hosting, requester pays, object lock, and transfer acceleration settings.
10. WHEN the user is on the Permissions tab, THE Console SHALL display and allow editing of: Block Public Access settings, bucket policy (as a JSON editor), ACL (bucket owner, others), and CORS configuration (as a JSON editor).
11. WHEN the user edits a bucket policy or CORS configuration and saves, THE Backend SHALL call `PutBucketPolicyCommand` or `PutBucketCorsCommand` respectively.
12. WHEN the user is on the Management tab, THE Console SHALL display lifecycle rules; clicking "Create lifecycle rule" SHALL open a form to configure prefix filters, transitions, and expiration actions.

---

### Requirement 6: EC2 — Instance, AMI, Key Pair, Security Group, and Volume Management

**User Story:** As a developer, I want complete EC2 management so that I can create, configure, and manage virtual instances and related resources against the local emulator.

#### Acceptance Criteria

1. WHEN the user navigates to `/ec2`, THE Console SHALL display an EC2 dashboard with resource summary cards (Instances, Security Groups, Key Pairs, Volumes, Elastic IPs, AMIs) and a "Recently launched instances" table.
2. WHEN the user navigates to `/ec2` instances view, THE Console SHALL display a ResourceTable with columns: Instance ID, Name (from tags), Instance type, State, Status checks, Alarm status, Availability zone, Public IPv4, Private IPv4, Key pair, Launch time.
3. WHEN the user clicks "Launch instances", THE Console SHALL open a WizardModal with steps: Name and tags, Application and OS Images (AMI selection), Instance type selection, Key pair, Network settings (VPC, subnet, security group, auto-assign public IP), Storage (root volume size/type, additional volumes), Advanced details.
4. WHEN the user submits the launch wizard, THE Backend SHALL call `RunInstancesCommand` with all specified parameters.
5. WHEN an instance is selected and the user clicks "Connect", THE Console SHALL display connection instructions (SSH command with key pair, EC2 Instance Connect, Session Manager) in a modal.
6. WHEN the user navigates to `/security-group`, THE Console SHALL display all security groups with a ResourceTable and allow creating new groups (name, VPC, description) and managing inbound/outbound rules (protocol, port range, source/destination CIDR).
7. WHEN the user navigates to `/key-pair`, THE Console SHALL display all key pairs and allow creating new ones (name, type: RSA/ED25519, format: PEM/PPK), with the private key downloaded automatically on creation.
8. WHEN the user navigates to `/volume`, THE Console SHALL display all EBS volumes with columns: Volume ID, Name, Size, Type, IOPS, State, Attachment, Availability zone, and support creating, attaching, detaching, and deleting volumes.
9. WHEN the user navigates to `/elastic-ip`, THE Console SHALL display all Elastic IP addresses and support allocate, associate (with instance or network interface), disassociate, and release operations.
10. WHEN the user navigates to `/ami`, THE Console SHALL display all AMIs owned by the account and support deregistering them.
11. WHEN the user navigates to `/snapshot`, THE Console SHALL display all EBS snapshots and support creating, copying, and deleting snapshots.
12. IF a Backend API call to `RunInstancesCommand` fails due to missing AMI or quota error, THEN THE Console SHALL display a Cloudscape `Alert` with `type="error"` and the full error message.

---

### Requirement 7: VPC — Networking Resource Management

**User Story:** As a developer, I want complete VPC networking management so that I can configure virtual network topology for my local AWS resources.

#### Acceptance Criteria

1. WHEN the user navigates to `/vpc`, THE Console SHALL display a VPC dashboard with resource counts and a ResourceTable of VPCs with columns: VPC ID, Name, State, IPv4 CIDR, IPv6 CIDR, DHCP option set, Default VPC.
2. WHEN the user clicks "Create VPC", THE Console SHALL open a creation modal with fields: Name, IPv4 CIDR block, IPv6 CIDR block (optional), Tenancy (default/dedicated), Tags, and optionally create subnets, route tables, and an internet gateway in one step via the "VPC and more" option.
3. THE Console SHALL implement full CRUD pages at `/subnet`, `/route-table`, `/internet-gateway`, `/nat-gateway`, `/network-acl`, `/security-group`, `/ec2-vpc-endpoint`, `/ec2-vpc-peering`, and `/transit-gateway`.
4. WHEN the user navigates to `/subnet`, THE Console SHALL display a ResourceTable of subnets with columns: Subnet ID, Name, VPC, State, IPv4 CIDR, Available IPv4 addresses, Availability zone, Auto-assign public IPv4, Route table.
5. WHEN the user navigates to `/route-table`, THE Console SHALL display all route tables and allow editing routes (add/remove destination-target pairs) and subnet associations.
6. WHEN the user navigates to `/network-acl`, THE Console SHALL display all network ACLs with their inbound and outbound rule sets, and allow adding, editing, and deleting rules with rule number, type, protocol, port range, source/destination, and allow/deny.
7. WHEN the user navigates to `/internet-gateway`, THE Console SHALL list all internet gateways and support create, attach to VPC, detach from VPC, and delete operations.

---

### Requirement 8: IAM — Full Identity and Access Management

**User Story:** As a developer, I want complete IAM management so that I can manage users, roles, groups, and policies for my local AWS services.

#### Acceptance Criteria

1. WHEN the user navigates to `/iam`, THE Console SHALL display an IAM dashboard with counts for Users, User groups, Roles, and Policies and navigation links to each sub-section.
2. THE IAM page SHALL use a tabbed interface with tabs: Users, Groups, Roles, Policies, Identity providers.
3. WHEN the user creates a new IAM user, THE Console SHALL open a multi-step wizard: User details (name, console access toggle, password), Add to groups, Copy permissions from existing user, Attach policies directly, Tags, Review and create.
4. WHEN the user clicks on an IAM user, THE Console SHALL navigate to `/iam/[userName]` showing a detail page with tabs: Permissions (attached policies, inline policies), Groups, Tags, Security credentials (access keys, MFA devices, console password).
5. WHEN the user creates access keys for a user, THE Backend SHALL call `CreateAccessKeyCommand` and the Console SHALL display the Access Key ID and Secret Access Key in a modal with a "Download .csv" button — warning that the secret is shown once only.
6. WHEN the user creates a new IAM role, THE Console SHALL open a creation wizard with steps: Trusted entity type (AWS service, another AWS account, web identity, SAML), Use case selection, Add permissions (policy search and attach), Tags, Role name and description.
7. WHEN the user navigates to `/iam` policies tab, THE Console SHALL display AWS-managed policies separately from customer-managed policies, with columns: Policy name, Type, Entities attached, Description.
8. WHEN the user creates a policy, THE Console SHALL provide a JSON policy editor with syntax highlighting (using `Textarea`) and a visual policy builder with service/action/resource/condition selectors.
9. WHEN the user navigates to `/iam-password-policy`, THE Console SHALL display and allow setting the account password policy (minimum length, require symbols, require numbers, expiry, etc.) via `UpdateAccountPasswordPolicyCommand`.
10. THE Backend SHALL implement API routes for: `CreateAccessKeyCommand`, `DeleteAccessKeyCommand`, `ListAccessKeysCommand`, `AttachUserPolicyCommand`, `DetachUserPolicyCommand`, `AttachRolePolicy`, `DetachRolePolicy`, `CreateGroupCommand`, `AddUserToGroupCommand`, `RemoveUserFromGroupCommand`, `CreatePolicyCommand`, `DeletePolicyCommand`, `GetPolicyVersionCommand`.

---

### Requirement 9: Lambda — Full Function Management

**User Story:** As a developer, I want complete Lambda management so that I can create, configure, invoke, and monitor functions against the local emulator.

#### Acceptance Criteria

1. WHEN the user navigates to `/lambda`, THE Console SHALL display a ResourceTable of Lambda functions with columns: Function name, Description, Runtime, Package type, Last modified, Code size, Memory (MB), Timeout.
2. WHEN the user clicks "Create function", THE Console SHALL open a creation wizard with options: Author from scratch (name, runtime, architecture, execution role), Container image (image URI, execution role), Browse serverless app repository.
3. WHEN creating from scratch, THE Console SHALL include fields for: function name, runtime (Node.js 18.x/20.x, Python 3.11/3.12, Java 17/21, Go 1.x, .NET 8, Ruby 3.3, custom runtime), architecture (x86_64/arm64), execution role (new role with basic permissions, existing role from dropdown).
4. WHEN the user clicks on a function name, THE Console SHALL navigate to a detail page at `/lambda/[functionName]` with tabs: Code, Test, Monitor, Configuration, Aliases, Versions.
5. WHEN the user is on the Code tab, THE Console SHALL display the function code in a Monaco-style editor (using `Textarea` as a fallback) and allow editing and deploying code updates via `UpdateFunctionCodeCommand`.
6. WHEN the user is on the Test tab, THE Console SHALL provide a JSON payload editor and an "Invoke" button that calls `InvokeCommand`, displaying the response payload, status code, duration, and billed duration.
7. WHEN the user is on the Configuration tab, THE Console SHALL display and allow editing of: General (memory, timeout, description), Permissions (execution role, resource-based policy), Environment variables (key-value pairs), VPC (VPC, subnets, security groups), Layers, Concurrency, Asynchronous invocation settings.
8. WHEN the user navigates to `/lambda-layer`, THE Console SHALL display all Lambda layers and support creating new layers (name, description, upload zip file, compatible runtimes).
9. WHEN the user navigates to `/lambda-alias`, THE Console SHALL display aliases for each function and support creating aliases with weighted traffic routing between two function versions.
10. THE Backend SHALL implement API routes for: `UpdateFunctionCodeCommand`, `UpdateFunctionConfigurationCommand`, `PublishVersionCommand`, `CreateAliasCommand`, `UpdateAliasCommand`, `DeleteAliasCommand`, `ListVersionsByFunctionCommand`, `GetFunctionCommand`, `PutFunctionConcurrencyCommand`, `DeleteFunctionConcurrencyCommand`, `CreateEventSourceMappingCommand`, `ListEventSourceMappingsCommand`.

---

### Requirement 10: DynamoDB — Full Table and Item Management

**User Story:** As a developer, I want complete DynamoDB management including item-level CRUD so that I can use the Console as a full database administration tool.

#### Acceptance Criteria

1. WHEN the user navigates to `/dynamodb`, THE Console SHALL display a ResourceTable of tables with columns: Table name, Status, Partition key, Sort key (if any), Item count, Table size, Table class, Read capacity, Write capacity.
2. WHEN the user clicks "Create table", THE Console SHALL open a creation modal with fields: Table name, Partition key (name + type: String/Number/Binary), Sort key toggle (name + type), Table settings (default or customize: billing mode PAY_PER_REQUEST vs PROVISIONED, read/write capacity units), Secondary indexes, Encryption.
3. WHEN the user clicks on a table name, THE Console SHALL navigate to `/dynamodb/[tableName]` with tabs: Explore table items, Indexes, Monitor, Global tables, Exports and streams, Additional settings.
4. WHEN the user is on the Explore items tab, THE Console SHALL display table items in a ResourceTable, allow scanning with filter expressions and projection expressions, and support switching between Scan and Query mode with a partition key input.
5. WHEN the user is on the Explore items tab, THE Console SHALL provide "Create item", "Edit item", and "Delete item" actions. Creating and editing items SHALL use a JSON editor (Textarea) for the item attribute map.
6. WHEN the user is on the Indexes tab, THE Console SHALL display existing GSIs and LSIs and allow creating new GSIs (index name, partition key, sort key, projection type, read/write capacity).
7. THE Backend SHALL implement API routes for: `PutItemCommand`, `GetItemCommand`, `UpdateItemCommand`, `DeleteItemCommand`, `ScanCommand` (with FilterExpression, ProjectionExpression, pagination via `ExclusiveStartKey`), `QueryCommand` (with KeyConditionExpression), `CreateGlobalSecondaryIndexAction`, `UpdateTableCommand`, `DescribeTableCommand`, `ListTagsOfResourceCommand`, `TagResourceCommand`.

---

### Requirement 11: RDS — Database Instance Management

**User Story:** As a developer, I want complete RDS management so that I can create and configure relational database instances against the local emulator.

#### Acceptance Criteria

1. WHEN the user navigates to `/rds`, THE Console SHALL display a tabbed page with tabs: Databases, Query Editor, Snapshots, Parameter groups, Option groups, Events, Recommendations.
2. WHEN the user is on the Databases tab, THE Console SHALL display a ResourceTable with columns: DB identifier, Role (instance/cluster), Engine, Status, Size, Multi-AZ, Storage type, Endpoint, Creation time.
3. WHEN the user clicks "Create database", THE Console SHALL open a creation wizard with options: Standard create vs Easy create; engine selection (MySQL, PostgreSQL, MariaDB, Oracle, SQL Server, Aurora); edition; version; templates (Production/Dev-Test/Free tier); DB instance identifier, master username, password; instance class; storage type, allocated storage, max storage threshold; Multi-AZ; VPC, subnet group, security groups, public access; database name, port; parameter group; backup retention; encryption; tags.
4. WHEN the user clicks on a DB identifier, THE Console SHALL navigate to `/rds/[dbId]` showing a detail page with tabs: Connectivity & security, Configuration, Monitoring, Logs & events, Maintenance & backups, Tags.
5. WHEN the user selects an instance and clicks "Modify", THE Console SHALL display a form pre-filled with current settings allowing changes to DB class, storage, multi-AZ, backup, maintenance window, and parameter group.
6. THE Backend SHALL implement API routes for: `CreateDBInstanceCommand`, `ModifyDBInstanceCommand`, `DeleteDBInstanceCommand`, `StopDBInstanceCommand`, `StartDBInstanceCommand`, `RebootDBInstanceCommand`, `DescribeDBInstancesCommand`, `CreateDBSnapshotCommand`, `RestoreDBInstanceFromDBSnapshotCommand`, `DescribeDBSnapshotsCommand`.

---

### Requirement 12: SQS — Full Queue Management

**User Story:** As a developer, I want complete SQS queue management including message operations so that I can test message-driven workflows locally.

#### Acceptance Criteria

1. WHEN the user navigates to `/sqs`, THE Console SHALL display a ResourceTable of queues with columns: Queue name, Type (Standard/FIFO), Messages available, Messages in flight, Messages delayed, Last modified, Queue URL.
2. WHEN the user clicks "Create queue", THE Console SHALL open a creation modal with fields: Type (Standard/FIFO), Name (with `.fifo` suffix auto-appended for FIFO), Configuration (visibility timeout, message retention period, maximum message size, delivery delay, receive message wait time), Encryption, Access policy (basic editor or advanced JSON), Dead-letter queue configuration, Tags.
3. WHEN the user clicks on a queue name, THE Console SHALL navigate to a detail page at `/sqs/[queueName]` with tabs: Messages, Monitoring, Configuration, Access policy, Encryption, Dead-letter queue, Tags.
4. WHEN the user is on the Messages tab, THE Console SHALL provide "Send and receive messages", "Purge", and polling controls.
5. WHEN the user clicks "Send message", THE Console SHALL display a modal with: Message body (Textarea), Message attributes (key-value with data type), Delay seconds (for standard queues), Message deduplication ID and message group ID (for FIFO queues).
6. WHEN the user clicks "Poll for messages", THE Console SHALL call `ReceiveMessageCommand` with all message attributes requested and display received messages in a table with: Message ID, Sent time, Size, Message body (expandable), Attributes.
7. THE Backend SHALL implement API routes for: `GetQueueAttributesCommand`, `SetQueueAttributesCommand`, `ChangeMessageVisibilityCommand`, `DeleteMessageCommand`, `SendMessageBatchCommand`.

---

### Requirement 13: SNS — Full Topic and Subscription Management

**User Story:** As a developer, I want complete SNS topic and subscription management so that I can test pub/sub event flows locally.

#### Acceptance Criteria

1. WHEN the user navigates to `/sns`, THE Console SHALL display a tabbed page with tabs: Topics, Subscriptions, Mobile push credentials.
2. WHEN the user is on the Topics tab, THE Console SHALL display a ResourceTable with columns: Name, Type (Standard/FIFO), Subscriptions, ARN.
3. WHEN the user clicks "Create topic", THE Console SHALL open a creation form with fields: Type (Standard/FIFO), Name, Display name, Encryption, Access policy, Delivery policy (JSON editor), Delivery status logging, Redrive policy, Tags.
4. WHEN the user clicks on a topic name, THE Console SHALL navigate to a detail page with tabs: Subscriptions, Access policy, Delivery status logging, Encryption, Tags.
5. WHEN the user clicks "Create subscription" on a topic, THE Console SHALL open a modal with Protocol (HTTP, HTTPS, Email, Email-JSON, SQS, Lambda, SQS, Firehose, Application, SMS) and Endpoint fields.
6. WHEN the user clicks "Publish message" on a topic, THE Console SHALL open a modal with: Message body (Textarea), Subject, Message attributes, Message structure (identical/JSON for each protocol), Message deduplication ID and group ID for FIFO topics.
7. THE Backend SHALL implement API routes for: `SubscribeCommand`, `UnsubscribeCommand`, `ListSubscriptionsCommand`, `ListSubscriptionsByTopicCommand`, `ConfirmSubscriptionCommand`, `GetTopicAttributesCommand`, `SetTopicAttributesCommand`, `PublishBatchCommand`.

---

### Requirement 14: CloudWatch — Metrics, Alarms, Dashboards, and Logs

**User Story:** As a developer, I want full CloudWatch access so that I can monitor metrics, configure alarms, view dashboards, and query logs for my local AWS resources.

#### Acceptance Criteria

1. WHEN the user navigates to `/cloudwatch`, THE Console SHALL display a CloudWatch home page with navigation links to: Dashboards, Alarms (All alarms, In alarm, OK, Insufficient data), Logs (Log groups, Log Insights, Live Tail), Metrics (All metrics, Explorer), Events (EventBridge).
2. WHEN the user navigates to the Alarms section, THE Console SHALL display a ResourceTable with columns: Alarm name, State (color-coded), Metric, Threshold, Actions, Created.
3. WHEN the user clicks "Create alarm", THE Console SHALL open a creation wizard with steps: Select metric (namespace > metric > dimension browser), Specify metric conditions (period, statistic, threshold, condition, evaluation periods, datapoints to alarm), Configure actions (notification via SNS, EC2 action, Auto Scaling action), Add name and description.
4. WHEN the user navigates to `/cloudwatch-logs`, THE Console SHALL display a ResourceTable of Log groups with columns: Log group name, Retention setting, Metric filters, KMS key, Stored bytes.
5. WHEN the user clicks on a log group, THE Console SHALL navigate to its detail page showing log streams as a ResourceTable, and clicking a stream SHALL display paginated log events with timestamp and message.
6. WHEN the user navigates to the Log Insights section, THE Console SHALL provide a query editor (Textarea with CloudWatch Logs Insights syntax), a time range selector, and a "Run query" button that calls `StartQueryCommand` then polls `GetQueryResultsCommand` until complete.
7. WHEN the user navigates to Metrics > All metrics, THE Console SHALL display a namespace browser that lists all available metric namespaces, then metrics within each namespace, allowing the user to add multiple metrics to a graph (line chart rendered using a Cloudscape `AreaChart` or embedded chart).
8. WHEN the user navigates to Dashboards, THE Console SHALL display existing CloudWatch dashboards and allow creating new ones with widget types: Line chart, Stacked area chart, Number, Gauge, Bar chart, Pie chart, Text, Log table, Alarm status.
9. THE Backend SHALL implement API routes for: `PutDashboardCommand`, `GetDashboardCommand`, `ListDashboardsCommand`, `DeleteDashboardsCommand`, `CreateLogGroupCommand`, `CreateLogStreamCommand`, `PutLogEventsCommand`, `GetLogEventsCommand`, `DescribeLogGroupsCommand`, `DescribeLogStreamsCommand`, `StartQueryCommand`, `GetQueryResultsCommand`, `FilterLogEventsCommand`, `GetMetricDataCommand`.

---

### Requirement 15: CloudFormation — Full Stack Lifecycle Management

**User Story:** As a developer, I want complete CloudFormation management so that I can deploy, update, and roll back infrastructure stacks locally.

#### Acceptance Criteria

1. WHEN the user navigates to `/cloudformation`, THE Console SHALL display a tabbed page with tabs: Stacks, StackSets, Exports.
2. WHEN the user is on the Stacks tab, THE Console SHALL display a ResourceTable with columns: Stack name, Status, Created, Updated, Drift status, Description.
3. WHEN the user clicks "Create stack", THE Console SHALL open a creation wizard with steps: Prerequisite (use sample template, upload template file, use template URL), Specify stack details (stack name, parameters), Configure stack options (tags, permissions, stack failure options, stack policy, rollback configuration, notification ARNs), Review.
4. WHEN the user uploads a CloudFormation template, THE Console SHALL accept JSON or YAML format (Textarea), parse it client-side to extract Parameters and display them as form fields.
5. WHEN the user clicks on a stack name, THE Console SHALL navigate to a detail page with tabs: Events, Resources, Outputs, Parameters, Template, Change sets, Drift results.
6. WHEN the user is on the Events tab, THE Console SHALL display a real-time polling table (refreshing every 5 seconds during active operations) of stack events with: Timestamp, Logical ID, Physical ID, Resource type, Status, Status reason.
7. WHEN the user clicks "Update stack" on an existing stack, THE Console SHALL open an update wizard pre-filled with current template and parameters, allowing changes.
8. WHEN the user clicks "Delete stack", THE Console SHALL show a confirmation modal, then call `DeleteStackCommand`, then poll events until stack deletion completes or fails.
9. THE Backend SHALL implement API routes for: `CreateStackCommand`, `UpdateStackCommand`, `DeleteStackCommand`, `DescribeStacksCommand`, `DescribeStackEventsCommand`, `DescribeStackResourcesCommand`, `GetTemplateCommand`, `ValidateTemplateCommand`, `ListExportsCommand`, `DetectStackDriftCommand`, `DescribeStackDriftDetectionStatusCommand`.

---

### Requirement 16: Step Functions — State Machine Management

**User Story:** As a developer, I want full Step Functions management so that I can create, execute, and monitor state machines locally.

#### Acceptance Criteria

1. WHEN the user navigates to `/step-functions`, THE Console SHALL display a tabbed page with tabs: State machines, Activities.
2. WHEN the user is on the State machines tab, THE Console SHALL display a ResourceTable with columns: Name, Type (Standard/Express), Status, Created, Executions in last 7 days.
3. WHEN the user clicks "Create state machine", THE Console SHALL open a creation wizard with steps: Choose authoring method (design visually / write in code), Specify definition (JSON/YAML Amazon States Language editor), State machine settings (name, type, execution role, logging level, tracing, tags).
4. WHEN the user clicks on a state machine name, THE Console SHALL navigate to a detail page with tabs: Definition (ASL JSON viewer/editor), Executions, Logging, Monitoring, Tags.
5. WHEN the user is on the Executions tab, THE Console SHALL display a ResourceTable of executions with columns: Name, Status, Start date, End date, Duration.
6. WHEN the user clicks "Start execution", THE Console SHALL display a modal with a JSON input editor and call `StartExecutionCommand`.
7. WHEN the user clicks on an execution, THE Console SHALL display an execution detail page showing: Input, Output, Execution status, Step visualization (a simple list-based trace showing each state visited, its status, and start/end time), and the events table.
8. THE Backend SHALL implement API routes for: `CreateStateMachineCommand`, `UpdateStateMachineCommand`, `DeleteStateMachineCommand`, `ListStateMachinesCommand`, `DescribeStateMachineCommand`, `StartExecutionCommand`, `StopExecutionCommand`, `ListExecutionsCommand`, `DescribeExecutionCommand`, `GetExecutionHistoryCommand`.

---

### Requirement 17: API Gateway — REST and HTTP API Management

**User Story:** As a developer, I want complete API Gateway management so that I can create and test HTTP and REST APIs against the local emulator.

#### Acceptance Criteria

1. WHEN the user navigates to `/appsync` (mapped to API Gateway), THE Console SHALL display a tabbed page with tabs: HTTP APIs, REST APIs, WebSocket APIs.
2. WHEN the user is on any tab, THE Console SHALL display a ResourceTable with columns: API name, API ID, Protocol, Endpoint, Stage, Created.
3. WHEN the user clicks "Create API", THE Console SHALL open a creation wizard selecting HTTP API vs REST API, then collecting: API name, description, CORS configuration, route and integration details (Lambda, HTTP, VPC Link, Mock).
4. WHEN the user clicks on an API, THE Console SHALL navigate to a detail page showing routes/resources, stages, authorizers, integrations, and access logs.
5. WHEN the user clicks on a route, THE Console SHALL display integration settings and allow testing the route with a built-in request sender (method, path, headers, body, query params).
6. THE Backend SHALL implement API routes for: `CreateApiCommand`, `DeleteApiCommand`, `GetApisCommand`, `CreateRouteCommand`, `DeleteRouteCommand`, `GetRoutesCommand`, `CreateIntegrationCommand`, `GetIntegrationsCommand`, `CreateStageCommand`, `GetStagesCommand`, `CreateDeploymentCommand`.

---

### Requirement 18: KMS — Key Management

**User Story:** As a developer, I want full KMS key management so that I can create, rotate, and use encryption keys locally.

#### Acceptance Criteria

1. WHEN the user navigates to `/kms`, THE Console SHALL display a tabbed page with tabs: Customer managed keys, AWS managed keys, Custom key stores.
2. WHEN the user is on the Customer managed keys tab, THE Console SHALL display a ResourceTable with columns: Key alias, Key ID, Status (Enabled/Disabled/Pending deletion), Creation date, Origin.
3. WHEN the user clicks "Create key", THE Console SHALL open a creation wizard with steps: Key configuration (symmetric/asymmetric, usage: encrypt/decrypt or sign/verify, key spec), Add labels (alias, description), Define key administrative permissions (IAM users/roles), Define key usage permissions (IAM users/roles), Review.
4. WHEN the user clicks on a key, THE Console SHALL navigate to a detail page with tabs: General configuration, Cryptographic configuration, Aliases, Key policy, Tags, Key rotation.
5. WHEN the user is on the Key policy tab, THE Console SHALL display the current policy JSON and allow editing it via a Textarea JSON editor.
6. WHEN the user is on the Key rotation tab, THE Console SHALL display the rotation status and allow enabling automatic rotation.
7. WHEN the user selects a key and clicks "Disable" or "Enable", THE Backend SHALL call `DisableKeyCommand` or `EnableKeyCommand`.
8. WHEN the user schedules key deletion, THE Console SHALL show a modal warning of the waiting period, accepting a deletion window (7-30 days), then call `ScheduleKeyDeletionCommand`.
9. THE Backend SHALL implement API routes for: `CreateKeyCommand`, `ListKeysCommand`, `DescribeKeyCommand`, `ListAliasesCommand`, `CreateAliasCommand`, `UpdateAliasCommand`, `DeleteAliasCommand`, `EnableKeyCommand`, `DisableKeyCommand`, `GetKeyPolicyCommand`, `PutKeyPolicyCommand`, `EnableKeyRotationCommand`, `DisableKeyRotationCommand`, `GetKeyRotationStatusCommand`, `ScheduleKeyDeletionCommand`, `CancelKeyDeletionCommand`, `TagResourceCommand`, `UntagResourceCommand`.

---

### Requirement 19: Secrets Manager — Secret Lifecycle Management

**User Story:** As a developer, I want full Secrets Manager functionality so that I can store, rotate, and retrieve secrets locally.

#### Acceptance Criteria

1. WHEN the user navigates to `/secrets-manager`, THE Console SHALL display a ResourceTable of secrets with columns: Secret name, Description, Last retrieved, Last changed, Rotation (enabled/disabled), KMS key.
2. WHEN the user clicks "Store a new secret", THE Console SHALL open a creation wizard with steps: Secret type (credentials for RDS/DocumentDB/Redshift, Other), Secret value (key-value pairs or plaintext with a Textarea toggle), Encryption key, Secret name and description, Configure rotation (disable or configure Lambda-based rotation), Review.
3. WHEN the user clicks on a secret, THE Console SHALL navigate to a detail page with tabs: Overview, Secret value, Rotation, Tags, Permissions.
4. WHEN the user is on the Secret value tab, THE Console SHALL retrieve and display the secret value via `GetSecretValueCommand`, with a "Show/Hide" toggle to mask the value.
5. WHEN the user clicks "Retrieve secret value" while the value is hidden, THE Console SHALL call `GetSecretValueCommand` and display the decrypted value.
6. WHEN the user clicks "Edit secret value", THE Console SHALL open an editor modal and call `PutSecretValueCommand` on save.
7. THE Backend SHALL implement API routes for: `CreateSecretCommand`, `UpdateSecretCommand`, `DeleteSecretCommand`, `ListSecretsCommand`, `GetSecretValueCommand`, `PutSecretValueCommand`, `DescribeSecretCommand`, `RotateSecretCommand`, `TagResourceCommand`, `UntagResourceCommand`, `GetResourcePolicyCommand`, `PutResourcePolicyCommand`.

---

### Requirement 20: Route 53 — Hosted Zone and Record Management

**User Story:** As a developer, I want full Route 53 DNS management so that I can configure hosted zones and DNS records for local services.

#### Acceptance Criteria

1. WHEN the user navigates to `/route53`, THE Console SHALL display a tabbed page with tabs: Hosted zones, Health checks, Traffic policies, Resolver, Domain registration.
2. WHEN the user is on the Hosted zones tab, THE Console SHALL display a ResourceTable with columns: Domain name, Type (Public/Private), Record count, Comment, Zone ID.
3. WHEN the user clicks "Create hosted zone", THE Console SHALL open a modal with: Domain name, Comment, Type (Public/Private), VPC (for private zones), Tags.
4. WHEN the user clicks on a hosted zone, THE Console SHALL navigate to a detail page listing all DNS records in a ResourceTable with columns: Record name, Type, Routing policy, Differentiator, Value/Route traffic to, TTL, Alias.
5. WHEN the user clicks "Create record", THE Console SHALL open a creation modal with fields: Record name, Record type (A, AAAA, CNAME, MX, NS, SOA, TXT, SRV, CAA, DS, PTR), Value, TTL, Routing policy (Simple, Weighted, Latency, Failover, Geolocation, Multivalue answer), and for alias records an alias target selector.
6. WHEN the user clicks "Edit record", THE Console SHALL open the same modal pre-filled with existing values.
7. THE Backend SHALL implement API routes for: `CreateHostedZoneCommand`, `DeleteHostedZoneCommand`, `ListHostedZonesCommand`, `ChangeResourceRecordSetsCommand`, `ListResourceRecordSetsCommand`, `GetHostedZoneCommand`, `CreateHealthCheckCommand`, `DeleteHealthCheckCommand`, `ListHealthChecksCommand`.

---

### Requirement 21: ECS — Container Orchestration

**User Story:** As a developer, I want full ECS cluster and service management so that I can deploy containerized workloads locally.

#### Acceptance Criteria

1. WHEN the user navigates to `/ecs-cluster`, THE Console SHALL display a ResourceTable of clusters with columns: Cluster name, Status, Active services, Running tasks, Pending tasks, Container instances.
2. WHEN the user clicks "Create cluster", THE Console SHALL open a creation wizard with: Cluster name, Infrastructure (Fargate, EC2, External), Networking (VPC, subnets), Monitoring (Container Insights), Tags.
3. WHEN the user clicks on a cluster, THE Console SHALL navigate to `/ecs-cluster/[clusterName]` with tabs: Services, Tasks, Scheduled tasks, Infrastructure (capacity providers, container instances), Metrics, Logging, Tags.
4. WHEN the user is on the Services tab, THE Console SHALL list services with columns: Service name, Status, Desired tasks, Running tasks, Pending tasks, Launch type.
5. WHEN the user creates a service, THE Console SHALL open a wizard collecting: Launch type, Task definition (family and revision), Service name, Desired tasks, Deployment configuration, Load balancer, Service discovery, Network configuration.
6. WHEN the user navigates to `/ecs-service`, THE Console SHALL list all services across all clusters.
7. THE Backend SHALL implement API routes for: `CreateClusterCommand`, `DeleteClusterCommand`, `DescribeClustersCommand`, `CreateServiceCommand`, `UpdateServiceCommand`, `DeleteServiceCommand`, `ListServicesCommand`, `RunTaskCommand`, `StopTaskCommand`, `ListTasksCommand`, `DescribeTasksCommand`, `RegisterTaskDefinitionCommand`, `DeregisterTaskDefinitionCommand`, `ListTaskDefinitionsCommand`, `DescribeTaskDefinitionCommand`.

---

### Requirement 22: ElastiCache — Cache Cluster Management

**User Story:** As a developer, I want ElastiCache cluster management so that I can create and manage Redis and Memcached clusters locally.

#### Acceptance Criteria

1. WHEN the user navigates to `/elasticache`, THE Console SHALL display a page with: a "Redis OSS caches" section and a "Memcached caches" section, each with a ResourceTable listing clusters.
2. WHEN the user clicks "Create Redis cluster", THE Console SHALL open a creation wizard with: Cluster mode (enabled/disabled), Location (AWS cloud), Cluster info (name, description), Cluster settings (engine version, port, parameter group, node type, replicas), Availability zone, Security (subnet group, VPC security groups, encryption at-rest, encryption in-transit), Tags.
3. WHEN the user clicks on a cluster, THE Console SHALL navigate to a detail page with tabs: Cluster details, Events, Nodes, Snapshots, Backup, Maintenance, Tags.
4. THE Backend SHALL implement API routes for: `CreateCacheClusterCommand`, `DeleteCacheClusterCommand`, `DescribeCacheClustersCommand`, `RebootCacheClusterCommand`, `CreateReplicationGroupCommand`, `DeleteReplicationGroupCommand`, `DescribeReplicationGroupsCommand`.

---

### Requirement 23: Systems Manager Parameter Store

**User Story:** As a developer, I want full Systems Manager Parameter Store management so that I can store and retrieve configuration parameters.

#### Acceptance Criteria

1. WHEN the user navigates to `/systems-manager-parameter-store`, THE Console SHALL display a ResourceTable with columns: Parameter name, Tier, Type (String/StringList/SecureString), Last modified, Version.
2. WHEN the user clicks "Create parameter", THE Console SHALL open a creation form with: Name (with `/` path-based hierarchy support), Description, Tier (Standard/Advanced/Intelligent-Tiering), Type (String/StringList/SecureString), KMS key (for SecureString), Value (Textarea), Tags.
3. WHEN the user clicks on a parameter, THE Console SHALL navigate to a detail page showing all versions with the ability to view any version's value (calling `GetParameterHistoryCommand`).
4. WHEN the user clicks "Edit parameter", THE Console SHALL open an edit form and call `PutParameterCommand` with the `Overwrite` flag.
5. THE Backend SHALL implement API routes for: `PutParameterCommand`, `GetParameterCommand`, `GetParametersByPathCommand`, `DescribeParametersCommand`, `DeleteParameterCommand`, `GetParameterHistoryCommand`, `AddTagsToResourceCommand`.

---

### Requirement 24: Kinesis — Stream Management

**User Story:** As a developer, I want full Kinesis Data Streams management so that I can test streaming data pipelines locally.

#### Acceptance Criteria

1. WHEN the user navigates to `/kinesis`, THE Console SHALL display a ResourceTable of streams with columns: Stream name, Status, Shards, Data retention, Encryption, Stream mode, Created.
2. WHEN the user clicks "Create data stream", THE Console SHALL open a creation form with: Stream name, Capacity mode (On-demand / Provisioned with shard count), Encryption, Tags.
3. WHEN the user clicks on a stream, THE Console SHALL navigate to a detail page with tabs: Details, Monitoring, Data viewer, Consumer, Tags.
4. WHEN the user is on the Data viewer tab, THE Console SHALL provide controls to get records from a specific shard (shard ID + starting position type: TRIM_HORIZON, AT_SEQUENCE_NUMBER, AT_TIMESTAMP), calling `GetShardIteratorCommand` then `GetRecordsCommand`, and display the retrieved records.
5. THE Backend SHALL implement API routes for: `CreateStreamCommand`, `DeleteStreamCommand`, `ListStreamsCommand`, `DescribeStreamCommand`, `GetShardIteratorCommand`, `GetRecordsCommand`, `PutRecordCommand`, `PutRecordsCommand`, `AddTagsToStreamCommand`, `MergeSharedsCommand`, `SplitShardCommand`.

---

### Requirement 25: EventBridge — Rules, Pipes, and Scheduler

**User Story:** As a developer, I want full EventBridge management so that I can configure event rules, pipes, and schedules locally.

#### Acceptance Criteria

1. WHEN the user navigates to `/eventbridge-schema` (EventBridge main page), THE Console SHALL display a tabbed page with tabs: Buses, Rules, Pipes, Scheduler, Schema registry, Replay.
2. WHEN the user is on the Rules tab, THE Console SHALL display rules for the selected event bus in a ResourceTable with columns: Name, State (Enabled/Disabled), Pattern, Target count, Created.
3. WHEN the user clicks "Create rule", THE Console SHALL open a creation wizard with: Rule detail (name, description, event bus), Define pattern (Event pattern: pre-defined pattern, custom pattern JSON editor; or Schedule: rate/cron expression), Target selection (Lambda, SQS, SNS, Step Functions, etc.), Tags.
4. WHEN the user navigates to `/eventbridge-pipe`, THE Console SHALL list all EventBridge Pipes with columns: Pipe name, State, Source, Filter (if any), Enrichment (if any), Target, Created.
5. WHEN the user navigates to `/eventbridge-scheduler`, THE Console SHALL list all EventBridge Scheduler schedules with columns: Schedule name, Schedule type, Schedule expression, Flexible time window, Target, State.
6. THE Backend SHALL implement API routes for: `ListRulesCommand`, `PutRuleCommand`, `DeleteRuleCommand`, `PutTargetsCommand`, `RemoveTargetsCommand`, `EnableRuleCommand`, `DisableRuleCommand`, `ListTargetsByRuleCommand` from `@aws-sdk/client-eventbridge`; and `CreatePipeCommand`, `DeletePipeCommand`, `ListPipesCommand`, `DescribePipeCommand` from `@aws-sdk/client-pipes`; and `CreateScheduleCommand`, `DeleteScheduleCommand`, `ListSchedulesCommand` from `@aws-sdk/client-scheduler`.

---

### Requirement 26: Cognito — User Pool and Identity Pool Management

**User Story:** As a developer, I want full Cognito management so that I can configure and test authentication workflows locally.

#### Acceptance Criteria

1. WHEN the user navigates to `/cognito`, THE Console SHALL display a tabbed page with tabs: User pools, Identity pools.
2. WHEN the user is on the User pools tab, THE Console SHALL display a ResourceTable with columns: User pool name, Pool ID, Status, Users, Created.
3. WHEN the user clicks "Create user pool", THE Console SHALL open a creation wizard with steps: Configure sign-in experience (username attributes, federated sign-in), Configure security requirements (password policy, MFA, user account recovery), Configure sign-up experience (self-registration, verification, required attributes), Configure message delivery (SES for email, SNS for SMS), Integrate your app (app client name, client secret, OAuth flows), Review and create.
4. WHEN the user clicks on a user pool, THE Console SHALL navigate to a detail page with tabs: Users, Groups, App clients, Triggers, Attributes, Policies, MFA and verifications, Messaging, Domain, UI customization, User pool analytics.
5. WHEN the user is on the Users tab, THE Console SHALL list users with: Username, Account status, Email verified, Phone verified, Created, Last modified, and support creating users, resetting passwords, disabling/enabling, and deleting.
6. THE Backend SHALL implement API routes for: `CreateUserPoolCommand`, `DeleteUserPoolCommand`, `ListUserPoolsCommand`, `DescribeUserPoolCommand`, `CreateUserPoolClientCommand`, `ListUserPoolClientsCommand`, `AdminCreateUserCommand`, `AdminDeleteUserCommand`, `AdminDisableUserCommand`, `AdminEnableUserCommand`, `ListUsersCommand`, `AdminResetUserPasswordCommand`, `AdminGetUserCommand`.

---

### Requirement 27: Cross-Service Resource Tagging

**User Story:** As a developer, I want to add, edit, and remove tags on any resource so that I can organize and filter resources the same way as in the real AWS Console.

#### Acceptance Criteria

1. WHEN the user is on any resource detail page that supports tagging, THE Console SHALL display a Tags tab with a ResourceTable of tags showing Key and Value columns.
2. WHEN the user clicks "Manage tags" or "Add tag", THE Console SHALL open a modal with a dynamic key-value pair editor allowing adding multiple tags at once.
3. WHEN the user removes a tag, THE Console SHALL confirm removal before calling the resource-specific untag API command.
4. THE Console SHALL support tagging for: EC2 instances, security groups, key pairs, volumes, snapshots, AMIs, VPCs, subnets, route tables, internet gateways, S3 buckets (via `PutBucketTaggingCommand`), Lambda functions (via `TagResourceCommand`), DynamoDB tables (via `TagResourceCommand`), RDS instances (via `AddTagsToResourceCommand`), SQS queues (via `TagQueueCommand`), SNS topics (via `TagResourceCommand`), IAM users/roles/policies, KMS keys, Secrets Manager secrets, CloudFormation stacks, ECS clusters and services, ElastiCache clusters, Kinesis streams, Step Functions state machines.
5. WHERE the resource supports the AWS Resource Groups Tagging API, THE Console SHALL allow searching for resources by tag key/value via `/resource-groups-tagging`.

---

### Requirement 28: Global Error Handling and Notifications

**User Story:** As a user, I want clear, actionable error messages for every failed operation so that I can diagnose problems quickly.

#### Acceptance Criteria

1. WHEN any Backend API route returns an HTTP status >= 400, THE Console SHALL display a Cloudscape `Flashbar` notification at the top of the page with `type="error"`, including the error message and, where available, the AWS error code.
2. WHEN any Backend API route returns a successful response for a write operation (create/update/delete), THE Console SHALL display a Cloudscape `Flashbar` notification with `type="success"` for 5 seconds.
3. THE Console SHALL maintain a notification queue allowing multiple simultaneous notifications, with each notification having an individual dismiss button.
4. WHEN an API call fails with `EMULATOR_UNREACHABLE`, THE Console SHALL display a persistent banner at the top of every page with instructions to start the Emulator (`docker compose up`).
5. IF a form field fails client-side validation (empty required field, invalid format), THEN THE Console SHALL display a Cloudscape `FormField` error message inline below the field without submitting the request to the Backend.
6. WHEN the user attempts a destructive operation (delete resource, terminate instance, drop database), THE Console SHALL display a Cloudscape `Modal` confirmation dialog that requires the user to type the resource name or ID before the action is submitted.

---

### Requirement 29: Performance and Loading States

**User Story:** As a user, I want the Console to be fast and responsive so that interactions feel immediate.

#### Acceptance Criteria

1. WHEN a service page mounts, THE Console SHALL initiate data fetching and display Cloudscape `Table` loading spinners within 100ms of navigation.
2. WHEN a Backend API route completes within 2000ms, THE Console SHALL update the UI without visible jitter.
3. THE Console SHALL cache resource list responses in React state per service page, and SHALL NOT re-fetch data unless the user explicitly clicks "Refresh" or triggers a write operation.
4. WHEN a list response exceeds 1000 items, THE Backend SHALL apply server-side pagination using service-specific continuation tokens (e.g., `NextToken`, `Marker`, `ExclusiveStartKey`) rather than fetching all items at once.
5. THE Console SHALL use `React.memo` and `useCallback`/`useMemo` on ResourceTable and DetailPanel components to prevent unnecessary re-renders.
6. THE Console SHALL code-split each service page so that the JavaScript bundle for a service is only loaded when the user navigates to that service.

---

### Requirement 30: Accessibility

**User Story:** As a user who relies on assistive technologies, I want the Console to be keyboard-navigable and screen-reader-friendly.

#### Acceptance Criteria

1. THE Console SHALL pass Cloudscape's built-in ARIA attributes through to all interactive components by using only official Cloudscape components — not wrapping them in arbitrary `div` elements that break focus management.
2. WHEN the user tabs through a ResourceTable, THE Console SHALL allow keyboard selection of rows using Space/Enter, and activation of action buttons using keyboard navigation.
3. ALL modals and wizards SHALL trap focus within them while open and return focus to the trigger element on close, using Cloudscape `Modal`'s and `Wizard`'s default focus management behavior.
4. ALL form fields SHALL have visible, programmatically-associated labels via Cloudscape `FormField`'s `label` prop.
5. THE Console SHALL set a meaningful `<title>` element on every page following the pattern `"[Service Name] | AWS Console"`.
6. ALL images and icons that convey information SHALL have `aria-label` attributes.

---

### Requirement 31: Developer Experience — Local Setup and Configuration

**User Story:** As a developer setting up this project, I want clear configuration and a seamless local development experience.

#### Acceptance Criteria

1. THE Console SHALL read all Emulator connection settings exclusively from environment variables: `AWS_ENDPOINT_URL`, `AWS_DEFAULT_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, with safe defaults for local development.
2. THE Console SHALL ship a `docker-compose.yml` that starts Ministack with state persistence (`PERSIST_STATE=1`, `S3_PERSIST=1`) and exposes port 4566.
3. THE Console SHALL ship a `scripts/seed.ts` that creates representative test data (S3 bucket, DynamoDB table, Lambda function, SQS queue, SNS topic, IAM user/role) when run against a fresh Emulator.
4. WHEN `npm run dev` is run, THE Console SHALL start without errors and immediately serve the Dashboard page.
5. THE Console SHALL maintain a `Makefile` with targets: `up` (start Emulator), `down` (stop Emulator), `seed` (run seed script), `dev` (start Next.js dev server), `build` (production build), `lint` (run ESLint).
6. THE Backend `src/lib/aws-clients.ts` SHALL export a typed, singleton AWS SDK client for every service that has an implemented API route.

---

### Requirement 32: Shared Component Library

**User Story:** As a developer building service pages, I want reusable, well-typed shared components so that all service pages are built consistently without copy-pasting.

#### Acceptance Criteria

1. THE Console SHALL implement a shared `ResourceTable` component in `src/components/ResourceTable.tsx` that is generic over its item type and accepts: `columnDefinitions`, `items`, `loading`, `empty`, `onRefresh`, `selectedItems`, `onSelectionChange`, `filteringText`, `onFilteringChange`, `currentPageIndex`, `pagesCount`, `onPageChange`, `preferences`, `onPreferencesChange`.
2. THE Console SHALL implement a shared `ConfirmModal` component in `src/components/ConfirmModal.tsx` for destructive operation confirmation with: `visible`, `resourceName`, `resourceType`, `onConfirm`, `onDismiss` props.
3. THE Console SHALL implement a shared `JsonEditor` component in `src/components/JsonEditor.tsx` using Cloudscape `Textarea` with client-side JSON parsing validation and an error message below the field when the JSON is invalid.
4. THE Console SHALL implement a shared `TagEditor` component in `src/components/TagEditor.tsx` for managing key-value tag pairs using dynamic add/remove rows.
5. THE Console SHALL implement a shared `useAwsApi` custom React hook in `src/hooks/useAwsApi.ts` that wraps `fetch` calls to Backend API routes, manages loading/error state, and triggers the global notification system.
6. THE Console SHALL implement a shared `NotificationContext` in `src/context/NotificationContext.tsx` that provides `addNotification(type, message)` and `dismissNotification(id)` functions accessible from any component.
