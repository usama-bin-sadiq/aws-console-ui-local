/**
 * Service Registry & Adapter Compatibility — All 150 Services
 * Every service route in src/app/ must have adapter support.
 * Common services: supported by both LocalStack and MinStack.
 * Different services: supported by LocalStack (full) but not MinStack (limited/subset)
 * Unsupported services remain explicitly marked until a verified API and UI workflow exists.
 */

export enum AdapterMode {
  LOCALSTACK = "localstack",
  MINSTACK = "ministack",
  LOCALEMU = "localemu",
}

export enum AdapterStatus {
  FULL = "full",
  PARTIAL = "partial",
  NOT_SUPPORTED = "not-supported",
}

export interface ServiceCompatibilityEntry {
  routeDir: string; // name in src/app/
  serviceName: string; // AWS service display name
  adapterStatusLocalStack: AdapterStatus; // full for all 150 in clone
  adapterStatusMinStack: AdapterStatus; // full / partial / not-supported
  commonDifferentNote: string; // common vs different between localstack/ministack
  sdkClient: string; // e.g., '@aws-sdk/client-ec2'
  hasRouteInRepo: boolean; // verified in src/app/
}

export interface ServiceAvailability {
  readonly status: AdapterStatus | "unavailable";
  readonly enabled: boolean;
  readonly reason: string;
}

export type EmulatorHealthStatus = "healthy" | "degraded" | "unreachable" | "checking" | "starting";

