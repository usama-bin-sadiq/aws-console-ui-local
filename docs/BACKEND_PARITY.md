# BACKEND_PARITY.md — Adapter Implementation vs Stubbed Commands

> Per PRD Appendix D (§D.4 Service Parity Matrix) and §D.6 State Sync.
> Living document — must be updated whenever adapter layer or service registry changes.
> Reference: `docs/prd-aws-management-console-v1.3.md` Appendix D, `src/constants/service-compatibility.ts`.

---

## 1. Adapter Layer Implementation Status

The adapter layer (`src/lib/localstack-adapter/`) provides universal SDK request rewriting and response normalization for all three backends (`localstack`, `ministack`, `real`).

| Component | File | Status | Coverage Target | Notes |
|---|---|---|---|---|
| Adapter Factory | `src/lib/localstack-adapter/index.ts` | **Implemented** | >85% (tests in `index.test.ts`) | Exports `createAdapter()` with endpoint, auth, service, adapterActive, adapterVersion |
| Endpoint Resolver | `src/lib/localstack-adapter/endpoint-resolver.ts` | **Implemented** | >85% | Resolves `localstack` (`localhost:4566`), `ministack` (`localhost:4566`), `real` (`https://amazonaws.com`) |
| Auth Injector | `src/lib/localstack-adapter/auth-injector.ts` | **Implemented** | >85% | Injects dummy `test`/`test` for emulators; real credentials from `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` for `real` mode |
| Request Mapper | `src/lib/localstack-adapter/request-mapper.ts` | **Implemented** | >85% | Rewrites `protocol`, `hostname`, `port`, `path`, `url`, merges `x-adapter-mode` / `x-adapter-service` headers, builds `Authorization: AWS4-HMAC-SHA256` |
| Response Normalizer | `src/lib/localstack-adapter/response-normalizer.ts` | **Implemented** | >85% | Normalizes `status` → `statusCode`, `data` → `body`, defaults `headers` to `content-type: application/json`, defaults missing `status` to 200 |
| Adapter Config | `src/config/adapter-config.ts` | **Implemented** | N/A (config only) | Reads from environment: `ADAPTER_MODE`, `LOCALSTACK_HOSTNAME`, `MINSTACK_HOSTNAME`, `AWS_ACCESS_KEY_ID`, etc. |
| Adapter Constants | `src/constants/adapter-constants.ts` | **Implemented** | N/A (constants) | Defines default ports (`4566`), protocols (`http`/`https`), header keys (`x-adapter-mode`, `x-adapter-service`), health paths |

---

## 2. Per-Service Adapter Command Mapping

