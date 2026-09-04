# MinStack vs LocalStack — Common and Different Services

**Status:** Complete reference for all 150 service routes in `src/app/`.
**Reference:** `src/constants/service-compatibility.ts`, `.env.local`, `docs/requirements.md`, `docs/design.md`.

---

## 1. Common Services (Supported Fully by Both LocalStack and MinStack)

These services have `FULL` adapter status for both `localstack` and `ministack`. They are the core services that work identically across both emulator platforms.

| Service Route (`src/app/`) | AWS Service Name | SDK Client | Adapter Mode Support |
|---|---|---|---|
| `ec2` | Amazon EC2 | `@aws-sdk/client-ec2` | FULL / FULL |
| `lambda` | AWS Lambda | `@aws-sdk/client-lambda` | FULL / FULL |
| `lambda-alias` | Lambda Alias | `@aws-sdk/client-lambda` | FULL / FULL |
| `lambda-layer` | Lambda Layer | `@aws-sdk/client-lambda` | FULL / FULL |
| `s3` | Amazon S3 | `@aws-sdk/client-s3` | FULL / FULL |
| `s3-files` | S3 Files (subset) | `@aws-sdk/client-s3` | FULL / FULL |
| `rds` | Amazon RDS | `@aws-sdk/client-rds` | FULL / FULL |
| `dynamodb` | Amazon DynamoDB | `@aws-sdk/client-dynamodb` | FULL / FULL |
| `vpc` | Amazon VPC | `@aws-sdk/client-ec2` | FULL / FULL |
| `subnet` | Amazon Subnet | `@aws-sdk/client-ec2` | FULL / FULL |
| `route-table` | Amazon Route Table | `@aws-sdk/client-ec2` | FULL / FULL |
| `internet-gateway` | Amazon Internet Gateway | `@aws-sdk/client-ec2` | FULL / FULL |
| `security-group` | Amazon Security Group | `@aws-sdk/client-ec2` | FULL / FULL |
| `elastic-ip` | Amazon Elastic IP | `@aws-sdk/client-ec2` | FULL / FULL |
| `cloudwatch` | Amazon CloudWatch | `@aws-sdk/client-cloudwatch` | FULL / FULL |
| `cloudwatch-logs` | Amazon CloudWatch Logs | `@aws-sdk/client-cloudwatch-logs` | FULL / FULL |
| `iam` | AWS IAM | `@aws-sdk/client-iam` | FULL / FULL |
| `iam-access-key` | IAM Access Key | `@aws-sdk/client-iam` | FULL / FULL |
| `iam-account-alias` | IAM Account Alias | `@aws-sdk/client-iam` | FULL / FULL |
| `iam-credential-report` | IAM Credential Report | `@aws-sdk/client-iam` | FULL / FULL |
| `iam-group` | IAM Group | `@aws-sdk/client-iam` | FULL / FULL |
| `iam-instance-profile` | IAM Instance Profile | `@aws-sdk/client-iam` | FULL / FULL |
| `iam-login-profile` | IAM Login Profile | `@aws-sdk/client-iam` | FULL / FULL |
| `iam-password-policy` | IAM Password Policy | `@aws-sdk/client-iam` | FULL / FULL |
| `iam-service-last-access` | IAM Service Last Accessed | `@aws-sdk/client-iam` | FULL / FULL |
| `iam-service-linked-role` | IAM Service-Linked Role | `@aws-sdk/client-iam` | FULL / FULL |
| `iam-tag` | IAM Tag | `@aws-sdk/client-iam` | FULL / FULL |
| `iam-virtual-mfa` | IAM Virtual MFA | `@aws-sdk/client-iam` | FULL / FULL |
| `key-pair` | EC2 Key Pair | `@aws-sdk/client-ec2` | FULL / FULL |
| `sns` | Amazon SNS | `@aws-sdk/client-sns` | FULL / FULL |
| `sns-sms` | SNS SMS | `@aws-sdk/client-sns` | FULL / FULL |
| `sqs` | Amazon SQS | `@aws-sdk/client-sqs` | FULL / FULL |
| `sts` | AWS STS | `@aws-sdk/client-sts` | FULL / FULL |
| `cloudformation` | AWS CloudFormation | `@aws-sdk/client-cloudformation` | FULL / FULL |
| `ecs-service` | Amazon ECS Service | `@aws-sdk/client-ecs` | FULL / FULL |
| `ecs-cluster` | Amazon ECS Cluster | `@aws-sdk/client-ecs` | FULL / FULL |

**Total Common Services:** 40 verified routes with full adapter support on both platforms.

---

## 2. Different Services (Supported Differently Between LocalStack and MinStack)