export const SERVICE_REGISTRY: ServiceCompatibilityEntry[] = [
  // === COMPUTE ===
  {
    routeDir: "ec2",
    serviceName: "Amazon EC2",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.PARTIAL,
    commonDifferentNote:
      "MiniStack documents EC2 control-plane support; networking and infrastructure are metadata-oriented unless opt-in container backing is enabled",
    sdkClient: "@aws-sdk/client-ec2",
    hasRouteInRepo: true,
  },
  {
    routeDir: "ec2-certificate",
    serviceName: "EC2 Certificate",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.PARTIAL,
    commonDifferentNote: "Different — MinStack has limited certificate support",
    sdkClient: "@aws-sdk/client-ec2",
    hasRouteInRepo: true,
  },
  {
    routeDir: "ec2-dedicated-host",
    serviceName: "EC2 Dedicated Host",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.NOT_SUPPORTED,
    commonDifferentNote: "Different — MinStack does not support dedicated hosts",
    sdkClient: "@aws-sdk/client-ec2",
    hasRouteInRepo: true,
  },
  {
    routeDir: "lambda",
    serviceName: "AWS Lambda",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.FULL,
    commonDifferentNote: "Common — both support Lambda functions",
    sdkClient: "@aws-sdk/client-lambda",
    hasRouteInRepo: true,
  },
  // Lambda Aliases and Lambda Layers are sub-routes of /lambda rather than
  // standalone services, so they are not top-level routes. Capability lookups
  // for /lambda/aliases and /lambda/layers resolve to the `lambda` entry, the
  // same way /iam/policies resolves to `iam`.
  {
    routeDir: "lambda-alias",
    serviceName: "Lambda Alias",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.FULL,
    commonDifferentNote: "Common",
    sdkClient: "@aws-sdk/client-lambda",
    hasRouteInRepo: false,
  },
  {
    routeDir: "lambda-layers",
    serviceName: "Lambda Layer",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.FULL,
    commonDifferentNote: "Common",
    sdkClient: "@aws-sdk/client-lambda",
    hasRouteInRepo: false,
  },
  {
    routeDir: "ecs-cluster",
    serviceName: "Amazon ECS Cluster",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.PARTIAL,
    commonDifferentNote: "Different — MinStack partial ECS support",
    sdkClient: "@aws-sdk/client-ecs",
    hasRouteInRepo: true,
  },
  {
    routeDir: "ecs-service",
    serviceName: "Amazon ECS Service",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.PARTIAL,
    commonDifferentNote: "Different",
    sdkClient: "@aws-sdk/client-ecs",
    hasRouteInRepo: true,
  },
  {
    routeDir: "ecr-repo",
    serviceName: "Amazon ECR",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.PARTIAL,
    commonDifferentNote: "Different",
    sdkClient: "@aws-sdk/client-ecr",
    hasRouteInRepo: true,
  },
  {
    routeDir: "eks-cluster",
    serviceName: "Amazon EKS Cluster",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.PARTIAL,
    commonDifferentNote:
      "MiniStack documents EKS through k3s sidecars; it is not byte-identical to EKS",
    sdkClient: "@aws-sdk/client-eks",
    hasRouteInRepo: true,
  },
  {
    routeDir: "fargate",
    serviceName: "AWS Fargate",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.PARTIAL,
    commonDifferentNote: "Different",
    sdkClient: "@aws-sdk/client-ecs",
    hasRouteInRepo: true,
  },
  {
    routeDir: "batch-job",
    serviceName: "AWS Batch",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.PARTIAL,
    commonDifferentNote:
      "MiniStack documents Batch control-plane support; job execution behavior is provider-specific",
    sdkClient: "@aws-sdk/client-batch",
    hasRouteInRepo: true,
  },

  // === STORAGE ===
  {
    routeDir: "s3",
    serviceName: "Amazon S3",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.FULL,
    commonDifferentNote: "Common — core storage in both",
    sdkClient: "@aws-sdk/client-s3",
    hasRouteInRepo: true,
  },
  {
    routeDir: "s3-files",
    serviceName: "Amazon S3 Files",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.PARTIAL,
    commonDifferentNote: "Different",
    sdkClient: "@aws-sdk/client-s3",
    hasRouteInRepo: true,
  },
  {
    routeDir: "s3-tables",
    serviceName: "Amazon S3 Tables",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.NOT_SUPPORTED,
    commonDifferentNote: "Different — new feature, MinStack not supported",
    sdkClient: "@aws-sdk/client-s3",
    hasRouteInRepo: true,
  },
  {
    routeDir: "efs",
    serviceName: "Amazon EFS",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.PARTIAL,
    commonDifferentNote: "Different",
    sdkClient: "@aws-sdk/client-efs",
    hasRouteInRepo: true,
  },
  {
    routeDir: "volume",
    serviceName: "Amazon EBS Volume",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.PARTIAL,
    commonDifferentNote: "Different — partial support in MinStack",
    sdkClient: "@aws-sdk/client-ec2",
    hasRouteInRepo: true,
  },
  {
    routeDir: "snapshot",
    serviceName: "Amazon EBS Snapshot",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.PARTIAL,
    commonDifferentNote: "Different",
    sdkClient: "@aws-sdk/client-ec2",
    hasRouteInRepo: true,
  },

  // === DATABASE ===
  {
    routeDir: "rds",
    serviceName: "Amazon RDS",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.FULL,
    commonDifferentNote: "Common — full RDS in both",
    sdkClient: "@aws-sdk/client-rds",
    hasRouteInRepo: true,
  },
  {
    routeDir: "rds-data",
    serviceName: "Amazon RDS Data API",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.PARTIAL,
    commonDifferentNote: "Different",
    sdkClient: "@aws-sdk/client-rds-data",
    hasRouteInRepo: true,
  },
  {
    routeDir: "dynamodb",
    serviceName: "Amazon DynamoDB",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.FULL,
    commonDifferentNote: "Common — DynamoDB core in both",
    sdkClient: "@aws-sdk/client-dynamodb",
    hasRouteInRepo: true,
  },
  {
    routeDir: "redshift",
    serviceName: "Amazon Redshift",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.PARTIAL,
    commonDifferentNote: "Different",
    sdkClient: "@aws-sdk/client-redshift",
    hasRouteInRepo: true,
  },
  {
    routeDir: "dsql",
    serviceName: "Amazon Aurora DSQL",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.PARTIAL,
    commonDifferentNote:
      "MiniStack documents DSQL control plane with optional strict Postgres backing",
    sdkClient: "@aws-sdk/client-rds",
    hasRouteInRepo: true,
  },
  {
    routeDir: "opensearch",
    serviceName: "Amazon OpenSearch",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.PARTIAL,
    commonDifferentNote:
      "MiniStack documents OpenSearch management plane; real data plane requires OPENSEARCH_DATAPLANE=1 or an external cluster",
    sdkClient: "@aws-sdk/client-opensearch",
    hasRouteInRepo: true,
  },

  // === NETWORKING ===
  {
    routeDir: "vpc",
    serviceName: "Amazon VPC",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.FULL,
    commonDifferentNote: "Common",
    sdkClient: "@aws-sdk/client-ec2",
    hasRouteInRepo: true,
  },
  {
    routeDir: "subnet",
    serviceName: "Amazon Subnet",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.FULL,
    commonDifferentNote: "Common",
    sdkClient: "@aws-sdk/client-ec2",
    hasRouteInRepo: true,
  },
  {
    routeDir: "route-table",
    serviceName: "Amazon Route Table",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.FULL,
    commonDifferentNote: "Common",
    sdkClient: "@aws-sdk/client-ec2",
    hasRouteInRepo: true,
  },
  {
    routeDir: "internet-gateway",
    serviceName: "Amazon Internet Gateway",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.FULL,
    commonDifferentNote: "Common",
    sdkClient: "@aws-sdk/client-ec2",
    hasRouteInRepo: true,
  },
  {
    routeDir: "nat-gateway",
    serviceName: "Amazon NAT Gateway",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.PARTIAL,
    commonDifferentNote: "Different — NAT gateway partial in MinStack",
    sdkClient: "@aws-sdk/client-ec2",
    hasRouteInRepo: true,
  },
  {
    routeDir: "network-acl",
    serviceName: "Amazon Network ACL",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.PARTIAL,
    commonDifferentNote: "Different",
    sdkClient: "@aws-sdk/client-ec2",
    hasRouteInRepo: true,
  },
  {
    routeDir: "security-group",
    serviceName: "Amazon Security Group",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.FULL,
    commonDifferentNote: "Common",
    sdkClient: "@aws-sdk/client-ec2",
    hasRouteInRepo: true,
  },
  {
    routeDir: "vpn",
    serviceName: "Amazon VPN",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.PARTIAL,
    commonDifferentNote: "Different",
    sdkClient: "@aws-sdk/client-ec2",
    hasRouteInRepo: true,
  },
  {
    routeDir: "ec2-vpc-endpoint",
    serviceName: "Amazon VPC Endpoint",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.PARTIAL,
    commonDifferentNote: "Different",
    sdkClient: "@aws-sdk/client-ec2",
    hasRouteInRepo: true,
  },
  {
    routeDir: "ec2-vpc-peering",
    serviceName: "Amazon VPC Peering",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.PARTIAL,
    commonDifferentNote: "Different",
    sdkClient: "@aws-sdk/client-ec2",
    hasRouteInRepo: true,
  },
  {
    routeDir: "ec2-elastic-loading",
    serviceName: "Amazon Elastic Load Balancing",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.PARTIAL,
    commonDifferentNote: "Different",
    sdkClient: "@aws-sdk/client-elastic-load-balancing-v2",
    hasRouteInRepo: true,
  },
  {
    routeDir: "elb",
    serviceName: "Amazon ELB (Classic)",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.PARTIAL,
    commonDifferentNote: "Different",
    sdkClient: "@aws-sdk/client-elastic-load-balancing-v2",
    hasRouteInRepo: true,
  },
  {
    routeDir: "elastic-ip",
    serviceName: "Amazon Elastic IP",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.FULL,
    commonDifferentNote: "Common",
    sdkClient: "@aws-sdk/client-ec2",
    hasRouteInRepo: true,
  },
  {
    routeDir: "global-accelerator",
    serviceName: "AWS Global Accelerator",
    adapterStatusLocalStack: AdapterStatus.NOT_SUPPORTED,
    adapterStatusMinStack: AdapterStatus.NOT_SUPPORTED,
    commonDifferentNote: "Unsupported until an emulator API integration is implemented",
    sdkClient: "",
    hasRouteInRepo: true,
  },
  {
    routeDir: "direct-connect",
    serviceName: "AWS Direct Connect",
    adapterStatusLocalStack: AdapterStatus.NOT_SUPPORTED,
    adapterStatusMinStack: AdapterStatus.NOT_SUPPORTED,
    commonDifferentNote: "Unsupported until an emulator API integration is implemented",
    sdkClient: "",
    hasRouteInRepo: true,
  },
  {
    routeDir: "transit-gateway",
    serviceName: "Amazon Transit Gateway",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.NOT_SUPPORTED,
    commonDifferentNote: "Different",
    sdkClient: "@aws-sdk/client-ec2",
    hasRouteInRepo: true,
  },

  // === MONITORING ===
  {
    routeDir: "cloudwatch",
    serviceName: "Amazon CloudWatch",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.FULL,
    commonDifferentNote: "Common — monitoring in both",
    sdkClient: "@aws-sdk/client-cloudwatch",
    hasRouteInRepo: true,
  },
  {
    routeDir: "cloudwatch-logs",
    serviceName: "Amazon CloudWatch Logs",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.FULL,
    commonDifferentNote: "Common",
    sdkClient: "@aws-sdk/client-cloudwatch-logs",
    hasRouteInRepo: true,
  },
  {
    routeDir: "cloudtrail",
    serviceName: "AWS CloudTrail",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.PARTIAL,
    commonDifferentNote: "Different — partial in MinStack",
    sdkClient: "@aws-sdk/client-cloudtrail",
    hasRouteInRepo: true,
  },
  {
    routeDir: "config",
    serviceName: "AWS Config",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.PARTIAL,
    commonDifferentNote: "Different",
    sdkClient: "@aws-sdk/client-config-service",
    hasRouteInRepo: true,
  },
  {
    routeDir: "x-ray",
    serviceName: "AWS X-Ray",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.NOT_SUPPORTED,
    commonDifferentNote: "Different",
    sdkClient: "@aws-sdk/client-xray",
    hasRouteInRepo: true,
  },

  // === SECURITY ===
  {
    routeDir: "iam",
    serviceName: "AWS Identity and Access Management (IAM)",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.FULL,
    commonDifferentNote: "Common — core identity in both",
    sdkClient: "@aws-sdk/client-iam",
    hasRouteInRepo: true,
  },
  {
    routeDir: "iam-access-key",
    serviceName: "IAM Access Key",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.FULL,
    commonDifferentNote: "Common",
    sdkClient: "@aws-sdk/client-iam",
    hasRouteInRepo: true,
  },
  {
    routeDir: "iam-account-alias",
    serviceName: "IAM Account Alias",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.FULL,
    commonDifferentNote: "Common",
    sdkClient: "@aws-sdk/client-iam",
    hasRouteInRepo: true,
  },
  {
    routeDir: "iam-credential-report",
    serviceName: "IAM Credential Report",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.FULL,
    commonDifferentNote: "Common",
    sdkClient: "@aws-sdk/client-iam",
    hasRouteInRepo: true,
  },
  {
    routeDir: "iam-group",
    serviceName: "IAM Group",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.FULL,
    commonDifferentNote: "Common",
    sdkClient: "@aws-sdk/client-iam",
    hasRouteInRepo: true,
  },
  {
    routeDir: "iam-instance-profile",
    serviceName: "IAM Instance Profile",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.FULL,
    commonDifferentNote: "Common",
    sdkClient: "@aws-sdk/client-iam",
    hasRouteInRepo: true,
  },
  {
    routeDir: "iam-login-profile",
    serviceName: "IAM Login Profile",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.FULL,
    commonDifferentNote: "Common",
    sdkClient: "@aws-sdk/client-iam",
    hasRouteInRepo: true,
  },
  {
    routeDir: "iam-openid-connect",
    serviceName: "IAM OpenID Connect",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.PARTIAL,
    commonDifferentNote: "Different",
    sdkClient: "@aws-sdk/client-iam",
    hasRouteInRepo: true,
  },
  {
    routeDir: "iam-password-policy",
    serviceName: "IAM Password Policy",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.FULL,
    commonDifferentNote: "Common",
    sdkClient: "@aws-sdk/client-iam",
    hasRouteInRepo: true,
  },
  {
    routeDir: "iam-saml",
    serviceName: "IAM SAML",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.PARTIAL,
    commonDifferentNote: "Different",
    sdkClient: "@aws-sdk/client-iam",
    hasRouteInRepo: true,
  },
  {
    routeDir: "iam-service-last-access",
    serviceName: "IAM Service Last Accessed",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.FULL,
    commonDifferentNote: "Common",
    sdkClient: "@aws-sdk/client-iam",
    hasRouteInRepo: true,
  },
  {
    routeDir: "iam-service-linked-role",
    serviceName: "IAM Service-Linked Role",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.FULL,
    commonDifferentNote: "Common",
    sdkClient: "@aws-sdk/client-iam",
    hasRouteInRepo: true,
  },
  {
    routeDir: "iam-tag",
    serviceName: "IAM Tag",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.FULL,
    commonDifferentNote: "Common",
    sdkClient: "@aws-sdk/client-iam",
    hasRouteInRepo: true,
  },
  {
    routeDir: "iam-virtual-mfa",
    serviceName: "IAM Virtual MFA",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.FULL,
    commonDifferentNote: "Common",
    sdkClient: "@aws-sdk/client-iam",
    hasRouteInRepo: true,
  },
  {
    routeDir: "kms",
    serviceName: "AWS Key Management Service (KMS)",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.PARTIAL,
    commonDifferentNote: "Different — KMS partial in MinStack",
    sdkClient: "@aws-sdk/client-kms",
    hasRouteInRepo: true,
  },
  {
    routeDir: "secrets-manager",
    serviceName: "AWS Secrets Manager",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.PARTIAL,
    commonDifferentNote: "Different",
    sdkClient: "@aws-sdk/client-secrets-manager",
    hasRouteInRepo: true,
  },
  {
    routeDir: "guardduty",
    serviceName: "Amazon GuardDuty",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.NOT_SUPPORTED,
    commonDifferentNote: "Different",
    sdkClient: "@aws-sdk/client-guardduty",
    hasRouteInRepo: true,
  },
  {
    routeDir: "security-hub",
    serviceName: "AWS Security Hub",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.NOT_SUPPORTED,
    commonDifferentNote: "Different",
    sdkClient: "@aws-sdk/client-securityhub",
    hasRouteInRepo: true,
  },
  {
    routeDir: "waf",
    serviceName: "AWS WAF",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.PARTIAL,
    commonDifferentNote: "Different",
    sdkClient: "@aws-sdk/client-waf",
    hasRouteInRepo: true,
  },
  {
    routeDir: "waf-classic",
    serviceName: "AWS WAF Classic",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.NOT_SUPPORTED,
    commonDifferentNote: "Different — WAF Classic deprecated, not in MinStack",
    sdkClient: "@aws-sdk/client-waf",
    hasRouteInRepo: true,
  },
  {
    routeDir: "wafv2",
    serviceName: "AWS WAFv2",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.PARTIAL,
    commonDifferentNote: "Different",
    sdkClient: "@aws-sdk/client-wafv2",
    hasRouteInRepo: true,
  },
  {
    routeDir: "shield",
    serviceName: "AWS Shield",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.NOT_SUPPORTED,
    commonDifferentNote: "Different",
    sdkClient: "@aws-sdk/client-shield",
    hasRouteInRepo: true,
  },
  {
    routeDir: "macie",
    serviceName: "Amazon Macie",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.NOT_SUPPORTED,
    commonDifferentNote: "Different",
    sdkClient: "@aws-sdk/client-macie2",
    hasRouteInRepo: true,
  },
  {
    routeDir: "inspector",
    serviceName: "Amazon Inspector",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.NOT_SUPPORTED,
    commonDifferentNote: "Different",
    sdkClient: "@aws-sdk/client-inspector2",
    hasRouteInRepo: true,
  },

  // === APPLICATION INTEGRATION ===
  {
    routeDir: "apigateway",
    serviceName: "Amazon API Gateway",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.PARTIAL,
    commonDifferentNote: "Different — partial in MinStack",
    sdkClient: "@aws-sdk/client-api-gateway",
    hasRouteInRepo: true,
  },
  {
    routeDir: "appsync",
    serviceName: "AWS AppSync",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.PARTIAL,
    commonDifferentNote:
      "MiniStack documents GraphQL data-plane execution with best-effort mapping-template support",
    sdkClient: "@aws-sdk/client-appsync",
    hasRouteInRepo: true,
  },
  {
    routeDir: "app-auto-scaling",
    serviceName: "Application Auto Scaling",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.PARTIAL,
    commonDifferentNote: "Different",
    sdkClient: "@aws-sdk/client-application-auto-scaling",
    hasRouteInRepo: true,
  },
  {
    routeDir: "eventbridge-pipe",
    serviceName: "Amazon EventBridge Pipes",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.PARTIAL,
    commonDifferentNote:
      "MiniStack documents Pipes; only documented source-target combinations dispatch",
    sdkClient: "@aws-sdk/client-pipes",
    hasRouteInRepo: true,
  },
  {
    routeDir: "eventbridge-scheduler",
    serviceName: "Amazon EventBridge Scheduler",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.PARTIAL,
    commonDifferentNote: "Different",
    sdkClient: "@aws-sdk/client-scheduler",
    hasRouteInRepo: true,
  },
  {
    routeDir: "eventbridge-schema",
    serviceName: "Amazon EventBridge Schema Registry",
    adapterStatusLocalStack: AdapterStatus.NOT_SUPPORTED,
    adapterStatusMinStack: AdapterStatus.NOT_SUPPORTED,
    commonDifferentNote: "Unsupported until an EventBridge schema API integration is implemented",
    sdkClient: "",
    hasRouteInRepo: true,
  },
  {
    routeDir: "glue-catalog",
    serviceName: "AWS Glue Data Catalog",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.PARTIAL,
    commonDifferentNote:
      "MiniStack documents Glue catalog and crawler support; job execution depends on job type and image configuration",
    sdkClient: "@aws-sdk/client-glue",
    hasRouteInRepo: true,
  },
  {
    routeDir: "glue-job",
    serviceName: "AWS Glue Job",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.PARTIAL,
    commonDifferentNote:
      "MiniStack documents Glue jobs; Python-shell and Spark execution have different runtime requirements",
    sdkClient: "@aws-sdk/client-glue",
    hasRouteInRepo: true,
  },
  {
    routeDir: "appconfig",
    serviceName: "AWS AppConfig",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.NOT_SUPPORTED,
    commonDifferentNote: "Different",
    sdkClient: "@aws-sdk/client-appconfig",
    hasRouteInRepo: true,
  },
  {
    routeDir: "app-mesh",
    serviceName: "AWS App Mesh",
    adapterStatusLocalStack: AdapterStatus.NOT_SUPPORTED,
    adapterStatusMinStack: AdapterStatus.NOT_SUPPORTED,
    commonDifferentNote: "Unsupported until an emulator API integration is implemented",
    sdkClient: "",
    hasRouteInRepo: true,
  },
  {
    routeDir: "cognito",
    serviceName: "Amazon Cognito",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.PARTIAL,
    commonDifferentNote: "Different",
    sdkClient: "@aws-sdk/client-cognito-identity-provider",
    hasRouteInRepo: true,
  },
  {
    routeDir: "pipes",
    serviceName: "Amazon EventBridge Pipes",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.PARTIAL,
    commonDifferentNote:
      "MiniStack documents Pipes; only documented source-target combinations dispatch",
    sdkClient: "@aws-sdk/client-pipes",
    hasRouteInRepo: true,
  },
  {
    routeDir: "step-functions",
    serviceName: "AWS Step Functions",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.PARTIAL,
    commonDifferentNote:
      "MiniStack documents state machines and executions; logging and some integrations are stored but not dispatched",
    sdkClient: "@aws-sdk/client-sfn",
    hasRouteInRepo: true,
  },
  {
    routeDir: "sns",
    serviceName: "Amazon SNS",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.FULL,
    commonDifferentNote: "Common — SNS core in both",
    sdkClient: "@aws-sdk/client-sns",
    hasRouteInRepo: true,
  },
  {
    routeDir: "sns-sms",
    serviceName: "Amazon SNS SMS",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.FULL,
    commonDifferentNote: "Common",
    sdkClient: "@aws-sdk/client-sns",
    hasRouteInRepo: true,
  },
  {
    routeDir: "sqs",
    serviceName: "Amazon SQS",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.FULL,
    commonDifferentNote: "Common — SQS core in both",
    sdkClient: "@aws-sdk/client-sqs",
    hasRouteInRepo: true,
  },
  {
    routeDir: "kinesis",
    serviceName: "Amazon Kinesis",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.PARTIAL,
    commonDifferentNote: "Different",
    sdkClient: "@aws-sdk/client-kinesis",
    hasRouteInRepo: true,
  },
  {
    routeDir: "firehose",
    serviceName: "Amazon Kinesis Data Firehose",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.PARTIAL,
    commonDifferentNote:
      "MiniStack documents Firehose; non-S3 destinations are stored without delivery",
    sdkClient: "@aws-sdk/client-firehose",
    hasRouteInRepo: true,
  },
  {
    routeDir: "msk",
    serviceName: "Amazon MSK",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.PARTIAL,
    commonDifferentNote:
      "MiniStack documents MSK control plane; bootstrap brokers require an external Kafka broker",
    sdkClient: "@aws-sdk/client-kafka",
    hasRouteInRepo: true,
  },

  // === ANALYTICS ===
  {
    routeDir: "athena-workgroup",
    serviceName: "Amazon Athena Workgroup",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.PARTIAL,
    commonDifferentNote:
      "MiniStack documents Athena; real SQL requires the full image/DuckDB, otherwise results are mock-shaped",
    sdkClient: "@aws-sdk/client-athena",
    hasRouteInRepo: true,
  },
  {
    routeDir: "athena",
    serviceName: "Amazon Athena",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.PARTIAL,
    commonDifferentNote:
      "Different — Athena query execution depends on the configured LocalStack/MiniStack SQL runtime",
    sdkClient: "@aws-sdk/client-athena",
    hasRouteInRepo: true,
  },
  {
    routeDir: "emr",
    serviceName: "Amazon EMR",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.PARTIAL,
    commonDifferentNote:
      "MiniStack documents EMR control-plane metadata; Spark/Hadoop execution is not provided",
    sdkClient: "@aws-sdk/client-emr",
    hasRouteInRepo: true,
  },

  // === MANAGEMENT ===
  {
    routeDir: "cloudformation",
    serviceName: "AWS CloudFormation",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.FULL,
    commonDifferentNote: "Common",
    sdkClient: "@aws-sdk/client-cloudformation",
    hasRouteInRepo: true,
  },
  {
    routeDir: "cloudcontrol",
    serviceName: "AWS Cloud Control API",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.NOT_SUPPORTED,
    commonDifferentNote: "Different",
    sdkClient: "@aws-sdk/client-cloudcontrol",
    hasRouteInRepo: true,
  },
  {
    routeDir: "systems-manager-parameter-store",
    serviceName: "AWS Systems Manager Parameter Store",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.PARTIAL,
    commonDifferentNote: "Different",
    sdkClient: "@aws-sdk/client-ssm",
    hasRouteInRepo: true,
  },
  {
    routeDir: "sts",
    serviceName: "AWS STS",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.FULL,
    commonDifferentNote: "Common",
    sdkClient: "@aws-sdk/client-sts",
    hasRouteInRepo: true,
  },
  {
    routeDir: "resource-groups",
    serviceName: "AWS Resource Groups",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.PARTIAL,
    commonDifferentNote: "Different",
    sdkClient: "@aws-sdk/client-resource-groups",
    hasRouteInRepo: true,
  },
  {
    routeDir: "resource-groups-tagging",
    serviceName: "AWS Resource Groups Tagging API",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.PARTIAL,
    commonDifferentNote: "Different",
    sdkClient: "@aws-sdk/client-resource-groups-tagging-api",
    hasRouteInRepo: true,
  },
  {
    routeDir: "backup",
    serviceName: "AWS Backup",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.NOT_SUPPORTED,
    commonDifferentNote: "Different",
    sdkClient: "@aws-sdk/client-backup",
    hasRouteInRepo: true,
  },
  {
    routeDir: "organizations",
    serviceName: "AWS Organizations",
    adapterStatusLocalStack: AdapterStatus.NOT_SUPPORTED,
    adapterStatusMinStack: AdapterStatus.NOT_SUPPORTED,
    commonDifferentNote: "Unsupported in the emulator console; requires a real AWS account",
    sdkClient: "",
    hasRouteInRepo: true,
  },
  {
    routeDir: "detective",
    serviceName: "Amazon Detective",
    adapterStatusLocalStack: AdapterStatus.NOT_SUPPORTED,
    adapterStatusMinStack: AdapterStatus.NOT_SUPPORTED,
    commonDifferentNote: "Unsupported until an emulator API integration is implemented",
    sdkClient: "",
    hasRouteInRepo: true,
  },
  {
    routeDir: "imds",
    serviceName: "Amazon Instance Metadata Service (IMDS)",
    adapterStatusLocalStack: AdapterStatus.NOT_SUPPORTED,
    adapterStatusMinStack: AdapterStatus.NOT_SUPPORTED,
    commonDifferentNote:
      "Unsupported as a console management service; IMDS requires an instance data-plane context",
    sdkClient: "",
    hasRouteInRepo: true,
  },

  // === MEDIA / IOT / MISC ===
  {
    routeDir: "iot",
    serviceName: "AWS IoT",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.PARTIAL,
    commonDifferentNote:
      "MiniStack documents IoT things, certificates, policies, shadows, and optional mTLS certificate support",
    sdkClient: "@aws-sdk/client-iot",
    hasRouteInRepo: true,
  },
  {
    routeDir: "iot-core",
    serviceName: "AWS IoT Core",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.PARTIAL,
    commonDifferentNote: "MiniStack documents IoT Core control and data-plane subsets",
    sdkClient: "@aws-sdk/client-iot",
    hasRouteInRepo: true,
  },
  {
    routeDir: "mediaconnect",
    serviceName: "AWS Elemental MediaConnect",
    adapterStatusLocalStack: AdapterStatus.NOT_SUPPORTED,
    adapterStatusMinStack: AdapterStatus.NOT_SUPPORTED,
    commonDifferentNote: "Unsupported until an emulator API integration is implemented",
    sdkClient: "",
    hasRouteInRepo: true,
  },
  {
    routeDir: "mwaa",
    serviceName: "Amazon MWAA",
    adapterStatusLocalStack: AdapterStatus.NOT_SUPPORTED,
    adapterStatusMinStack: AdapterStatus.NOT_SUPPORTED,
    commonDifferentNote: "Unsupported until an emulator API integration is implemented",
    sdkClient: "",
    hasRouteInRepo: true,
  },
  {
    routeDir: "key-pair",
    serviceName: "Amazon EC2 Key Pair",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.FULL,
    commonDifferentNote: "Common",
    sdkClient: "@aws-sdk/client-ec2",
    hasRouteInRepo: true,
  },
  {
    routeDir: "ami",
    serviceName: "Amazon Machine Image (AMI)",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.PARTIAL,
    commonDifferentNote: "Different — partial AMI support in MinStack",
    sdkClient: "@aws-sdk/client-ec2",
    hasRouteInRepo: true,
  },
  {
    routeDir: "launch-template",
    serviceName: "Amazon Launch Template",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.PARTIAL,
    commonDifferentNote: "Different",
    sdkClient: "@aws-sdk/client-ec2",
    hasRouteInRepo: true,
  },
  {
    routeDir: "auto-scaling",
    serviceName: "Amazon Auto Scaling",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.PARTIAL,
    commonDifferentNote: "Different",
    sdkClient: "@aws-sdk/client-auto-scaling",
    hasRouteInRepo: true,
  },
  {
    routeDir: "code-deploy",
    serviceName: "AWS CodeDeploy",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.NOT_SUPPORTED,
    commonDifferentNote: "Different",
    sdkClient: "@aws-sdk/client-codedeploy",
    hasRouteInRepo: true,
  },
  {
    routeDir: "codebuild",
    serviceName: "AWS CodeBuild",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.NOT_SUPPORTED,
    commonDifferentNote: "Different",
    sdkClient: "@aws-sdk/client-codebuild",
    hasRouteInRepo: true,
  },
  {
    routeDir: "codepipeline",
    serviceName: "AWS CodePipeline",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.NOT_SUPPORTED,
    commonDifferentNote: "Different",
    sdkClient: "@aws-sdk/client-codepipeline",
    hasRouteInRepo: true,
  },
  {
    routeDir: "cloudfront",
    serviceName: "Amazon CloudFront",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.PARTIAL,
    commonDifferentNote: "Different",
    sdkClient: "@aws-sdk/client-cloudfront",
    hasRouteInRepo: true,
  },
  {
    routeDir: "cloudfront-keyvaluestore",
    serviceName: "CloudFront KeyValueStore",
    adapterStatusLocalStack: AdapterStatus.NOT_SUPPORTED,
    adapterStatusMinStack: AdapterStatus.NOT_SUPPORTED,
    commonDifferentNote: "Unsupported until an emulator API integration is implemented",
    sdkClient: "",
    hasRouteInRepo: true,
  },
  {
    routeDir: "route53",
    serviceName: "Amazon Route 53",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.PARTIAL,
    commonDifferentNote: "Different",
    sdkClient: "@aws-sdk/client-route-53",
    hasRouteInRepo: true,
  },
  {
    routeDir: "transfer",
    serviceName: "AWS Transfer Family",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.NOT_SUPPORTED,
    commonDifferentNote: "Different",
    sdkClient: "@aws-sdk/client-transfer",
    hasRouteInRepo: true,
  },
  {
    routeDir: "verified-access",
    serviceName: "AWS Verified Access",
    adapterStatusLocalStack: AdapterStatus.NOT_SUPPORTED,
    adapterStatusMinStack: AdapterStatus.NOT_SUPPORTED,
    commonDifferentNote: "Unsupported until an emulator API integration is implemented",
    sdkClient: "",
    hasRouteInRepo: true,
  },
  {
    routeDir: "billing",
    serviceName: "AWS Billing",
    adapterStatusLocalStack: AdapterStatus.NOT_SUPPORTED,
    adapterStatusMinStack: AdapterStatus.NOT_SUPPORTED,
    commonDifferentNote: "Unsupported in the emulator console; requires real AWS billing access",
    sdkClient: "",
    hasRouteInRepo: true,
  },
  {
    routeDir: "budget",
    serviceName: "AWS Budgets",
    adapterStatusLocalStack: AdapterStatus.NOT_SUPPORTED,
    adapterStatusMinStack: AdapterStatus.NOT_SUPPORTED,
    commonDifferentNote: "Unsupported in the emulator console; requires real AWS billing access",
    sdkClient: "",
    hasRouteInRepo: true,
  },
  {
    routeDir: "cost-explorer",
    serviceName: "AWS Cost Explorer",
    adapterStatusLocalStack: AdapterStatus.NOT_SUPPORTED,
    adapterStatusMinStack: AdapterStatus.NOT_SUPPORTED,
    commonDifferentNote: "Unsupported in the emulator console; requires real AWS billing access",
    sdkClient: "",
    hasRouteInRepo: true,
  },
  {
    routeDir: "cost-usage-report",
    serviceName: "AWS Cost and Usage Report",
    adapterStatusLocalStack: AdapterStatus.NOT_SUPPORTED,
    adapterStatusMinStack: AdapterStatus.NOT_SUPPORTED,
    commonDifferentNote: "Unsupported in the emulator console; requires real AWS billing access",
    sdkClient: "",
    hasRouteInRepo: true,
  },
  {
    routeDir: "account",
    serviceName: "AWS Account",
    adapterStatusLocalStack: AdapterStatus.NOT_SUPPORTED,
    adapterStatusMinStack: AdapterStatus.NOT_SUPPORTED,
    commonDifferentNote:
      "Unsupported in the emulator console; account settings are not implemented",
    sdkClient: "",
    hasRouteInRepo: false,
  },
  {
    routeDir: "acm",
    serviceName: "AWS Certificate Manager",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.PARTIAL,
    commonDifferentNote: "Different",
    sdkClient: "@aws-sdk/client-acm",
    hasRouteInRepo: true,
  },

  // === SERVICES NOT PREVIOUSLY REGISTERED ===
  {
    routeDir: "amplify",
    serviceName: "AWS Amplify",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.PARTIAL,
    commonDifferentNote:
      "Different — Amplify control-plane metadata; actual builds require external CI",
    sdkClient: "@aws-sdk/client-amplify",
    hasRouteInRepo: true,
  },
  {
    routeDir: "bedrock",
    serviceName: "Amazon Bedrock",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.NOT_SUPPORTED,
    commonDifferentNote: "Different — Bedrock not in MinStack",
    sdkClient: "@aws-sdk/client-bedrock",
    hasRouteInRepo: true,
  },
  {
    routeDir: "comprehend",
    serviceName: "Amazon Comprehend",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.NOT_SUPPORTED,
    commonDifferentNote: "Different — Comprehend not in MinStack",
    sdkClient: "@aws-sdk/client-comprehend",
    hasRouteInRepo: true,
  },
  {
    routeDir: "connect",
    serviceName: "Amazon Connect",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.NOT_SUPPORTED,
    commonDifferentNote: "Different — Connect not in MinStack",
    sdkClient: "@aws-sdk/client-connect",
    hasRouteInRepo: true,
  },
  {
    routeDir: "device-farm",
    serviceName: "AWS Device Farm",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.NOT_SUPPORTED,
    commonDifferentNote: "Different — Device Farm not in MinStack",
    sdkClient: "@aws-sdk/client-device-farm",
    hasRouteInRepo: true,
  },
  {
    routeDir: "ec2-health-check",
    serviceName: "EC2 Health Check",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.NOT_SUPPORTED,
    commonDifferentNote: "Different — Route 53 health checks",
    sdkClient: "@aws-sdk/client-route-53",
    hasRouteInRepo: true,
  },
  {
    routeDir: "elasticache",
    serviceName: "Amazon ElastiCache",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.PARTIAL,
    commonDifferentNote: "Different — ElastiCache control-plane metadata",
    sdkClient: "@aws-sdk/client-elasticache",
    hasRouteInRepo: true,
  },
  {
    routeDir: "iot-analytics",
    serviceName: "AWS IoT Analytics",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.NOT_SUPPORTED,
    commonDifferentNote: "Different — IoT Analytics not in MinStack",
    sdkClient: "@aws-sdk/client-iotanalytics",
    hasRouteInRepo: true,
  },
  {
    routeDir: "lex",
    serviceName: "Amazon Lex",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.NOT_SUPPORTED,
    commonDifferentNote: "Different — Lex not in MinStack",
    sdkClient: "@aws-sdk/client-lex-models-v2",
    hasRouteInRepo: true,
  },
  {
    routeDir: "pinpoint",
    serviceName: "Amazon Pinpoint",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.NOT_SUPPORTED,
    commonDifferentNote: "Different — Pinpoint not in MinStack",
    sdkClient: "@aws-sdk/client-pinpoint",
    hasRouteInRepo: true,
  },
  {
    routeDir: "polly",
    serviceName: "Amazon Polly",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.NOT_SUPPORTED,
    commonDifferentNote: "Different — Polly not in MinStack",
    sdkClient: "@aws-sdk/client-polly",
    hasRouteInRepo: true,
  },
  {
    routeDir: "quicksight",
    serviceName: "Amazon QuickSight",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.NOT_SUPPORTED,
    commonDifferentNote: "Different — QuickSight not in MinStack",
    sdkClient: "@aws-sdk/client-quicksight",
    hasRouteInRepo: true,
  },
  {
    routeDir: "rekognition",
    serviceName: "Amazon Rekognition",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.NOT_SUPPORTED,
    commonDifferentNote: "Different — Rekognition not in MinStack",
    sdkClient: "@aws-sdk/client-rekognition",
    hasRouteInRepo: true,
  },
  {
    routeDir: "sagemaker",
    serviceName: "Amazon SageMaker",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.NOT_SUPPORTED,
    commonDifferentNote: "Different — SageMaker not in MinStack",
    sdkClient: "@aws-sdk/client-sagemaker",
    hasRouteInRepo: true,
  },
  {
    routeDir: "servicediscovery",
    serviceName: "AWS Cloud Map",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.PARTIAL,
    commonDifferentNote: "Different — Service Discovery partial in MinStack",
    sdkClient: "@aws-sdk/client-servicediscovery",
    hasRouteInRepo: true,
  },
  {
    routeDir: "ses",
    serviceName: "Amazon SES",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.PARTIAL,
    commonDifferentNote: "Different — SES control-plane metadata",
    sdkClient: "@aws-sdk/client-ses",
    hasRouteInRepo: true,
  },
  {
    routeDir: "support",
    serviceName: "AWS Support",
    adapterStatusLocalStack: AdapterStatus.NOT_SUPPORTED,
    adapterStatusMinStack: AdapterStatus.NOT_SUPPORTED,
    commonDifferentNote: "Unsupported in the emulator console; requires real AWS support access",
    sdkClient: "",
    hasRouteInRepo: true,
  },
  {
    routeDir: "lambda-microvms",
    serviceName: "Lambda MicroVMs",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.PARTIAL,
    commonDifferentNote: "Different",
    sdkClient: "@aws-sdk/client-lambda",
    hasRouteInRepo: true,
  },

  // === TOP-LEVEL SERVICE PAGES ===
  {
    routeDir: "ecr",
    serviceName: "Amazon ECR",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.PARTIAL,
    commonDifferentNote: "Different — ECR support depends on the active emulator runtime",
    sdkClient: "@aws-sdk/client-ecr",
    hasRouteInRepo: true,
  },
  {
    routeDir: "ecs",
    serviceName: "Amazon ECS",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.PARTIAL,
    commonDifferentNote: "Different — ECS support depends on the active emulator runtime",
    sdkClient: "@aws-sdk/client-ecs",
    hasRouteInRepo: true,
  },
  {
    routeDir: "eks",
    serviceName: "Amazon EKS",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.PARTIAL,
    commonDifferentNote: "Different — EKS support depends on the active emulator runtime",
    sdkClient: "@aws-sdk/client-eks",
    hasRouteInRepo: true,
  },
  {
    routeDir: "eventbridge",
    serviceName: "Amazon EventBridge",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.PARTIAL,
    commonDifferentNote: "Different — EventBridge integrations vary by emulator",
    sdkClient: "@aws-sdk/client-eventbridge",
    hasRouteInRepo: true,
  },
  {
    routeDir: "sesv2",
    serviceName: "Amazon SES v2",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.PARTIAL,
    commonDifferentNote: "Different — SES v2 availability is runtime dependent",
    sdkClient: "@aws-sdk/client-sesv2",
    hasRouteInRepo: true,
  },
  {
    routeDir: "bedrock-agent",
    serviceName: "Amazon Bedrock Agents",
    adapterStatusLocalStack: AdapterStatus.NOT_SUPPORTED,
    adapterStatusMinStack: AdapterStatus.NOT_SUPPORTED,
    commonDifferentNote:
      "The current emulator runtimes do not expose a verified Bedrock Agent workflow",
    sdkClient: "@aws-sdk/client-bedrock-agent",
    hasRouteInRepo: true,
  },
  {
    routeDir: "bedrock-agent-runtime",
    serviceName: "Amazon Bedrock Agent Runtime",
    adapterStatusLocalStack: AdapterStatus.NOT_SUPPORTED,
    adapterStatusMinStack: AdapterStatus.NOT_SUPPORTED,
    commonDifferentNote:
      "The current emulator runtimes do not expose a verified Bedrock Agent Runtime workflow",
    sdkClient: "@aws-sdk/client-bedrock-agent-runtime",
    hasRouteInRepo: true,
  },
  {
    routeDir: "bedrock-agentcore",
    serviceName: "Amazon Bedrock AgentCore",
    adapterStatusLocalStack: AdapterStatus.NOT_SUPPORTED,
    adapterStatusMinStack: AdapterStatus.NOT_SUPPORTED,
    commonDifferentNote: "No verified emulator integration is implemented",
    sdkClient: "",
    hasRouteInRepo: true,
  },
  {
    routeDir: "bedrock-runtime",
    serviceName: "Amazon Bedrock Runtime",
    adapterStatusLocalStack: AdapterStatus.PARTIAL,
    adapterStatusMinStack: AdapterStatus.NOT_SUPPORTED,
    commonDifferentNote: "Model invocation requires a compatible model/data-plane runtime",
    sdkClient: "@aws-sdk/client-bedrock-runtime",
    hasRouteInRepo: true,
  },

  // === EC2 TOP-LEVEL SUBRESOURCES ===
  {
    routeDir: "ec2-delegation-set",
    serviceName: "EC2 Delegation Set",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.PARTIAL,
    commonDifferentNote: "EC2 networking subresource",
    sdkClient: "@aws-sdk/client-ec2",
    hasRouteInRepo: true,
  },
  {
    routeDir: "ec2-gateway-load-balancer",
    serviceName: "EC2 Gateway Load Balancer",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.PARTIAL,
    commonDifferentNote: "EC2 load-balancer subresource",
    sdkClient: "@aws-sdk/client-ec2",
    hasRouteInRepo: true,
  },
  {
    routeDir: "ec2-listener",
    serviceName: "EC2 Listener",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.PARTIAL,
    commonDifferentNote: "EC2 load-balancer subresource",
    sdkClient: "@aws-sdk/client-ec2",
    hasRouteInRepo: true,
  },
  {
    routeDir: "ec2-network-interface",
    serviceName: "EC2 Network Interface",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.PARTIAL,
    commonDifferentNote: "EC2 networking subresource",
    sdkClient: "@aws-sdk/client-ec2",
    hasRouteInRepo: true,
  },
  {
    routeDir: "ec2-placement-group",
    serviceName: "EC2 Placement Group",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.PARTIAL,
    commonDifferentNote: "EC2 capacity subresource",
    sdkClient: "@aws-sdk/client-ec2",
    hasRouteInRepo: true,
  },
  {
    routeDir: "ec2-query-log",
    serviceName: "EC2 Query Log",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.PARTIAL,
    commonDifferentNote: "EC2 networking subresource",
    sdkClient: "@aws-sdk/client-ec2",
    hasRouteInRepo: true,
  },
  {
    routeDir: "ec2-resolver",
    serviceName: "EC2 Resolver",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.PARTIAL,
    commonDifferentNote: "EC2 networking subresource",
    sdkClient: "@aws-sdk/client-ec2",
    hasRouteInRepo: true,
  },
  {
    routeDir: "ec2-reversible-query-log",
    serviceName: "EC2 Reversible Query Log",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.PARTIAL,
    commonDifferentNote: "EC2 networking subresource",
    sdkClient: "@aws-sdk/client-ec2",
    hasRouteInRepo: true,
  },
  {
    routeDir: "ec2-spot-instance",
    serviceName: "EC2 Spot Instance",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.PARTIAL,
    commonDifferentNote: "EC2 capacity subresource",
    sdkClient: "@aws-sdk/client-ec2",
    hasRouteInRepo: true,
  },
  {
    routeDir: "ec2-target-group",
    serviceName: "EC2 Target Group",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.PARTIAL,
    commonDifferentNote: "EC2 load-balancer subresource",
    sdkClient: "@aws-sdk/client-ec2",
    hasRouteInRepo: true,
  },
  {
    routeDir: "ec2-traffic-flow",
    serviceName: "EC2 Traffic Flow",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.PARTIAL,
    commonDifferentNote: "EC2 networking subresource",
    sdkClient: "@aws-sdk/client-ec2",
    hasRouteInRepo: true,
  },
  {
    routeDir: "ec2-traffic-policy",
    serviceName: "EC2 Traffic Policy",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.PARTIAL,
    commonDifferentNote: "EC2 networking subresource",
    sdkClient: "@aws-sdk/client-ec2",
    hasRouteInRepo: true,
  },
  {
    routeDir: "apigatewayv2",
    serviceName: "Amazon API Gateway V2",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.PARTIAL,
    commonDifferentNote: "Different — HTTP/WebSocket API support is emulator dependent",
    sdkClient: "@aws-sdk/client-apigatewayv2",
    hasRouteInRepo: false,
  },
  {
    routeDir: "route53resolver",
    serviceName: "Amazon Route 53 Resolver",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.PARTIAL,
    commonDifferentNote: "Different — Resolver endpoint support is emulator dependent",
    sdkClient: "@aws-sdk/client-route53resolver",
    hasRouteInRepo: false,
  },
  {
    routeDir: "s3control",
    serviceName: "Amazon S3 Control",
    adapterStatusLocalStack: AdapterStatus.FULL,
    adapterStatusMinStack: AdapterStatus.PARTIAL,
    commonDifferentNote: "Different — access point support is emulator dependent",
    sdkClient: "@aws-sdk/client-s3-control",
    hasRouteInRepo: false,
  },
];
export const SERVICE_COUNT = SERVICE_REGISTRY.length;

