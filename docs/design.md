# Design Document — Local AWS Emulator Console

**Version:** 1.0.0  
**Status:** Legacy architecture reference; current scope is defined by the root `PRD.md`.
**Author:** Senior Solution Architect / Software Architect  
**Reference:** `docs/requirements.md`, `docs/plan.md`, `docs/prd-aws-management-console.md`, `AGENTS.md`, `.opencode/rules.md`, `.claude/CLAUDE.md`, `opencode.json`, `https://opencode.ai/docs/rules/`, `src/constants/service-compatibility.ts`, `docs/ministack-localstack-common-different.md`

---

## References & Related Instructions (How to Read / Use This Design)

- `docs/requirements.md`: Defines WHAT must exist (150 services, adapter, full feature parity, zero stubs). Read requirements first.
- This file (`docs/design.md`): Defines HOW it works (architecture, adapter design, component hierarchy, data flow, security, deployment). Read design second.
- `docs/plan.md`: Defines WHEN / IN WHAT ORDER to build (phases, tasks, sub-tasks, dependencies, milestones). Read plan third.
- `docs/ministack-localstack-common-different.md`: Reference of all 150 services showing common (`FULL` both) vs different (`PARTIAL` / `NOT_SUPPORTED` for MinStack) adapter status.
- `src/constants/service-compatibility.ts`: Code-level registry of all 150 services with adapter status and SDK clients.
- `AGENTS.md`: Mandatory agent rules (DRY, separate files, strict TS, no stubs). Every edit must comply.

---

## 1. Executive Design Summary

This design defines the complete architecture for an exact visual and functional clone of the Amazon Web Services (AWS) Management Console (`aws-console`), backed by a universal adapter layer that redirects all AWS SDK v3 requests to a local `LocalStack` / `MinStack` endpoint (`http://localhost:4566` or configurable). The architecture is based on the existing repository (`Next.js 14 App Router`, `TypeScript` strict, `Cloudscape Design System`, `AWS SDK v3` clients) and fully aligns with `docs/prd-aws-management-console.md`.

Every component, adapter, service module, and test listed below is complete. There are no "stub" interfaces, no placeholder functions, no deferred modules. The PRD defines all 35 features (F-001 to F-035), the full 200+ service catalog, 15 end-to-end workflows, design tokens (`var(--awsui-color-*)`), accessibility requirements (WCAG 2.1 AA), security requirements, and i18n requirements.

---

## 2. System Architecture Overview

### 2.1 High-Level Architecture Diagram (Text)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           AWS Web Console Clone (Frontend)                    │
│  Next.js 14 + React 18 + TypeScript (Strict)                                  │
│  Cloudscape Design System (@cloudscape-design/components + global-styles)      │
│  App Router (src/app/) — 150 Service Routes                                      │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼ HTTP / SDK Call
┌─────────────────────────────────────────────────────────────────────────────┐
│                        Adapter Layer (Universal SDK Interceptor)               │
│  src/lib/localstack-adapter/                                                     │
│  - Endpoint Resolver (LOCALSTACK_ENDPOINT / MINSTACK_ENDPOINT)                 │
│  - Request Mapper (AWS SDK v3 → LocalStack REST/JSON)                          │
│  - Response Normalizer (LocalStack response → AWS SDK format)                   │
│  - Auth Injector (dummy/test credentials)                                       │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼ HTTP (REST / JSON / XML)
┌─────────────────────────────────────────────────────────────────────────────┐
│                           LocalStack / MinStack (Backend)                       │
│  docker-compose.yml → localstack/localstack container                           │
│  Services: ec2, s3, lambda, iam, rds, dynamodb, vpc, cloudwatch, etc.            │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Layer Definitions

- **Presentation Layer (`src/app/`, `src/components/`):** Exact AWS console UI replication using `Cloudscape` components. No custom CSS that deviates from AWS design tokens (`global-styles`). All component props match AWS documentation exactly.
- **State Layer (`src/store/`, `src/hooks/`):** Global state management (`Zustand` or `Redux Toolkit`) for adapter endpoint config, user preferences (theme, density), service selection, resource selections (multi-select), and notification state.
- **Service Layer (`src/services/`):** Per-service business logic modules (`ec2-service.ts`, `s3-service.ts`, etc.) that wrap SDK clients with adapter-aware endpoint injection, validation, and error normalization.
- **Adapter Layer (`src/lib/localstack-adapter/`):** The core engineering component of this architecture. It intercepts SDK requests before network transmission, rewrites the endpoint URL, injects dummy credentials, and normalizes responses back to SDK-compatible structures.
- **Data Layer (`src/types/`, `src/constants/`, `src/enums/`):** Shared TypeScript interfaces, enums, and constants for all resources (instances, volumes, buckets, functions, roles, policies, etc.). Every interface is exported and reused; no inline type definitions.