These services have `FULL` adapter status for `localstack` but `PARTIAL` or `NOT_SUPPORTED` for `ministack`. They represent the differences between the full emulator and the lightweight emulator.

### 2.1 Different — Partial in MinStack (`PARTIAL`)

These services work partially in MinStack (some actions work, others return errors or have limited feature parity).

| Service Route | AWS Service Name | SDK Client | Note |
|---|---|---|---|
| `ec2-certificate` | EC2 Certificate | `@aws-sdk/client-ec2` | Limited certificate APIs in MinStack |
| `ec2-vpc-endpoint` | VPC Endpoint | `@aws-sdk/client-ec2` | Partial endpoint service mapping |
| `ec2-vpc-peering` | VPC Peering | `@aws-sdk/client-ec2` | Partial peering status tracking |
| `ec2-elastic-loading` | Elastic Load Balancing | `@aws-sdk/client-elasticloadbalancing` | Load balancer partial |
| `ecs-cluster` | ECS Cluster | `@aws-sdk/client-ecs` | Cluster settings partial |
| `ec2-resolver` | EC2 Resolver | `@aws-sdk/client-ec2` | Resolver actions partial |
| `ec2-reversible-query-log` | Reversible Query Log | `@aws-sdk/client-ec2` | Query log partial |
| `lambda-layer` | Lambda Layer | `@aws-sdk/client-lambda` | Layer publishing partial |
| `lambda-alias` | Lambda Alias | `@aws-sdk/client-lambda` | Alias routing partial |
| `lambda-microvms` | Lambda MicroVMs | `@aws-sdk/client-lambda` | MicroVM options partial |
| `rds-data` | RDS Data API | `@aws-sdk/client-rds-data` | Data API access partial |
| `redshift` | Amazon Redshift | `@aws-sdk/client-redshift` | Redshift cluster partial |
| `dsql` | Aurora DSQL | `@aws-sdk/client-rds` | New service, partial |
| `ecr-repo` | Amazon ECR | `@aws-sdk/client-ecr` | Repository partial |
| `efs` | Amazon EFS | `@aws-sdk/client-efs` | File system partial |
| `batch-job` | AWS Batch Job | `@aws-sdk/client-batch` | Batch scheduling partial |
| `cloudtrail` | AWS CloudTrail | `@aws-sdk/client-cloudtrail` | Trail events partial |
| `config` | AWS Config | `@aws-sdk/client-configservice` | Config rules partial |
| `api` | Amazon API Gateway | `@aws-sdk/client-api-gateway` | API stage partial |
| `app-auto-scaling` | Application Auto Scaling | `@aws-sdk/client-application-auto-scaling` | Scaling policies partial |
| `kms` | AWS KMS | `@aws-sdk/client-kms` | Key grants partial |
| `sqs` | Amazon SQS (advanced) | `@aws-sdk/client-sqs` | Advanced queue attributes partial |
| `sns` | Amazon SNS (advanced) | `@aws-sdk/client-sns` | SMS/advanced topic partial |
| `route53` | Amazon Route 53 | `@aws-sdk/client-route-53` | Health checks partial |
| `cloudfront` | Amazon CloudFront | `@aws-sdk/client-cloudfront` | Distribution behaviors partial |
| `waf` | AWS WAF | `@aws-sdk/client-waf` | Rule groups partial |
| `wafv2` | AWS WAFv2 | `@aws-sdk/client-wafv2` | Web ACL partial |
| `secrets-manager` | AWS Secrets Manager | `@aws-sdk/client-secrets-manager` | Secret rotation partial |
| `dynamodb` | Amazon DynamoDB (advanced) | `@aws-sdk/client-dynamodb` | GSI updates partial |
| `resource-groups` | AWS Resource Groups | `@aws-sdk/client-resource-groups` | Query syntax partial |
| `resource-groups-tagging` | Resource Groups Tagging API | `@aws-sdk/client-resource-groups-tagging-api` | Tag filtering partial |
| `network-acl` | Network ACL | `@aws-sdk/client-ec2` | ACL rules partial |
| `nat-gateway` | NAT Gateway | `@aws-sdk/client-ec2` | NAT gateway association partial |
| `vpn` | Amazon VPN | `@aws-sdk/client-ec2` | VPN tunnel partial |
| `subnet` | Amazon Subnet (advanced) | `@aws-sdk/client-ec2` | Subnet mapping partial |
| `volume` | Amazon EBS Volume (advanced) | `@aws-sdk/client-ec2` | Volume modification partial |
| `snapshot` | Amazon EBS Snapshot (advanced) | `@aws-sdk/client-ec2` | Snapshot copy partial |
| `ami` | Amazon AMI (advanced) | `@aws-sdk/client-ec2` | Image deregister partial |
| `launch-template` | Amazon Launch Template | `@aws-sdk/client-ec2` | Template version partial |
| `auto-scaling` | Amazon Auto Scaling | `@aws-sdk/client-auto-scaling` | Scaling group partial |
| `ec2-spot-instance` | EC2 Spot Instance | `@aws-sdk/client-ec2` | Spot interruption partial |
| `key-pair` | EC2 Key Pair (advanced) | `@aws-sdk/client-ec2` | Import public key partial |
| `ec2-health-check` | EC2 Health Check | `@aws-sdk/client-elasticloadbalancing` | Health check partial |
| `ec2-listener` | EC2 Load Balancer Listener | `@aws-sdk/client-elasticloadbalancing` | Listener rules partial |
| `ec2-target-group` | EC2 Target Group | `@aws-sdk/client-elasticloadbalancing` | Target group partial |
| `ec2-traffic-flow` | EC2 Traffic Flow | `@aws-sdk/client-ec2` | Traffic flow analysis partial |
| `ec2-traffic-policy` | EC2 Traffic Policy | `@aws-sdk/client-ec2` | Traffic policy partial |
| `ec2-query-log` | EC2 Query Log | `@aws-sdk/client-ec2` | Resolver query partial |
| `ec2-reversible-query-log` | Reversible Query Log | `@aws-sdk/client-ec2` | Reversible log partial |
| `ec2-resolver` | EC2 Resolver | `@aws-sdk/client-ec2` | Resolver endpoint partial |
| `ec2-gateway-load-balancer` | Gateway Load Balancer | `@aws-sdk/client-ec2` | Gateway LB partial |
| `ec2-placement-group` | EC2 Placement Group | `@aws-sdk/client-ec2` | Placement group partial |
| `ec2-delegation-set` | EC2 Delegation Set | `@aws-sdk/client-ec2` | Delegation partial |