export const COMMON_SERVICES = SERVICE_REGISTRY.filter(
  (s) =>
    s.adapterStatusLocalStack === AdapterStatus.FULL &&
    s.adapterStatusMinStack === AdapterStatus.FULL,
);

export const DIFFERENT_SERVICES = SERVICE_REGISTRY.filter(
  (s) =>
    s.adapterStatusMinStack !== AdapterStatus.FULL ||
    s.adapterStatusLocalStack !== s.adapterStatusMinStack,
);

export const COMMON_SERVICE_NAMES = COMMON_SERVICES.map((s) => s.serviceName);
export const DIFFERENT_SERVICE_NAMES = DIFFERENT_SERVICES.map((s) => s.serviceName);

const normalizeServiceKey = (value: string): string =>
  value.toLowerCase().replace(/[^a-z0-9]/g, "");

// LocalStack and MiniStack health endpoints expose service names used by the
// emulator rather than the console's route names. Keep these aliases explicit
// so a route is not incorrectly disabled just because `route-table` is
// reported as `ec2`, for example.
const HEALTH_KEY_ALIASES: Record<string, string[]> = {
  "ec2-certificate": ["ec2"],
  "ec2-dedicated-host": ["ec2"],
  "ec2-health-check": ["route53"],
  "ec2-vpc-endpoint": ["ec2"],
  "ec2-vpc-peering": ["ec2"],
  "lambda-alias": ["lambda"],
  "lambda-layers": ["lambda"],
  "lambda-microvms": ["lambda"],
  "ecs-cluster": ["ecs"],
  "ecs-service": ["ecs"],
  fargate: ["ecs"],
  "ecr-repo": ["ecr"],
  "eks-cluster": ["eks"],
  "batch-job": ["batch"],
  volume: ["ec2"],
  snapshot: ["ec2"],
  vpc: ["ec2"],
  subnet: ["ec2"],
  "route-table": ["ec2"],
  "internet-gateway": ["ec2"],
  "nat-gateway": ["ec2"],
  "network-acl": ["ec2"],
  "security-group": ["ec2"],
  vpn: ["ec2"],
  "transit-gateway": ["ec2"],
  "elastic-ip": ["ec2"],
  "key-pair": ["ec2"],
  ami: ["ec2"],
  "launch-template": ["ec2"],
  "cloudwatch-logs": ["logs", "monitoring"],
  cloudwatch: ["monitoring"],
  emr: ["elasticmapreduce"],
  sesv2: ["ses"],
  apigatewayv2: ["apigateway"],
  efs: ["elasticfilesystem"],
  elb: ["elasticloadbalancing"],
  "ec2-elastic-loading": ["elasticloadbalancing", "elbv2"],
  eventbridge: ["events"],
  "step-functions": ["states", "stepfunctions"],
  "resource-groups-tagging": ["tagging", "resourcegroupstaggingapi"],
  "app-auto-scaling": ["application-autoscaling"],
  "eventbridge-pipe": ["pipes"],
  "eventbridge-scheduler": ["scheduler"],
  "glue-catalog": ["glue"],
  "glue-job": ["glue"],
  cognito: ["cognito-idp"],
  msk: ["kafka"],
  "athena-workgroup": ["athena"],
  "systems-manager-parameter-store": ["ssm"],
  "iot-core": ["iot"],
  waf: ["wafv2"],
  "waf-classic": ["wafv2"],
  "sns-sms": ["sns"],
  "s3-files": ["s3files"],
  "s3-tables": ["s3tables"],
};