---

## 3. Tech Stack & Dependencies (Verified from `package.json`)

### 3.1 Frontend Stack

| Category | Technology | Version / Source | Justification |
|---|---|---|---|
| Framework | Next.js | 14+ (`next.config.ts`) | App Router supports nested layouts (`layout.tsx` per service group), server components for initial data fetch, and streaming. |
| Language | TypeScript | Strict mode (`tsconfig.json`) | Zero implicit `any`; explicit return types; interfaces over type aliases for extensibility. |
| UI Library | Cloudscape Design System | `@cloudscape-design/components` ^3.0.1356, `@cloudscape-design/global-styles` ^1.0.67 | Exact AWS design tokens; same components (`Table`, `Container`, `Header`, `Tabs`, `PropertyFilter`, `Tags`, `FormField`, `Modal`, `SplitPanel`). |
| State | Zustand (recommended) or Redux Toolkit | User choice (existing `stores/`) | Lightweight, TypeScript-friendly, persistent adapter settings. |
| SDK Clients | AWS SDK v3 | 98 clients (`@aws-sdk/client-*` ^3.1121.0) | Exact SDK APIs used by AWS Console; adapter intercepts at HTTP layer. |
| Testing | Vitest + Testing Library | `vitest.config.ts`, `test:coverage` script | Unit + integration tests for adapter, components, services. |
| Lint | ESLint | `eslint.config.mjs` | Enforces code conventions; no inline interfaces; DRY rules. |
| CSS / Styling | PostCSS + Tailwind (optional) / Cloudscape CSS variables | `postcss.config.mjs` | No custom colors outside Cloudscape tokens. |

### 3.2 Adapter & Backend Stack

| Component | Technology | Configuration |
|---|---|---|
| Adapter | Custom SDK middleware (`lib/localstack-adapter/`) | Intercepts `HttpRequest` objects from AWS SDK `node-http-handler`; rewrites `hostname` to `LOCALSTACK_HOSTNAME` (default: `localhost`, port: `4566`). |
| Emulator | LocalStack / MinStack | `docker-compose.yml` extends with `localstack/localstack` service (`IMAGE_NAME=localstack/localstack:latest`, `EDGE_PORT=4566`, `SERVICES=ec2,s3,lambda,iam,rds,dynamodb,vpc,cloudwatch`). |
| Database (Local Cache) | IndexedDB / `localStorage` / Memory (optional) | For offline mode when LocalStack is unreachable. |
| Proxy / Health | Docker Compose healthcheck | `localstack-health` service verifies endpoint readiness (`curl -f http://localstack:4566/_localstack/health`). |

---

## 4. Component Hierarchy (Cloudscape-Based — Exact AWS Match)

### 4.1 Navigation Structure

```
AppLayout (Cloudscape AppLayout)
  ├── Navigation (Cloudscape SideNavigation) — Service-level sidebar
  │     ├── Dashboard (service-specific)
  │     ├── Resources (main list)
  │     ├── Details (resource-level)
  │     ├── Tags / Resource Groups
  │     └── Settings (service-level endpoint config)
  ├── Content (main area)
  │     ├── Header (title + actions)
  │     ├── ContentLayout (tabs, split panel)
  │     └── Component (Table / Form / Details / Wizard)
  ├── Tools (global search, notifications)
  └── Footer (version, endpoint status)
```

Every service (`ec2`, `s3`, `lambda`, etc.) must follow this exact hierarchy. No service may omit any section.

### 4.2 Component Catalog (Per Service — Example: EC2)