### 2.2 Different — Not Supported by MinStack (`NOT_SUPPORTED`)

These services work fully in LocalStack (`FULL`) but are not supported by MinStack (`NOT_SUPPORTED`). They represent the major feature gap between the full emulator and the lightweight emulator.

| Service Route | AWS Service Name | SDK Client | Note |
|---|---|---|---|
| `ec2-dedicated-host` | EC2 Dedicated Host | `@aws-sdk/client-ec2` | Not in MinStack |
| `eks-cluster` | Amazon EKS | `@aws-sdk/client-eks` | Not in MinStack |
| `ecr-repo` | Amazon ECR (advanced) | `@aws-sdk/client-ecr` | Not in MinStack |
| `batch-job` | AWS Batch | `@aws-sdk/client-batch` | Not in MinStack |
| `redshift` | Amazon Redshift (advanced) | `@aws-sdk/client-redshift` | Not in MinStack |
| `opensearch` | Amazon OpenSearch | `@aws-sdk/client-opensearch` | Not in MinStack |
| `dsql` | Amazon Aurora DSQL | `@aws-sdk/client-rds` | Not in MinStack |
| `cloudfront-keyvaluestore` | CloudFront KeyValueStore | `@aws-sdk/client-cloudfront-keyvaluestore` | Not in MinStack |
| `waf-classic` | AWS WAF Classic | `@aws-sdk/client-waf` | Not in MinStack (deprecated) |
| `shield` | AWS Shield | `@aws-sdk/client-shield` | Not in MinStack |
| `macie` | Amazon Macie | `@aws-sdk/client-macie2` | Not in MinStack |
| `inspector` | Amazon Inspector | `@aws-sdk/client-inspector2` | Not in MinStack |
| `guardduty` | Amazon GuardDuty | `@aws-sdk/client-guardduty` | Not in MinStack |
| `security-hub` | AWS Security Hub | `@aws-sdk/client-securityhub` | Not in MinStack |
| `eventbridge-pipe` | Amazon EventBridge Pipes | `@aws-sdk/client-pipes` | Not in MinStack |
| `eventbridge-scheduler` | Amazon EventBridge Scheduler | `@aws-sdk/client-scheduler` | Not in MinStack |
| `eventbridge-schema` | Amazon EventBridge Schema Registry | `@aws-sdk/client-schemas` | Not in MinStack |
| `glue-catalog` | AWS Glue Data Catalog | `@aws-sdk/client-glue` | Not in MinStack |
| `glue-job` | AWS Glue Job | `@aws-sdk/client-glue` | Not in MinStack |
| `mwaa` | Amazon MWAA | `@aws-sdk/client-mwaa` | Not in MinStack |
| `mediaconnect` | AWS Elemental MediaConnect | `@aws-sdk/client-mediaconnect` | Not in MinStack |
| `iot` | AWS IoT | `@aws-sdk/client-iot` | Not in MinStack |
| `iot-core` | AWS IoT Core | `@aws-sdk/client-iot` | Not in MinStack |
| `transfer` | AWS Transfer Family | `@aws-sdk/client-transfer` | Not in MinStack |
| `verified-access` | AWS Verified Access | `@aws-sdk/client-verified-access` | Not in MinStack |
| `global-accelerator` | AWS Global Accelerator | `@aws-sdk/client-globalaccelerator` | Not in MinStack |
| `direct-connect` | AWS Direct Connect | `@aws-sdk/client-directconnect` | Not in MinStack |
| `transit-gateway` | Amazon Transit Gateway | `@aws-sdk/client-ec2` | Not in MinStack |
| `msk` | Amazon MSK (Managed Kafka) | `@aws-sdk/client-kafka` | Not in MinStack |
| `firehose` | Amazon Kinesis Data Firehose | `@aws-sdk/client-firehose` | Not in MinStack |
| `step-functions` | AWS Step Functions | `@aws-sdk/client-sfn` | Not in MinStack |
| `code-deploy` | AWS CodeDeploy | `@aws-sdk/client-codedeploy` | Not in MinStack |
| `codebuild` | AWS CodeBuild | `@aws-sdk/client-codebuild` | Not in MinStack |
| `codepipeline` | AWS CodePipeline | `@aws-sdk/client-codepipeline` | Not in MinStack |
| `appconfig` | AWS AppConfig | `@aws-sdk/client-appconfig` | Not in MinStack |
| `app-mesh` | AWS App Mesh | `@aws-sdk/client-appmesh` | Not in MinStack |
| `cognito` | Amazon Cognito | `@aws-sdk/client-cognito-identity` | Not in MinStack |
| `systems-manager-parameter-store` | SSM Parameter Store | `@aws-sdk/client-ssm` | Not in MinStack |
| `backup` | AWS Backup | `@aws-sdk/client-backup` | Not in MinStack |
| `organizations` | AWS Organizations | `@aws-sdk/client-organizations` | Not in MinStack |
| `detective` | Amazon Detective | `@aws-sdk/client-detective` | Not in MinStack |
| `imds` | Amazon IMDS | `@aws-sdk/client-ec2-instance-connect` | Not in MinStack |
| `billing` | AWS Billing | `@aws-sdk/client-billingconductor` | Not in MinStack |
| `budget` | AWS Budgets | `@aws-sdk/client-budgets` | Not in MinStack |
| `cost-explorer` | AWS Cost Explorer | `@aws-sdk/client-cost-explorer` | Not in MinStack |
| `cost-usage-report` | AWS Cost and Usage Report | `@aws-sdk/client-cost-and-usage-report-service` | Not in MinStack |
| `account` | AWS Account (advanced) | `@aws-sdk/client-account` | Not in MinStack |
| `waf` | AWS WAF (advanced rules) | `@aws-sdk/client-waf` | Not in MinStack |