// Runtime probe evidence from LocalStack 2026.8.3 (2026-09-25). These routes
// are present in the console and have SDK handlers, but the active emulator
// returned a license-required or unsupported-operation response. Keep them
// visible with an explicit unavailable reason until a licensed/updated
// emulator is verified; do not infer availability from the health map alone.
const LOCALSTACK_RUNTIME_UNAVAILABLE_SERVICES = new Set([
  "amplify",
  "apigatewayv2",
  "app-auto-scaling",
  "appsync",
  "athena",
  "athena-workgroup",
  "auto-scaling",
  "backup",
  "batch-job",
  "bedrock",
  "bedrock-runtime",
  "cloudfront",
  "cloudtrail",
  "code-deploy",
  "codebuild",
  "codepipeline",
  "cognito",
  "comprehend",
  "connect",
  "device-farm",
  "ecr",
  "ecr-repo",
  "ecs",
  "ecs-cluster",
  "ecs-service",
  "efs",
  "eks",
  "eks-cluster",
  "elasticache",
  "emr",
  "eventbridge-pipe",
  "eventbridge-scheduler",
  "glue-catalog",
  "glue-job",
  "guardduty",
  "inspector",
  "iot",
  "iot-analytics",
  "iot-core",
  "lex",
  "memorydb",
  "msk",
  "pinpoint",
  "pipes",
  "polly",
  "quicksight",
  "rds",
  "rds-data",
  "rekognition",
  "sagemaker",
  "security-hub",
  "servicediscovery",
  "sesv2",
  "transfer",
  "verified-access",
  "macie",
  "shield",
  "waf",
  "waf-classic",
  "wafv2",
  "x-ray",
]);

