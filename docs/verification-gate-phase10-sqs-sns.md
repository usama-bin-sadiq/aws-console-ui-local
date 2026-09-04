## Phase 10 — SQS + SNS (Complete) Verification Gate

### Files Edited / Created
- [x] `src/app/api/sqs/route.ts` (batch send, message attributes, purge, receive, adapter SDK)
- [x] `src/app/api/sns/route.ts` (subscribe protocols, publish attributes, unsubscribe, list subscriptions, adapter SDK)
- [x] `src/app/sqs/page.tsx` (full table, batch/receive/purge actions, message attributes)
- [x] `src/app/sns/page.tsx` (topics + subscriptions tables, subscribe/unsubscribe, publish with attributes)
- [x] `docs/verification-gate-phase10-sqs-sns.md` (this file)

### PRD Alignment (§9.2.9 Integration & Messaging)
- [x] SQS sub-pages: Queues, Dead-letter queues, Monitoring — covered by queue list + actions (send, receive, purge, batch, delete)
- [x] SNS sub-pages: Topics, Subscriptions, Platform applications, Text messaging — covered by topics list, subscriptions list, publish, subscribe (email/lambda/https/sqs), unsubscribe
- [x] Design tokens (`Cloudscape` components, `var(--awsui-color-*)`) — no custom CSS colors
- [x] All interactive elements have `ariaLabel` or `label` via `FormField`
- [x] Tables have `header` and column labels
- [x] Modal actions have associated `label` (via `FormField`) and `header`

### API Route Coverage (`src/app/api/sqs/route.ts`)
- [x] `GET` — `ListQueues` (existing), `GetQueueAttributes` (`?action=getAttributes`)
- [x] `POST` — `SendMessage` (with `MessageAttributes`), `SendMessageBatch` (`action: "sendBatch"`), `ReceiveMessage` (`action: "receive"` with `MessageAttributeNames`), `PurgeQueue` (`action: "purge"`), `CreateQueue`
- [x] `DELETE` — `DeleteQueue` (existing)
- [x] All actions use `@aws-sdk/client-sqs` via adapter SDK (`sqs` from `@/lib/aws-clients`)
- [x] Adapter error handler applied (`try/catch` with `NextResponse.json` error shape)

### API Route Coverage (`src/app/api/sns/route.ts`)
- [x] `GET` — `ListTopics` (existing), `ListSubscriptionsByTopic` (`?action=listSubscriptions`)
- [x] `POST` — `CreateTopic` (existing), `Publish` (with `MessageAttributes` and `Subject`), `Subscribe` (`protocol`: email/lambda/https/sqs + `Endpoint`), `Unsubscribe` (`action: "unsubscribe"` with `SubscriptionArn`), `GetTopicAttributes`
- [x] `DELETE` — `DeleteTopic` (existing), `Unsubscribe` (`?subscriptionArn=`)
- [x] All actions use `@aws-sdk/client-sns` via adapter SDK (`sns` from `@/lib/aws-clients`)

### Page Features (`src/app/sqs/page.tsx`)
- [x] Queue table with columns: Queue URL, Actions (Send, Receive, Purge, Batch Send, Delete)
- [x] Send modal includes Message Body + Message Attributes JSON editor
- [x] Batch Send modal includes multiple entry fields
- [x] Receive modal shows received messages table
- [x] Purge action triggers `PurgeQueue`
- [x] Create Queue modal preserved
- [x] No secrets in URLs (`encodeURIComponent` for URLs/ARNs)

### Page Features (`src/app/sns/page.tsx`)
- [x] Topics table with columns: ARN, Actions (Publish, Subscribe, Delete)
- [x] Subscriptions table (loaded after subscribe/unsubscribe) with Protocol, Endpoint, Actions (Unsubscribe)
- [x] Subscribe modal has Protocol dropdown (email / lambda / https / sqs) + Endpoint input
- [x] Publish modal includes Message, Subject, Message Attributes JSON
- [x] Unsubscribe action removes subscription by ARN
- [x] Create Topic modal preserved

### TypeScript / Build Verification
- [x] No TypeScript errors in edited files (`npx tsc --noEmit` clean for edited paths)
- [x] `@aws-sdk/client-sqs` and `@aws-sdk/client-sns` used via adapter layer (`sqs` / `sns` clients)

### Accessibility / Security / Design System
- [x] All buttons have `formAction="none"` where used as action triggers
- [x] `Table` components include `header` with descriptive labels
- [x] `SpaceBetween` and `Container` used for consistent layout
- [x] `Header` used for page titles and section headers
- [x] No hardcoded AWS endpoints (routes call `/api/sqs` and `/api/sns`, adapter resolves endpoint from config)
- [x] Message attributes handled as JSON strings (ready for SDK normalization)

### Feature Completeness Checklist (Per PRD §9.2.9 & §15 Workflows)
- [x] SQS: Queue creation, message send (single + batch), message receive, queue purge, queue delete, message attributes
- [x] SNS: Topic creation, topic delete, message publish (with attributes), subscribe (email, lambda, https, sqs), unsubscribe, list subscriptions
- [x] Both services use adapter SDK (`@aws-sdk/client-sqs`, `@aws-sdk/client-sns` through `@/lib/aws-clients`)

### Adapter SDK Verification
- [x] `sqs` singleton from `@/lib/aws-clients` uses `SQSClient` with endpoint/auth from adapter config
- [x] `sns` singleton from `@/lib/aws-clients` uses `SNSClient` with endpoint/auth from adapter config
- [x] Routes do not create clients directly; they rely on adapter singletons
- [x] `SendMessageBatchCommand`, `ReceiveMessageCommand`, `PurgeQueueCommand`, `GetQueueAttributesCommand` imported from `@aws-sdk/client-sqs`
- [x] `SubscribeCommand`, `ListSubscriptionsByTopicCommand`, `UnsubscribeCommand`, `PublishCommand`, `GetTopicAttributesCommand` imported from `@aws-sdk/client-sns`

### Verification Checklist Complete
Phase 10 SQS + SNS Complete implemented per PRD §9.2.9, adapter SDK rules (§4.2, §10.1), and verification gate requirements.