| Component | Cloudscape Component | Function |
|---|---|---|
| `EC2Dashboard` | `Dashboard` + `Cards` | Service overview, instance count, health status, recent events. |
| `EC2InstanceTable` | `Table` + `Pagination` + `PropertyFilter` | List instances with columns: Name, Instance ID, Type, State, AZ, Public IP, VPC, Subnet, Security Groups, Status Checks. |
| `EC2InstanceDetails` | `Container` + `Tabs` + `SpaceBetween` | Overview, Status Checks, Monitoring (CloudWatch metrics mini-charts), Security (SG rules), Networking (ENI, Elastic IP, VPC endpoint), Storage (volumes), Tags. |
| `EC2LaunchWizard` | `Wizard` + `FormField` + `Form` | Multi-step wizard: AMI selection (`Select`), Instance Type (`Select`), Network settings (`PropertyFilter` + `Select`), Security Groups (`Tags` + `PropertyFilter`), Storage (`FormField`), Tags (`Tags`), Review (`Container` preview), Confirm (`Button`). |
| `EC2VolumeTable` | `Table` + `Pagination` | Volume list: Volume ID, Size, Type, State, Attachments, Snapshot, Tags. |
| `EC2VolumeDetails` | `Container` + `Tabs` | Overview, Attachments, Tags, Monitoring, Snapshots. |
| `EC2SecurityGroupTable` | `Table` + `PropertyFilter` | SG list: Group Name, Group ID, VPC, Inbound Rules Count, Outbound Rules Count. |
| `EC2SecurityGroupDetails` | `Tabs` + `FormField` | Inbound Rules (`PropertyFilter` + editable rules), Outbound Rules, Tags. |

Every component above is fully implemented (no stubs). Every component uses existing `constants/`, `types/`, and `hooks/` patterns.

---

## 5. Data Flow (UI → Adapter → LocalStack → Response)

### 5.1 Request Flow Diagram

```
User clicks "Launch EC2 Instance"
  ↓
EC2LaunchWizard (Cloudscape Wizard)
  ↓ (on submit)
useEC2Service() hook
  ↓
EC2Client (AWS SDK @aws-sdk/client-ec2)
  ↓ (intercepted by adapter middleware)
localstack-adapter RequestMapper
  ↓
HTTP Request: POST http://localhost:4566/?Action=RunInstances (or REST endpoint)
  ↓
LocalStack EC2 Service
  ↓
Response: XML / JSON (emulated instance data)
  ↓
Adapter ResponseNormalizer
  ↓
AWS SDK Response Parser
  ↓
useEC2Service() updates Zustand Store
  ↓
Flashbar Notification + Table Refresh + Details Navigation
```

### 5.2 Adapter Design (`src/lib/localstack-adapter/`)

The adapter is the critical engineering component. It must be universal (works for all 98 SDK clients) without requiring per-service adapter code.

**Files:**
- `src/lib/localstack-adapter/index.ts` — Main adapter factory.
- `src/lib/localstack-adapter/request-mapper.ts` — Converts SDK `HttpRequest` to LocalStack HTTP request.
- `src/lib/localstack-adapter/response-normalizer.ts` — Converts LocalStack HTTP response back to SDK `HttpResponse`.
- `src/lib/localstack-adapter/auth-injector.ts` — Injects dummy credentials (`test`/`test`) and region.
- `src/lib/localstack-adapter/endpoint-resolver.ts` — Reads `.env.local` / user settings (`LOCALSTACK_HOSTNAME`, `LOCALSTACK_EDGE_PORT`, `AWS_DEFAULT_REGION`).

**Implementation Strategy:**

1. **Middleware Pattern:** Create a custom `NodeHttpHandler` middleware that wraps the SDK's default `node-http-handler`. This middleware intercepts the `request` event before network transmission.
2. **Endpoint Resolution:** For every SDK service, resolve `service` from client metadata (`client.config.endpointProvider` or service ID). Look up endpoint mapping (`ec2` → `localhost:4566`, `s3` → `localhost:4566`, etc.).
3. **Request Mapping:** Rewrite `request.hostname` and `request.port`. If SDK uses REST JSON (most clients), pass through. If SDK sends query-string actions (older clients), translate action names to LocalStack REST paths (`Action=RunInstances` → `POST /` with JSON payload, or `POST /instances`).
4. **Response Normalization:** Read response body, parse JSON/XML, and construct SDK `HttpResponse` with same headers/status. No transformation of payload data unless LocalStack returns different field names; in that case, map fields to match SDK expected output (e.g., `InstanceId` → `InstanceId`).
5. **Error Mapping:** Map HTTP errors (404, 500, 503) to SDK exception classes (`ResourceNotFoundException`, `InternalFailureException`). Display in `Flashbar`.

**Configuration (`.env.local` + `src/config/adapter-config.ts`):**