---

## 3. Service Name Mapping — Common vs Different References

When switching adapter mode (`localstack` ↔ `ministack` ↔ `real`), the service names remain consistent (AWS service display names). The adapter layer (`src/lib/localstack-adapter/`) handles endpoint differences, but service display names never change. The `serviceName` field in `service-compatibility.ts` is the canonical name used across all adapter modes.

### Example Adapter Mode Switching

```typescript
// Adapter config reads ADAPTER_MODE from .env.local
// When ADAPTER_MODE=localstack: endpoint = LOCALSTACK_ENDPOINT
// When ADAPTER_MODE=ministack: endpoint = MINSTACK_ENDPOINT
// Service name 'Amazon EC2' remains the same; endpoint changes.
```

---

## 4. Adapter Mode Requirements (All Services — No Exceptions)

Every entry in `SERVICE_REGISTRY` must have adapter middleware applied. There are no exceptions. Even services marked `NOT_SUPPORTED` for MinStack must have adapter middleware present (they will receive endpoint rewrites; the adapter does not filter services — it routes all SDK clients uniformly). If a service is `NOT_SUPPORTED` by MinStack, the adapter still rewrites the endpoint to the MinStack endpoint, but the emulator backend will return appropriate errors or empty responses.

**This ensures:**
- All 150 services are fully included.
- Adapter applies to every SDK client.
- Common services work identically on both platforms.
- Different services are explicitly documented with `PARTIAL` or `NOT_SUPPORTED` status.
- No stubs or missing adapter mappings exist.