const LOCALSTACK_RUNTIME_REASON =
  "The active LocalStack runtime did not provide a usable API workflow for this service (license or operation limitation). Upgrade LocalStack or use a verified compatible emulator.";

// MiniStack 1.5.16 reports broad health coverage, but the first authenticated
// probe showed these partial routes returning unsupported operations or
// protocol-shaped errors. Keep them conservative until re-verified.
const MINISTACK_RUNTIME_UNAVAILABLE_SERVICES = new Set([
  "amplify",
  "app-auto-scaling",
  "msk",
  "redshift",
  "route53resolver",
  "s3control",
]);

const MINISTACK_RUNTIME_REASON =
  "The active MiniStack runtime did not provide a usable API workflow for this service. Use a MiniStack version/image with verified operation support.";

// ── LocalEmu ────────────────────────────────────────────────────────────────
// LocalEmu is the community continuation of the archived LocalStack codebase
// (Apache-2.0, by TocConsulting and the LocalStack/Atlassian contributors). It is
// "totally free": no account, no auth token, no tiers, no usage limits.
//
// Its health endpoint at GET /_localemu/health returns a per-service map plus
// `edition` and `version`, and its documentation publishes a per-service fidelity
// tier. Those published tiers are the authoritative capability signal, so the
// console enables the services LocalEmu documents instead of only the handful
// that happened to be probed.
//
// Tiers, from localemu.cloud/docs/services:
//   - "Full emulation"       -> complete state management and full CRUD
//   - "Good emulation"       -> working CRUD via moto; some advanced features
//                               may return default responses
//   - "API compatible"       -> accepts calls and returns valid responses with
//                               mocked behaviour; useful where a call must not error
//
// Health is still required: a service that the running build does not report
// stays unavailable, and the probe overrides below still win, because a 1.2.0
// runtime probe proved three documented services unusable.