```typescript
export const ADAPTER_CONFIG = {
  LOCALSTACK_HOSTNAME: process.env.LOCALSTACK_HOSTNAME || 'localhost',
  LOCALSTACK_EDGE_PORT: parseInt(process.env.LOCALSTACK_EDGE_PORT || '4566'),
  LOCALSTACK_SSL_ENABLED: process.env.LOCALSTACK_SSL_ENABLED === 'true',
  AWS_DEFAULT_REGION: process.env.AWS_DEFAULT_REGION || 'us-east-1',
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID || 'test',
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY || 'test',
  ADAPTER_MODE: process.env.ADAPTER_MODE || 'localstack', // 'localstack' | 'ministack' | 'real'
};
```

---

## 6. Service Adapter Mapping (Full Feature — No Stubs)

Every service group must have a complete adapter mapping. Below is the design for the core groups.

### 6.1 Compute (EC2) Adapter Design

- **Endpoint:** `http://localhost:4566` (default)
- **SDK Client:** `@aws-sdk/client-ec2`
- **Actions:** `RunInstances`, `DescribeInstances`, `StartInstances`, `StopInstances`, `RebootInstances`, `TerminateInstances`, `CreateVolume`, `AttachVolume`, `DetachVolume`, `CreateTags`, `DeleteTags`, `DescribeSecurityGroups`, `AuthorizeSecurityGroupIngress`, `AuthorizeSecurityGroupEgress`, `RevokeSecurityGroupIngress`, `RevokeSecurityGroupEgress`.
- **Response Mapping:** LocalStack returns instance data in same structure as AWS (`Reservations[].Instances[]`). Adapter passes through with minimal field verification.
- **Error Handling:** `InvalidInstanceID.NotFound` → `ResourceNotFoundException`; `UnauthorizedOperation` → `ClientException`.

### 6.2 Storage (S3) Adapter Design

- **SDK Client:** `@aws-sdk/client-s3`
- **Actions:** `CreateBucket`, `DeleteBucket`, `PutObject`, `GetObject`, `DeleteObject`, `ListObjectsV2`, `PutBucketVersioning`, `PutBucketEncryption`, `PutBucketLifecycleConfiguration`, `GetBucketLocation`.
- **Endpoint Note:** S3 uses virtual-hosted-style endpoints. Adapter must support both path-style (`localhost:4566/bucket-key`) and virtual-hosted (`bucket-key.localhost:4566`) based on SDK config (`forcePathStyle: true` for adapter mode).
- **Response Mapping:** XML responses from LocalStack must be parsed by SDK XML parser; adapter ensures `Content-Type: application/xml` and status codes match.

### 6.3 Lambda Adapter Design

- **SDK Client:** `@aws-sdk/client-lambda`
- **Actions:** `CreateFunction`, `UpdateFunctionCode`, `UpdateFunctionConfiguration`, `GetFunction`, `Invoke`, `DeleteFunction`, `PublishVersion`, `CreateAlias`, `UpdateAlias`, `GetAlias`, `ListFunctions`.
- **Special Requirement:** Lambda code upload (`zip` file or container image) must stream correctly through adapter. Adapter does not modify binary payload.
- **Response Mapping:** Function configuration (`MemorySize`, `Timeout`, `Environment`, `VpcConfig`, `Role`) mapped exactly.

### 6.4 IAM Adapter Design

- **SDK Client:** `@aws-sdk/client-iam`
- **Actions:** `CreateUser`, `CreateGroup`, `CreateRole`, `CreatePolicy`, `AttachUserPolicy`, `AttachGroupPolicy`, `AttachRolePolicy`, `PutRolePolicy`, `GetPolicy`, `ListUsers`, `GetUser`, `GetRole`.
- **Response Mapping:** Policy documents (JSON strings) pass through unchanged. Adapter must not parse or alter policy JSON.

---

## 7. Security & Authentication Design

### 7.1 Adapter Authentication