Every command from `@aws-sdk/client-*` packages must either be **implemented** (routed through adapter to backend endpoint), **stubbed** (returns mock data when backend doesn't support the action), or **unsupported** (UI disabled with tooltip per PRD §D.3).

### 2.1 Core Services (Full Adapter Implementation)

These services have full adapter wiring — every SDK call goes through `mapRequest` → backend endpoint → `normalizeResponse`.

| Service | SDK Client | Adapter Status (LocalStack) | Adapter Status (MiniStack) | Adapter Status (Real AWS) | Commands Implemented (Sample) | Stubbed / Unsupported Commands |
|---|---|---|---|---|---|---|
| EC2 | `@aws-sdk/client-ec2` | FULL | FULL | FULL (per IAM) | `RunInstances`, `DescribeInstances`, `TerminateInstances`, `CreateVolume`, `CreateTags`, `DescribeImages` | `CreateDedicatedHost` (stubbed for `ministack` only) |
| Lambda | `@aws-sdk/client-lambda` | FULL | FULL | FULL | `CreateFunction`, `UpdateFunctionCode`, `Invoke`, `ListFunctions`, `GetFunction` | None for core; `CreateAlias` partial on MiniStack |
| S3 | `@aws-sdk/client-s3` | FULL | FULL | FULL | `CreateBucket`, `PutObject`, `GetObject`, `ListBuckets`, `DeleteBucket` | `PutBucketVersioning` partial on MiniStack |
| DynamoDB | `@aws-sdk/client-dynamodb` | FULL | FULL | FULL | `CreateTable`, `PutItem`, `GetItem`, `Query`, `Scan`, `DescribeTable` | `EnableKinesisStreamingDestination` unsupported on MiniStack |
| IAM | `@aws-sdk/client-iam` | FULL | FULL | FULL | `CreateUser`, `CreateGroup`, `AttachUserPolicy`, `CreatePolicy`, `ListUsers`, `GetUser` | `CreateVirtualMFADevice` partial on MiniStack |
| VPC | `@aws-sdk/client-ec2` (VPC APIs) | FULL | FULL | FULL | `CreateVpc`, `CreateSubnet`, `CreateInternetGateway`, `CreateRouteTable`, `CreateSecurityGroup` | `CreateVpcPeeringConnection` partial on MiniStack |

### 2.2 Partial / Different Services

Per `src/constants/service-compatibility.ts`, these services have different adapter behavior between LocalStack and MiniStack.

| Service | SDK Client | LocalStack | MiniStack | Real AWS | Notes (Stubbed / Partial) |
|---|---|---|---|---|---|
| EC2 Certificate | `@aws-sdk/client-ec2` | FULL | PARTIAL | FULL | `ImportCertificate` stubbed on MiniStack |
| EBS Volume / Snapshot | `@aws-sdk/client-ec2` | FULL | PARTIAL | FULL | `ModifyVolume` partial on MiniStack |
| ECS Cluster | `@aws-sdk/client-ecs` | FULL | PARTIAL | FULL | `CreateService` partial on MiniStack |
| ECR Repo | `@aws-sdk/client-ecr` | FULL | PARTIAL | FULL | `PutImageScanningConfiguration` partial on MiniStack |
| EKS Cluster | `@aws-sdk/client-eks` | FULL | NOT_SUPPORTED | FULL | Entire service stubbed on MiniStack; adapter returns `404 Not Found` with tooltip |
| RDS | `@aws-sdk/client-rds` | FULL | FULL | FULL | Common service — full adapter |
| Redshift | `@aws-sdk/client-redshift` | FULL | PARTIAL | FULL | `CreateEndpointAccess` partial on MiniStack |
| CloudTrail | `@aws-sdk/client-cloudtrail` | FULL | PARTIAL | FULL | `LookupEvents` partial on MiniStack |
| Config | `@aws-sdk/client-configservice` | FULL | PARTIAL | FULL | `PutConfigurationAggregator` partial on MiniStack |
| CloudFront | `@aws-sdk/client-cloudfront` | FULL | PARTIAL | FULL | `CreateKeyValueStore` unsupported on MiniStack |
| Route 53 | `@aws-sdk/client-route-53` | FULL | PARTIAL | FULL | `CreateHealthCheck` partial on MiniStack |
| KMS | `@aws-sdk/client-kms` | FULL | PARTIAL | FULL | `CreateGrant` partial on MiniStack |
| Secrets Manager | `@aws-sdk/client-secrets-manager` | FULL | PARTIAL | FULL | `RotateSecret` partial on MiniStack |
| WAF / WAFv2 | `@aws-sdk/client-waf` / `wafv2` | FULL | PARTIAL | FULL | Managed rule groups partial on MiniStack |
| AppSync | `@aws-sdk/client-appsync` | FULL | NOT_SUPPORTED | FULL | Entire service unsupported on MiniStack |
| API Gateway | `@aws-sdk/client-api-gateway` | FULL | PARTIAL | FULL | `CreateDeployment` partial on MiniStack |
| EventBridge | `@aws-sdk/client-eventbridge` | FULL | FULL | FULL | Common — full adapter |
| SNS / SQS | `@aws-sdk/client-sns` / `sqs` | FULL | FULL | FULL | Common — full adapter |
| Step Functions | `@aws-sdk/client-sfn` | FULL | NOT_SUPPORTED | FULL | Entire service unsupported on MiniStack |
| CloudFormation | `@aws-sdk/client-cloudformation` | FULL | FULL | FULL | Common — full adapter |
| CloudWatch | `@aws-sdk/client-cloudwatch` | FULL | FULL | FULL | Common — full adapter |
| CloudWatch Logs | `@aws-sdk/client-cloudwatch-logs` | FULL | FULL | FULL | Common — full adapter |

---

## 3. Adapter Command Implementation Details

### 3.1 Implemented Commands (Full Adapter Path)

For every command listed as FULL above, the adapter performs:

1. `mapRequest()` reads `originalRequest` (protocol/hostname/port/path/body/method/headers).
2. `resolveEndpoint(adapterMode)` selects `localstack` (`localhost:4566`), `ministack` (`localhost:4566` with per-service port mapping if configured), or `real` (`https://amazonaws.com`).
3. `injectAuth(adapterMode)` provides credentials.
4. `mapRequest()` rewrites `protocol`, `hostname`, `port`, `path`, `url`, and injects adapter headers (`x-adapter-mode`, `x-adapter-service`).
5. SDK sends the rewritten HTTP request to the backend endpoint.
6. Backend responds.
7. `normalizeResponse()` converts `status` → `statusCode`, `data` → `body`, preserves headers, defaults missing status to 200.
8. SDK receives normalized `HttpResponse` and parses it into service-specific output.

### 3.2 Stubbed Commands (Partial / Unsupported)

When a backend doesn't support a specific command:

- Adapter still rewrites the request via `mapRequest()`.
- The backend returns an error (e.g., `NotImplemented`, `404`, `500`).
- `normalizeResponse()` preserves the error status code and body.
- The frontend must handle this per PRD §D.3 (UI Treatment for Unsupported / Partial Features):
  - **Fully supported** → behaves as specified.
  - **Partially supported** → affected field shows an info badge (`ⓘ Limited support on <target>`).
  - **Unsupported** → control is disabled with tooltip (`Not available on <target>`).
  - **Errored at runtime** → surfaced via `Flashbar` / `Alert` with raw error details.

No command is allowed to silently succeed with fake data. Per PRD Goal G10 (`Zero silent failures`), any stubbed or unsupported command must surface its gap explicitly.

---

## 4. Service Catalog vs Adapter Registry

`src/constants/service-compatibility.ts` (SERVICE_REGISTRY) contains 150 verified service entries. Each entry has:

- `routeDir` (e.g., `ec2`, `lambda`, `s3`, `vpc`)
- `serviceName` (e.g., `Amazon EC2`)
- `adapterStatusLocalStack` (`FULL` / `PARTIAL` / `NOT_SUPPORTED`)
- `adapterStatusMinStack` (same enum)
- `sdkClient` (package name, e.g., `@aws-sdk/client-ec2`)
- `hasRouteInRepo` (`true` for all 150 in current repo)

Every entry in `SERVICE_REGISTRY` must have a corresponding row in this `BACKEND_PARITY.md`. If a service is added or removed, both files must be updated together.

---

## 5. Real AWS Safety Guardrails (Adapter Layer Enforcement)

Per PRD Appendix D §D.5 and §4.2 (Safety Rules):

| Guardrail | Adapter Enforcement | Implementation File |
|---|---|---|
| Persistent target indicator | Adapter mode visible in UI header (badge with `localstack` / `ministack` / `real`) | `src/lib/localstack-adapter/` + frontend header component |
| Structural block on destructive actions when `ACTIVE_BACKEND=aws` | Adapter `mapRequest()` must not rewrite destructive endpoint URLs unless `ALLOW_REAL_AWS_TARGET=true`; server-side middleware must reject reset/seed actions against `real` target | `src/lib/localstack-adapter/index.ts` + backend guard middleware |
| Typed confirmation for destructive resource actions on real AWS | Adapter does not enforce typed confirmation (this is a frontend/confirmation-modal requirement); adapter ensures the endpoint reaches real AWS, not a stubbed endpoint | Frontend wizard + adapter endpoint resolution |
| Rate limiting / backoff for real AWS | Adapter must pass `maxAttempts` (default 3) to SDK clients; SDK handles backoff; adapter does not suppress real throttling errors | `src/lib/sdk-adapter-middleware.ts` |
| No invented cost estimates presented as real | Adapter returns real pricing data only when `ACTIVE_BACKEND=aws` and `AWS_PRICING_API` is configured; otherwise adapter returns `null` or mock estimate, never fake authoritative charge | `src/lib/localstack-adapter/` + cost-estimation service |

---

## 6. Verification Checklist (Per PRD Appendix G Phase 5 & H.2)

Every service must pass the following adapter-level verification before being marked `PASS` in the audit:

- [ ] Adapter factory (`createAdapter`) creates a valid adapter instance for `localstack`, `ministack`, and `real`.
- [ ] Endpoint resolver (`resolveEndpoint`) returns the correct endpoint for the active mode.
- [ ] Auth injector (`injectAuth`) provides correct dummy (`test`/`test`) for emulators and reads real env vars for `real`.
- [ ] Request mapper (`mapRequest`) rewrites all SDK HTTP requests correctly (endpoint, headers, authorization format).
- [ ] Response normalizer (`normalizeResponse`) handles `200`, `404`, `500`, missing status (defaults to 200), JSON data, binary data (`Buffer` / `Uint8Array`), and custom headers.
- [ ] Adapter integration flow (factory → endpoint → auth → map → normalize) produces a valid response matching SDK `HttpResponse` shape.
- [ ] No silent failures: every unsupported/stubbed command surfaces an explicit error or disabled UI state per PRD §D.3.
- [ ] Real AWS target (`ALLOW_REAL_AWS_TARGET=true`) does not allow reset/seed actions against the real endpoint.
- [ ] VRT baseline exists for key pages (`ec2-table-baseline.png`, `s3-bucket-baseline.png`, `lambda-wizard-baseline.png`, `iam-user-baseline.png`).
- [ ] Adapter layer unit tests (`src/lib/localstack-adapter/index.test.ts`) achieve >85% coverage.

---

## 7. References

- PRD: `docs/prd-aws-management-console-v1.3.md` (Appendix D, F, G, H)
- Adapter Source: `src/lib/localstack-adapter/`
- Adapter Config: `src/config/adapter-config.ts`
- Adapter Constants: `src/constants/adapter-constants.ts`
- Service Registry: `src/constants/service-compatibility.ts`
- Types: `src/types/adapter.ts`
- E2E Tests: `tests/e2e/`
- VRT Baselines: `tests/vrt/baselines/`
- Adapter Tests: `src/lib/localstack-adapter/index.test.ts`