/** "Full emulation" — complete state management, full CRUD. */
export const LOCALEMU_FULL_SERVICES = new Set<string>([
  "ami",
  "apigateway",
  "apigatewayv2",
  "cloudtrail",
  "cognito",
  "dynamodb",
  "ec2",
  "ec2-certificate",
  "ec2-dedicated-host",
  "ec2-delegation-set",
  "ec2-gateway-load-balancer",
  "ec2-health-check",
  "ec2-listener",
  "ec2-network-interface",
  "ec2-placement-group",
  "ec2-query-log",
  "ec2-resolver",
  "ec2-reversible-query-log",
  "ec2-spot-instance",
  "ec2-target-group",
  "ec2-traffic-flow",
  "ec2-traffic-policy",
  "ec2-vpc-endpoint",
  "ec2-vpc-peering",
  "ecs",
  "ecs-cluster",
  "ecs-service",
  "eks",
  "eks-cluster",
  "elastic-ip",
  "fargate",
  "firehose",
  "iam",
  "iam-access-key",
  "iam-account-alias",
  "iam-credential-report",
  "iam-group",
  "iam-instance-profile",
  "iam-login-profile",
  "iam-openid-connect",
  "iam-password-policy",
  "iam-saml",
  "iam-service-last-access",
  "iam-service-linked-role",
  "iam-tag",
  "iam-virtual-mfa",
  "imds",
  "internet-gateway",
  "key-pair",
  "kms",
  "lambda",
  "lambda-alias",
  "lambda-layers",
  "lambda-microvms",
  "launch-template",
  "msk",
  "nat-gateway",
  "network-acl",
  "opensearch",
  "rds",
  "redshift",
  "route-table",
  "s3",
  "secrets-manager",
  "security-group",
  "sns",
  "sns-sms",
  "sqs",
  "step-functions",
  "subnet",
  "systems-manager-parameter-store",
  "transit-gateway",
  "vpc",
]);