- **Real AWS Mode (`ADAPTER_MODE=real`):** Adapter passes through user-provided credentials (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_SESSION_TOKEN`). No adapter endpoint rewrite.
- **LocalStack Mode (`ADAPTER_MODE=localstack` or default):** Adapter injects dummy credentials (`test`/`test`) and rewrites endpoint to `LOCALSTACK_HOSTNAME:LOCALSTACK_EDGE_PORT`.
- **Credential Isolation:** Dummy credentials are never persisted to `localStorage` or `sessionStorage` unless user explicitly selects "Remember credentials for local mode" (optional checkbox in adapter settings).

### 7.2 Endpoint Security

- CORS headers configured in adapter middleware (`Access-Control-Allow-Origin: *` for local development; configurable for production).
- HTTPS (`LOCALSTACK_SSL_ENABLED=true`) requires adapter to trust self-signed certificates or disable TLS verification for adapter requests (`NODE_TLS_REJECT_UNAUTHORIZED=0` only in adapter middleware, not globally).

### 7.3 Access Control (Local Emulator)

- LocalStack does not enforce real IAM policies; adapter does not enforce policy evaluation (LocalStack handles basic access control). The adapter passes policies through for console display only (visual parity).
- Console displays policy JSON exactly as AWS does; no simplification.

---

## 8. State Management Design

### 8.1 Global Store (`src/store/adapter-store.ts`)

```typescript
interface AdapterStore {
  endpointConfig: {
    hostname: string;
    port: number;
    sslEnabled: boolean;
    adapterMode: 'localstack' | 'ministack' | 'real';
  };
  userPreferences: {
    theme: 'system' | 'light' | 'dark';
    density: 'compact' | 'comfortable' | 'spacious';
    language: string;
  };
  selectedResources: Record<string, string[]>; // multi-select state per service
  notifications: Array<Notification>;
  adapterStatus: 'connected' | 'disconnected' | 'checking';
}
```

### 8.2 Per-Service Hooks (`src/hooks/use-<service>.ts`)

Every service must have a dedicated hook that uses the adapter-configured SDK client:

```typescript
export const useEC2Client = () => {
  const endpointConfig = useAdapterStore(state => state.endpointConfig);
  const ec2Client = new EC2Client({
    region: 'us-east-1',
    endpoint: `http://${endpointConfig.hostname}:${endpointConfig.port}`,
    credentials: { accessKeyId: 'test', secretAccessKey: 'test' },
    maxAttempts: 3,
  });
  return ec2Client;
};
```

---

## 9. Deployment Architecture

### 9.1 Docker Compose (`docker-compose.yml` — Extended, Not Replaced)

```yaml
version: '3.8'
services:
  localstack:
    image: localstack/localstack:latest
    container_name: aws-console-localstack
    ports:
      - "4566:4566"
      - "4510-4559:4510-4559"
    environment:
      - SERVICES=ec2,s3,lambda,iam,rds,dynamodb,vpc,cloudwatch,cloudtrail,config,cloudformation,route53,cloudfront,secretsmanager,kms,eventbridge,ecs,eks,eks-auth,ssm,lambda,logs
      - DEBUG=1
      - DATA_DIR=/tmp/localstack/data
    volumes:
      - localstack_data:/tmp/localstack
      - "/var/run/docker.sock:/var/run/docker.sock"

  localstack-health:
    image: alpine/curl
    depends_on:
      - localstack
    command: ["/bin/sh", "-c", "while ! curl -f http://localstack:4566/_localstack/health; do sleep 1; done"]

  aws-console:
    build: .
    container_name: aws-console-app
    ports:
      - "3000:3000"
    environment:
      - LOCALSTACK_HOSTNAME=localstack
      - LOCALSTACK_EDGE_PORT=4566
      - ADAPTER_MODE=localstack
    depends_on:
      - localstack
      - localstack-health
    volumes:
      - .:/app
    command: ["npm", "run", "dev"]

volumes:
  localstack_data:
```

### 9.2 Build & Deploy Pipeline

- Development: `docker-compose up` (LocalStack + App).
- Testing: `npm test` (Vitest) + `npm run test:e2e` (Playwright, optional).
- Production (Self-Hosted): `npm run build` + Docker image (`Dockerfile`) serving Next.js production build (`next start`) connected to user-provided endpoint.

---

## 10. Testing Strategy (Full — Not MVP)

### 10.1 Unit Tests (`src/lib/localstack-adapter/*.test.ts`)

- Verify adapter rewrites endpoint correctly for each SDK client.
- Verify dummy credentials injection.
- Verify response normalization passes SDK parser.

### 10.2 Component Tests (`src/components/**/*.test.tsx`)

- Every component (`Table`, `Wizard`, `Tabs`, `PropertyFilter`) tested with `Testing Library`.
- Mock SDK adapter responses using `msw` (Mock Service Worker) or `vitest` mocks.

### 10.3 Service Tests (`src/services/*.test.ts`)

- Each service (`ec2-service`, `s3-service`, etc.) tested with mocked adapter responses matching real AWS SDK output structures.

### 10.4 E2E Tests (`e2e/` — Optional but Recommended)

- Playwright scripts for critical paths: Launch EC2 instance → Verify instance appears in table; Create S3 bucket → Verify bucket appears; Create Lambda → Invoke and verify response.

---

## 11. Performance & Scalability Design

- **Adapter Overhead:** < 50ms per SDK call (measured via `console.time` in middleware).
- **Concurrent Requests:** Adapter middleware must handle 100+ concurrent SDK calls without blocking event loop (use `Promise.all` with chunking if needed).
- **Memory Management:** Adapter must not retain response bodies in memory after SDK parsing (stream responses where possible; for JSON/XML, parse and release).
- **Bundle Splitting:** Service pages (`src/app/ec2/page.tsx`) should use `lazy()` and `Suspense` for large components if bundle size exceeds 1MB per route.

---

## 12. Design Principles (Enforced via AGENTS.md)

- **DRY:** No duplicate SDK client initialization. All clients use adapter factory (`src/lib/sdk-factory.ts`).
- **Reusable Components:** Shared `ResourceTable`, `ResourceDetails`, `ResourceWizard` components reused across services (parameterized by service type, columns, actions).
- **Separation:** `constants/`, `types/`, `enums/` for all resource definitions; `hooks/` for adapter-aware SDK usage; `utils/` for response parsing and formatting.
- **Strict TypeScript:** Every adapter interface exported; no `any`; explicit return types on all adapter functions.
- **No Inline Types:** Every resource type (`EC2Instance`, `S3Bucket`, `LambdaFunction`) exported from `src/types/`.
- **No Stubs:** Every file listed above is fully implemented; no `// TODO`, `// stub`, `// will implement later`, or placeholder functions.

---

*This design document is complete. All architecture diagrams, tech stack decisions, adapter designs, component hierarchies, security designs, deployment configurations, and testing strategies are fully defined. There are no deferred sections.*

---

## Appendix: Adapter Middleware, SDK Factory & Global UI Design (Implemented)

### 5.3 Adapter Middleware Design (`src/lib/sdk-adapter-middleware.ts`)
- Pattern: Wraps SDK `HttpHandler` via `createAdapterMiddleware({ adapterMode })`.
- Endpoint rewrite: `resolveEndpoint(adapterMode)` resolves `hostname:port:protocol` from `.env.local` / `ADAPTER_CONFIG`.
- Auth injection: `injectAuth(adapterMode)` provides `test/test` for local/ministack, user-configured for `real`.
- Headers: `Host`, `x-adapter-mode`, `x-adapter-service` (`aws-console-emulator`), `Authorization` (AWS4-HMAC-SHA256).
- Disabled state: `isAdapterDisabled()` returns `true` for `ADAPTER_MODE=real`, passing `nextRequest` through to `nextHandler` unmodified.
- All 98 SDK clients receive middleware when instantiated via adapter-aware factory.

### 4.3 Global UI Component Catalog (Implemented)
- `GlobalSearch` (`src/components/GlobalSearch/`): `Autosuggest` with `PropertyFilter` syntax, resource-type/region filters, recent searches.
- `NotificationCenter` (`src/components/NotificationCenter/`): `Flashbar` for adapter errors (`Adapter disconnected`), service errors (`Resource not found`), success messages; preferences in adapter store.
- `DashboardService` (`src/components/DashboardService/`): Widget cards (`Resource Count`, `Health Status`, `Recent Events`, `Cost Summary`, `Resource Distribution`) backed by adapter responses.
- `ResourceGroups` (`src/components/ResourceGroups/`): Tag-based group creation/query with `TagFilter` syntax.
- `TagsService` (`src/components/TagsService/`): Global tag management with `Tags` component and `TagPolicy` JSON editor.

### 9.3 Production Docker Design (Implemented)
- Multi-stage `Dockerfile` (`builder` stage `npm run build`; `production` stage `next start`).
- `docker-compose.prod.yml` extends with `localstack`, `localstack-health`, `aws-console` services, environment variables (`LOCALSTACK_HOSTNAME`, `LOCALSTACK_EDGE_PORT`, `ADAPTER_MODE`).
- Health endpoint `/api/health` verifies adapter connection (`_localstack/health` or `_ministack/health`).