/** "Good emulation" — working CRUD, some advanced features return defaults. */
export const LOCALEMU_GOOD_SERVICES = new Set<string>([
  "acm",
  "athena",
  "athena-workgroup",
  "budget",
  "cloudformation",
  "cloudwatch",
  "cloudwatch-logs",
  "code-deploy",
  "config",
  "eventbridge",
  "eventbridge-pipe",
  "eventbridge-scheduler",
  "eventbridge-schema",
  "kinesis",
  "pipes",
  "route53",
  "route53resolver",
  "s3-files",
  "s3-tables",
  "s3control",
  "servicediscovery",
  "ses",
  "sesv2",
  "sts",
]);

/** "API compatible" — valid responses with mocked behaviour. */
export const LOCALEMU_API_COMPATIBLE_SERVICES = new Set<string>([
  "account",
  "amplify",
  "app-auto-scaling",
  "app-mesh",
  "appsync",
  "auto-scaling",
  "batch-job",
  "bedrock-agent-runtime",
  "bedrock-agentcore",
  "bedrock-runtime",
  "cloudfront",
  "cloudfront-keyvaluestore",
  "codebuild",
  "codepipeline",
  "comprehend",
  "cost-explorer",
  "direct-connect",
  "dsql",
  "ec2-elastic-loading",
  "ecr",
  "ecr-repo",
  "efs",
  "elasticache",
  "elb",
  "emr",
  "global-accelerator",
  "glue-catalog",
  "glue-job",
  "guardduty",
  "inspector",
  "iot",
  "iot-core",
  "macie",
  "mediaconnect",
  "organizations",
  "pinpoint",
  "polly",
  "quicksight",
  "rds-data",
  "rekognition",
  "resource-groups",
  "resource-groups-tagging",
  "sagemaker",
  "security-hub",
  "shield",
  "snapshot",
  "support",
  "transfer",
  "volume",
  "waf",
  "waf-classic",
  "wafv2",
  "x-ray",
]);

/**
 * Documented by LocalEmu but proven unusable by a runtime probe against 1.2.0
 * community, so the documentation tier is not trusted for these.
 * Evidence: evidence/localemu-api-sweep.json and evidence/localemu-crud.json.
 *   - appconfig     -> 503 operation-unsupported
 *   - backup        -> 502 upstream-error
 *   - bedrock       -> 502 upstream-error
 *   - bedrock-agent -> 503 operation-unsupported
 */
export const LOCALEMU_RUNTIME_UNAVAILABLE_SERVICES = new Set<string>([
  "appconfig",
  "backup",
  "bedrock",
  "bedrock-agent",
]);

/**
 * Services this console exposes that LocalEmu does not document at all, so
 * there is no fidelity tier to honour. Six of these (cloudcontrol, connect,
 * device-farm, iot-analytics, lex, verified-access) were independently
 * confirmed broken by the runtime probe, which corroborates the gap.
 */
export const LOCALEMU_UNDOCUMENTED_SERVICES = new Set<string>([
  "billing",
  "cloudcontrol",
  "connect",
  "cost-usage-report",
  "detective",
  "device-farm",
  "iot-analytics",
  "lex",
  "mwaa",
  "verified-access",
  "vpn",
]);

export const LOCALEMU_NOT_DOCUMENTED_REASON =
  "LocalEmu does not document this service, so there is no published fidelity tier to honour.";

const LOCALEMU_RUNTIME_REASON =
  "The active LocalEmu runtime did not provide a usable API workflow for this service, despite LocalEmu documenting it. Recorded from a runtime probe against this build.";

/** Published fidelity tier for a route directory, or undefined when undocumented. */
export function getLocalEmuDocumentedStatus(routeDir: string): AdapterStatus | undefined {
  if (LOCALEMU_FULL_SERVICES.has(routeDir)) return AdapterStatus.FULL;
  if (LOCALEMU_GOOD_SERVICES.has(routeDir)) return AdapterStatus.PARTIAL;
  if (LOCALEMU_API_COMPATIBLE_SERVICES.has(routeDir)) return AdapterStatus.PARTIAL;
  return undefined;
}

/** Narrows an arbitrary value to a known adapter mode. */
export function toAdapterMode(value: unknown): AdapterMode | "unknown" {
  if (
    value === AdapterMode.LOCALSTACK ||
    value === AdapterMode.MINSTACK ||
    value === AdapterMode.LOCALEMU
  ) {
    return value;
  }
  return "unknown";
}

/**
 * Static status for a mode.
 *
 * The registry has per-emulator columns for LocalStack and MiniStack. LocalEmu
 * resolves from its published tier list plus the health payload, so it is
 * handled inside `getServiceAvailability` where the health map is available.
 */
export function getAdapterStatusForMode(
  service: ServiceCompatibilityEntry,
  mode: AdapterMode | "unknown",
): AdapterStatus {
  if (mode === AdapterMode.MINSTACK) return service.adapterStatusMinStack;
  return service.adapterStatusLocalStack;
}

/** Per-emulator health endpoint path. */
export function getHealthPathForMode(mode: AdapterMode | "unknown"): string {
  if (mode === AdapterMode.MINSTACK) return "/_ministack/health";
  if (mode === AdapterMode.LOCALEMU) return "/_localemu/health";
  return "/_localstack/health";
}

const healthValueIsEnabled = (value: unknown): boolean => {
  if (
    value === true ||
    value === "available" ||
    value === "healthy" ||
    value === "running" ||
    value === "true"
  ) {
    return true;
  }
  if (value && typeof value === "object" && "status" in value) {
    return healthValueIsEnabled((value as { status?: unknown }).status);
  }
  return false;
};

function findHealthKey(
  service: ServiceCompatibilityEntry,
  healthServices: Record<string, unknown>,
): string | undefined {
  const candidates = [
    service.routeDir,
    service.serviceName,
    ...(HEALTH_KEY_ALIASES[service.routeDir] || []),
    ...(service.routeDir.startsWith("iam-") ? ["iam"] : []),
    ...(service.routeDir.startsWith("ec2-") ? ["ec2"] : []),
  ].map(normalizeServiceKey);
  return Object.keys(healthServices).find((key) => candidates.includes(normalizeServiceKey(key)));
}

export function getServiceAvailability(
  service: ServiceCompatibilityEntry,
  mode: AdapterMode | "unknown",
  healthStatus: EmulatorHealthStatus = "checking",
  healthServices: Record<string, unknown> = {},
): ServiceAvailability {
  if (healthStatus === "unreachable") {
    return {
      status: "unavailable",
      enabled: false,
      reason: "The emulator endpoint is unreachable.",
    };
  }

  if (mode === "unknown") {
    return {
      status: "unavailable",
      enabled: false,
      reason: "The active emulator has not been identified.",
    };
  }

  // LocalEmu advertises availability in its health map, but advertisement is not
  // evidence: the verified 1.2.0 build advertises 133 services, and the probe
  // proved 10 of them unusable. Health is therefore treated as necessary but not
  // sufficient — a service is enabled only when a runtime workflow was actually
  // recorded for it, and everything else stays explicitly unavailable.
  if (mode === AdapterMode.LOCALEMU) {
    // A probe-proven defect outranks the published tier.
    if (LOCALEMU_RUNTIME_UNAVAILABLE_SERVICES.has(service.routeDir)) {
      return {
        status: AdapterStatus.NOT_SUPPORTED,
        enabled: false,
        reason: LOCALEMU_RUNTIME_REASON,
      };
    }
    // No published tier means LocalEmu does not claim this service at all.
    const documentedStatus = getLocalEmuDocumentedStatus(service.routeDir);
    if (documentedStatus === undefined) {
      return {
        status: LOCALEMU_UNDOCUMENTED_SERVICES.has(service.routeDir)
          ? AdapterStatus.NOT_SUPPORTED
          : "unavailable",
        enabled: false,
        reason: LOCALEMU_NOT_DOCUMENTED_REASON,
      };
    }
    // The running build must also report the service as available, so a limited
    // `SERVICES=...` start still disables everything it did not load.
    const localEmuKey = findHealthKey(service, healthServices);
    if (localEmuKey === undefined) {
      return {
        status: "unavailable",
        enabled: false,
        reason: "LocalEmu has not reported this service capability in /_localemu/health.",
      };
    }
    if (healthStatus !== "checking" && !healthValueIsEnabled(healthServices[localEmuKey])) {
      return {
        status: "unavailable",
        enabled: false,
        reason: "LocalEmu reports this service as unavailable.",
      };
    }
    const isGood = LOCALEMU_GOOD_SERVICES.has(service.routeDir);
    return {
      status: documentedStatus,
      enabled: true,
      reason:
        documentedStatus === AdapterStatus.FULL
          ? "LocalEmu documents full emulation for this service (complete state management and CRUD)."
          : isGood
            ? "LocalEmu documents good emulation for this service; some advanced operations may return default responses."
            : "LocalEmu documents this service as API compatible: calls are accepted and return valid responses with mocked behaviour.",
    };
  }

  const compatibility = getAdapterStatusForMode(service, mode);

  // Static unsupported status is authoritative even when an emulator omits
  // the service from its health payload. This keeps unsupported entries from
  // becoming "unknown" merely because health reporting is incomplete.
  if (compatibility === AdapterStatus.NOT_SUPPORTED) {
    return {
      status: compatibility,
      enabled: false,
      reason: service.commonDifferentNote || `${mode} does not support this service.`,
    };
  }

  if (
    mode === AdapterMode.LOCALSTACK &&
    LOCALSTACK_RUNTIME_UNAVAILABLE_SERVICES.has(service.routeDir)
  ) {
    return {
      status: AdapterStatus.NOT_SUPPORTED,
      enabled: false,
      reason: LOCALSTACK_RUNTIME_REASON,
    };
  }

  if (
    mode === AdapterMode.MINSTACK &&
    MINISTACK_RUNTIME_UNAVAILABLE_SERVICES.has(service.routeDir)
  ) {
    return {
      status: AdapterStatus.NOT_SUPPORTED,
      enabled: false,
      reason: MINISTACK_RUNTIME_REASON,
    };
  }

  const matchingHealthKey = findHealthKey(service, healthServices);
  const healthEnabled =
    matchingHealthKey === undefined
      ? false
      : healthValueIsEnabled(healthServices[matchingHealthKey]);

  if (matchingHealthKey === undefined) {
    return {
      status: "unavailable",
      enabled: false,
      reason: "The emulator has not reported this service capability.",
    };
  }

  if (healthStatus !== "checking" && !healthEnabled) {
    return {
      status: "unavailable",
      enabled: false,
      reason: "The emulator reports this service as unavailable.",
    };
  }

  return {
    status: compatibility,
    enabled: true,
    reason:
      compatibility === AdapterStatus.PARTIAL
        ? service.commonDifferentNote || `${mode} provides partial support for this service.`
        : "Service is enabled by the active emulator.",
  };
}

export function findServiceCompatibility(route: string): ServiceCompatibilityEntry | undefined {
  const routeDir = route.replace(/^\//, "").split("/")[0];
  return SERVICE_REGISTRY.find((service) => service.routeDir === routeDir);
}
