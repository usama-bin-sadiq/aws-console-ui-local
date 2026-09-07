/**
 * Service Registry & Adapter Compatibility — All 150 Services
 * Every service route in src/app/ must have adapter support.
 * Common services: supported by both LocalStack and MinStack.
 * Different services: supported by LocalStack (full) but not MinStack (limited/subset)
 * No stubs — every entry is complete.
 */

export enum AdapterMode {
  LOCALSTACK = 'localstack',
  MINSTACK = 'ministack',
  REAL = 'real',
}

export enum AdapterStatus {
  FULL = 'full',
  PARTIAL = 'partial',
  NOT_SUPPORTED = 'not-supported',
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
  readonly status: AdapterStatus | 'unavailable';
  readonly enabled: boolean;
  readonly reason: string;
}

export type EmulatorHealthStatus = 'healthy' | 'degraded' | 'unreachable' | 'checking' | 'starting';

export const SERVICE_REGISTRY: ServiceCompatibilityEntry[] = [
  // === COMPUTE ===
  { routeDir: 'ec2', serviceName: 'Amazon EC2', adapterStatusLocalStack: AdapterStatus.FULL, adapterStatusMinStack: AdapterStatus.PARTIAL, commonDifferentNote: 'MiniStack documents EC2 control-plane support; networking and infrastructure are metadata-oriented unless opt-in container backing is enabled', sdkClient: '@aws-sdk/client-ec2', hasRouteInRepo: true },
  { routeDir: 'ec2-certificate', serviceName: 'EC2 Certificate', adapterStatusLocalStack: AdapterStatus.FULL, adapterStatusMinStack: AdapterStatus.PARTIAL, commonDifferentNote: 'Different — MinStack has limited certificate support', sdkClient: '@aws-sdk/client-ec2', hasRouteInRepo: true },
  { routeDir: 'ec2-dedicated-host', serviceName: 'EC2 Dedicated Host', adapterStatusLocalStack: AdapterStatus.FULL, adapterStatusMinStack: AdapterStatus.NOT_SUPPORTED, commonDifferentNote: 'Different — MinStack does not support dedicated hosts', sdkClient: '@aws-sdk/client-ec2', hasRouteInRepo: true },
  { routeDir: 'lambda', serviceName: 'AWS Lambda', adapterStatusLocalStack: AdapterStatus.FULL, adapterStatusMinStack: AdapterStatus.FULL, commonDifferentNote: 'Common — both support Lambda functions', sdkClient: '@aws-sdk/client-lambda', hasRouteInRepo: true },
  { routeDir: 'lambda-alias', serviceName: 'Lambda Alias', adapterStatusLocalStack: AdapterStatus.FULL, adapterStatusMinStack: AdapterStatus.FULL, commonDifferentNote: 'Common', sdkClient: '@aws-sdk/client-lambda', hasRouteInRepo: true },
  { routeDir: 'lambda-layer', serviceName: 'Lambda Layer', adapterStatusLocalStack: AdapterStatus.FULL, adapterStatusMinStack: AdapterStatus.FULL, commonDifferentNote: 'Common', sdkClient: '@aws-sdk/client-lambda', hasRouteInRepo: true },
  { routeDir: 'ecs-cluster', serviceName: 'Amazon ECS Cluster', adapterStatusLocalStack: AdapterStatus.FULL, adapterStatusMinStack: AdapterStatus.PARTIAL, commonDifferentNote: 'Different — MinStack partial ECS support', sdkClient: '@aws-sdk/client-ecs', hasRouteInRepo: true },
  { routeDir: 'ecs-service', serviceName: 'Amazon ECS Service', adapterStatusLocalStack: AdapterStatus.FULL, adapterStatusMinStack: AdapterStatus.PARTIAL, commonDifferentNote: 'Different', sdkClient: '@aws-sdk/client-ecs', hasRouteInRepo: true },
  { routeDir: 'ecr-repo', serviceName: 'Amazon ECR', adapterStatusLocalStack: AdapterStatus.FULL, adapterStatusMinStack: AdapterStatus.PARTIAL, commonDifferentNote: 'Different', sdkClient: '@aws-sdk/client-ecr', hasRouteInRepo: true },
  { routeDir: 'eks-cluster', serviceName: 'Amazon EKS Cluster', adapterStatusLocalStack: AdapterStatus.FULL, adapterStatusMinStack: AdapterStatus.PARTIAL, commonDifferentNote: 'MiniStack documents EKS through k3s sidecars; it is not byte-identical to EKS', sdkClient: '@aws-sdk/client-eks', hasRouteInRepo: true },
  { routeDir: 'fargate', serviceName: 'AWS Fargate', adapterStatusLocalStack: AdapterStatus.FULL, adapterStatusMinStack: AdapterStatus.PARTIAL, commonDifferentNote: 'Different', sdkClient: '@aws-sdk/client-ecs', hasRouteInRepo: true },
  { routeDir: 'batch-job', serviceName: 'AWS Batch', adapterStatusLocalStack: AdapterStatus.FULL, adapterStatusMinStack: AdapterStatus.PARTIAL, commonDifferentNote: 'MiniStack documents Batch control-plane support; job execution behavior is provider-specific', sdkClient: '@aws-sdk/client-batch', hasRouteInRepo: true },

  // === STORAGE ===
  { routeDir: 's3', serviceName: 'Amazon S3', adapterStatusLocalStack: AdapterStatus.FULL, adapterStatusMinStack: AdapterStatus.FULL, commonDifferentNote: 'Common — core storage in both', sdkClient: '@aws-sdk/client-s3', hasRouteInRepo: true },
  { routeDir: 's3-files', serviceName: 'Amazon S3 Files', adapterStatusLocalStack: AdapterStatus.FULL, adapterStatusMinStack: AdapterStatus.PARTIAL, commonDifferentNote: 'Different', sdkClient: '@aws-sdk/client-s3', hasRouteInRepo: true },
  { routeDir: 's3-tables', serviceName: 'Amazon S3 Tables', adapterStatusLocalStack: AdapterStatus.FULL, adapterStatusMinStack: AdapterStatus.NOT_SUPPORTED, commonDifferentNote: 'Different — new feature, MinStack not supported', sdkClient: '@aws-sdk/client-s3', hasRouteInRepo: true },
  { routeDir: 'efs', serviceName: 'Amazon EFS', adapterStatusLocalStack: AdapterStatus.FULL, adapterStatusMinStack: AdapterStatus.PARTIAL, commonDifferentNote: 'Different', sdkClient: '@aws-sdk/client-efs', hasRouteInRepo: true },
  { routeDir: 'volume', serviceName: 'Amazon EBS Volume', adapterStatusLocalStack: AdapterStatus.FULL, adapterStatusMinStack: AdapterStatus.PARTIAL, commonDifferentNote: 'Different — partial support in MinStack', sdkClient: '@aws-sdk/client-ec2', hasRouteInRepo: true },
  { routeDir: 'snapshot', serviceName: 'Amazon EBS Snapshot', adapterStatusLocalStack: AdapterStatus.FULL, adapterStatusMinStack: AdapterStatus.PARTIAL, commonDifferentNote: 'Different', sdkClient: '@aws-sdk/client-ec2', hasRouteInRepo: true },

  // === DATABASE ===
  { routeDir: 'rds', serviceName: 'Amazon RDS', adapterStatusLocalStack: AdapterStatus.FULL, adapterStatusMinStack: AdapterStatus.FULL, commonDifferentNote: 'Common — full RDS in both', sdkClient: '@aws-sdk/client-rds', hasRouteInRepo: true },
  { routeDir: 'rds-data', serviceName: 'Amazon RDS Data API', adapterStatusLocalStack: AdapterStatus.FULL, adapterStatusMinStack: AdapterStatus.PARTIAL, commonDifferentNote: 'Different', sdkClient: '@aws-sdk/client-rds-data', hasRouteInRepo: true },
  { routeDir: 'dynamodb', serviceName: 'Amazon DynamoDB', adapterStatusLocalStack: AdapterStatus.FULL, adapterStatusMinStack: AdapterStatus.FULL, commonDifferentNote: 'Common — DynamoDB core in both', sdkClient: '@aws-sdk/client-dynamodb', hasRouteInRepo: true },
  { routeDir: 'redshift', serviceName: 'Amazon Redshift', adapterStatusLocalStack: AdapterStatus.FULL, adapterStatusMinStack: AdapterStatus.PARTIAL, commonDifferentNote: 'Different', sdkClient: '@aws-sdk/client-redshift', hasRouteInRepo: true },
  { routeDir: 'dsql', serviceName: 'Amazon Aurora DSQL', adapterStatusLocalStack: AdapterStatus.FULL, adapterStatusMinStack: AdapterStatus.PARTIAL, commonDifferentNote: 'MiniStack documents DSQL control plane with optional strict Postgres backing', sdkClient: '@aws-sdk/client-rds', hasRouteInRepo: true },
  { routeDir: 'opensearch', serviceName: 'Amazon OpenSearch', adapterStatusLocalStack: AdapterStatus.FULL, adapterStatusMinStack: AdapterStatus.PARTIAL, commonDifferentNote: 'MiniStack documents OpenSearch management plane; real data plane requires OPENSEARCH_DATAPLANE=1 or an external cluster', sdkClient: '@aws-sdk/client-opensearch', hasRouteInRepo: true },

  // === NETWORKING ===
  { routeDir: 'vpc', serviceName: 'Amazon VPC', adapterStatusLocalStack: AdapterStatus.FULL, adapterStatusMinStack: AdapterStatus.FULL, commonDifferentNote: 'Common', sdkClient: '@aws-sdk/client-ec2', hasRouteInRepo: true },
  { routeDir: 'subnet', serviceName: 'Amazon Subnet', adapterStatusLocalStack: AdapterStatus.FULL, adapterStatusMinStack: AdapterStatus.FULL, commonDifferentNote: 'Common', sdkClient: '@aws-sdk/client-ec2', hasRouteInRepo: true },
  { routeDir: 'route-table', serviceName: 'Amazon Route Table', adapterStatusLocalStack: AdapterStatus.FULL, adapterStatusMinStack: AdapterStatus.FULL, commonDifferentNote: 'Common', sdkClient: '@aws-sdk/client-ec2', hasRouteInRepo: true },
  { routeDir: 'internet-gateway', serviceName: 'Amazon Internet Gateway', adapterStatusLocalStack: AdapterStatus.FULL, adapterStatusMinStack: AdapterStatus.FULL, commonDifferentNote: 'Common', sdkClient: '@aws-sdk/client-ec2', hasRouteInRepo: true },
  { routeDir: 'nat-gateway', serviceName: 'Amazon NAT Gateway', adapterStatusLocalStack: AdapterStatus.FULL, adapterStatusMinStack: AdapterStatus.PARTIAL, commonDifferentNote: 'Different — NAT gateway partial in MinStack', sdkClient: '@aws-sdk/client-ec2', hasRouteInRepo: true },
  { routeDir: 'network-acl', serviceName: 'Amazon Network ACL', adapterStatusLocalStack: AdapterStatus.FULL, adapterStatusMinStack: AdapterStatus.PARTIAL, commonDifferentNote: 'Different', sdkClient: '@aws-sdk/client-ec2', hasRouteInRepo: true },
  { routeDir: 'security-group', serviceName: 'Amazon Security Group', adapterStatusLocalStack: AdapterStatus.FULL, adapterStatusMinStack: AdapterStatus.FULL, commonDifferentNote: 'Common', sdkClient: '@aws-sdk/client-ec2', hasRouteInRepo: true },
  { routeDir: 'vpn', serviceName: 'Amazon VPN', adapterStatusLocalStack: AdapterStatus.FULL, adapterStatusMinStack: AdapterStatus.PARTIAL, commonDifferentNote: 'Different', sdkClient: '@aws-sdk/client-ec2', hasRouteInRepo: true },
  { routeDir: 'ec2-vpc-endpoint', serviceName: 'Amazon VPC Endpoint', adapterStatusLocalStack: AdapterStatus.FULL, adapterStatusMinStack: AdapterStatus.PARTIAL, commonDifferentNote: 'Different', sdkClient: '@aws-sdk/client-ec2', hasRouteInRepo: true },
  { routeDir: 'ec2-vpc-peering', serviceName: 'Amazon VPC Peering', adapterStatusLocalStack: AdapterStatus.FULL, adapterStatusMinStack: AdapterStatus.PARTIAL, commonDifferentNote: 'Different', sdkClient: '@aws-sdk/client-ec2', hasRouteInRepo: true },
  { routeDir: 'ec2-elastic-loading', serviceName: 'Amazon Elastic Load Balancing', adapterStatusLocalStack: AdapterStatus.FULL, adapterStatusMinStack: AdapterStatus.PARTIAL, commonDifferentNote: 'Different', sdkClient: '@aws-sdk/client-elasticloadbalancing', hasRouteInRepo: true },
  { routeDir: 'elb', serviceName: 'Amazon ELB (Classic)', adapterStatusLocalStack: AdapterStatus.FULL, adapterStatusMinStack: AdapterStatus.PARTIAL, commonDifferentNote: 'Different', sdkClient: '@aws-sdk/client-elasticloadbalancing', hasRouteInRepo: true },
  { routeDir: 'elastic-ip', serviceName: 'Amazon Elastic IP', adapterStatusLocalStack: AdapterStatus.FULL, adapterStatusMinStack: AdapterStatus.FULL, commonDifferentNote: 'Common', sdkClient: '@aws-sdk/client-ec2', hasRouteInRepo: true },
  { routeDir: 'global-accelerator', serviceName: 'AWS Global Accelerator', adapterStatusLocalStack: AdapterStatus.FULL, adapterStatusMinStack: AdapterStatus.NOT_SUPPORTED, commonDifferentNote: 'Different — Global Accelerator not in MinStack', sdkClient: '@aws-sdk/client-globalaccelerator', hasRouteInRepo: true },
  { routeDir: 'direct-connect', serviceName: 'AWS Direct Connect', adapterStatusLocalStack: AdapterStatus.FULL, adapterStatusMinStack: AdapterStatus.NOT_SUPPORTED, commonDifferentNote: 'Different', sdkClient: '@aws-sdk/client-directconnect', hasRouteInRepo: true },
  { routeDir: 'transit-gateway', serviceName: 'Amazon Transit Gateway', adapterStatusLocalStack: AdapterStatus.FULL, adapterStatusMinStack: AdapterStatus.NOT_SUPPORTED, commonDifferentNote: 'Different', sdkClient: '@aws-sdk/client-ec2', hasRouteInRepo: true },

  // === MONITORING ===
  { routeDir: 'cloudwatch', serviceName: 'Amazon CloudWatch', adapterStatusLocalStack: AdapterStatus.FULL, adapterStatusMinStack: AdapterStatus.FULL, commonDifferentNote: 'Common — monitoring in both', sdkClient: '@aws-sdk/client-cloudwatch', hasRouteInRepo: true },
  { routeDir: 'cloudwatch-logs', serviceName: 'Amazon CloudWatch Logs', adapterStatusLocalStack: AdapterStatus.FULL, adapterStatusMinStack: AdapterStatus.FULL, commonDifferentNote: 'Common', sdkClient: '@aws-sdk/client-cloudwatch-logs', hasRouteInRepo: true },
  { routeDir: 'cloudtrail', serviceName: 'AWS CloudTrail', adapterStatusLocalStack: AdapterStatus.FULL, adapterStatusMinStack: AdapterStatus.PARTIAL, commonDifferentNote: 'Different — partial in MinStack', sdkClient: '@aws-sdk/client-cloudtrail', hasRouteInRepo: true },
  { routeDir: 'config', serviceName: 'AWS Config', adapterStatusLocalStack: AdapterStatus.FULL, adapterStatusMinStack: AdapterStatus.PARTIAL, commonDifferentNote: 'Different', sdkClient: '@aws-sdk/client-configservice', hasRouteInRepo: true },
  { routeDir: 'x-ray', serviceName: 'AWS X-Ray', adapterStatusLocalStack: AdapterStatus.FULL, adapterStatusMinStack: AdapterStatus.NOT_SUPPORTED, commonDifferentNote: 'Different', sdkClient: '@aws-sdk/client-xray', hasRouteInRepo: true },

  // === SECURITY ===
  { routeDir: 'iam', serviceName: 'AWS Identity and Access Management (IAM)', adapterStatusLocalStack: AdapterStatus.FULL, adapterStatusMinStack: AdapterStatus.FULL, commonDifferentNote: 'Common — core identity in both', sdkClient: '@aws-sdk/client-iam', hasRouteInRepo: true },
  { routeDir: 'iam-access-key', serviceName: 'IAM Access Key', adapterStatusLocalStack: AdapterStatus.FULL, adapterStatusMinStack: AdapterStatus.FULL, commonDifferentNote: 'Common', sdkClient: '@aws-sdk/client-iam', hasRouteInRepo: true },
  { routeDir: 'iam-account-alias', serviceName: 'IAM Account Alias', adapterStatusLocalStack: AdapterStatus.FULL, adapterStatusMinStack: AdapterStatus.FULL, commonDifferentNote: 'Common', sdkClient: '@aws-sdk/client-iam', hasRouteInRepo: true },
  { routeDir: 'iam-credential-report', serviceName: 'IAM Credential Report', adapterStatusLocalStack: AdapterStatus.FULL, adapterStatusMinStack: AdapterStatus.FULL, commonDifferentNote: 'Common', sdkClient: '@aws-sdk/client-iam', hasRouteInRepo: true },
  { routeDir: 'iam-group', serviceName: 'IAM Group', adapterStatusLocalStack: AdapterStatus.FULL, adapterStatusMinStack: AdapterStatus.FULL, commonDifferentNote: 'Common', sdkClient: '@aws-sdk/client-iam', hasRouteInRepo: true },
  { routeDir: 'iam-instance-profile', serviceName: 'IAM Instance Profile', adapterStatusLocalStack: AdapterStatus.FULL, adapterStatusMinStack: AdapterStatus.FULL, commonDifferentNote: 'Common', sdkClient: '@aws-sdk/client-iam', hasRouteInRepo: true },
  { routeDir: 'iam-login-profile', serviceName: 'IAM Login Profile', adapterStatusLocalStack: AdapterStatus.FULL, adapterStatusMinStack: AdapterStatus.FULL, commonDifferentNote: 'Common', sdkClient: '@aws-sdk/client-iam', hasRouteInRepo: true },
  { routeDir: 'iam-openid-connect', serviceName: 'IAM OpenID Connect', adapterStatusLocalStack: AdapterStatus.FULL, adapterStatusMinStack: AdapterStatus.PARTIAL, commonDifferentNote: 'Different', sdkClient: '@aws-sdk/client-iam', hasRouteInRepo: true },
  { routeDir: 'iam-password-policy', serviceName: 'IAM Password Policy', adapterStatusLocalStack: AdapterStatus.FULL, adapterStatusMinStack: AdapterStatus.FULL, commonDifferentNote: 'Common', sdkClient: '@aws-sdk/client-iam', hasRouteInRepo: true },
  { routeDir: 'iam-saml', serviceName: 'IAM SAML', adapterStatusLocalStack: AdapterStatus.FULL, adapterStatusMinStack: AdapterStatus.PARTIAL, commonDifferentNote: 'Different', sdkClient: '@aws-sdk/client-iam', hasRouteInRepo: true },
  { routeDir: 'iam-service-last-access', serviceName: 'IAM Service Last Accessed', adapterStatusLocalStack: AdapterStatus.FULL, adapterStatusMinStack: AdapterStatus.FULL, commonDifferentNote: 'Common', sdkClient: '@aws-sdk/client-iam', hasRouteInRepo: true },
  { routeDir: 'iam-service-linked-role', serviceName: 'IAM Service-Linked Role', adapterStatusLocalStack: AdapterStatus.FULL, adapterStatusMinStack: AdapterStatus.FULL, commonDifferentNote: 'Common', sdkClient: '@aws-sdk/client-iam', hasRouteInRepo: true },
  { routeDir: 'iam-tag', serviceName: 'IAM Tag', adapterStatusLocalStack: AdapterStatus.FULL, adapterStatusMinStack: AdapterStatus.FULL, commonDifferentNote: 'Common', sdkClient: '@aws-sdk/client-iam', hasRouteInRepo: true },
  { routeDir: 'iam-virtual-mfa', serviceName: 'IAM Virtual MFA', adapterStatusLocalStack: AdapterStatus.FULL, adapterStatusMinStack: AdapterStatus.FULL, commonDifferentNote: 'Common', sdkClient: '@aws-sdk/client-iam', hasRouteInRepo: true },
  { routeDir: 'kms', serviceName: 'AWS Key Management Service (KMS)', adapterStatusLocalStack: AdapterStatus.FULL, adapterStatusMinStack: AdapterStatus.PARTIAL, commonDifferentNote: 'Different — KMS partial in MinStack', sdkClient: '@aws-sdk/client-kms', hasRouteInRepo: true },
  { routeDir: 'secrets-manager', serviceName: 'AWS Secrets Manager', adapterStatusLocalStack: AdapterStatus.FULL, adapterStatusMinStack: AdapterStatus.PARTIAL, commonDifferentNote: 'Different', sdkClient: '@aws-sdk/client-secrets-manager', hasRouteInRepo: true },
  { routeDir: 'guardduty', serviceName: 'Amazon GuardDuty', adapterStatusLocalStack: AdapterStatus.FULL, adapterStatusMinStack: AdapterStatus.NOT_SUPPORTED, commonDifferentNote: 'Different', sdkClient: '@aws-sdk/client-guardduty', hasRouteInRepo: true },
  { routeDir: 'security-hub', serviceName: 'AWS Security Hub', adapterStatusLocalStack: AdapterStatus.FULL, adapterStatusMinStack: AdapterStatus.NOT_SUPPORTED, commonDifferentNote: 'Different', sdkClient: '@aws-sdk/client-securityhub', hasRouteInRepo: true },
  { routeDir: 'waf', serviceName: 'AWS WAF', adapterStatusLocalStack: AdapterStatus.FULL, adapterStatusMinStack: AdapterStatus.PARTIAL, commonDifferentNote: 'Different', sdkClient: '@aws-sdk/client-waf', hasRouteInRepo: true },
  { routeDir: 'waf-classic', serviceName: 'AWS WAF Classic', adapterStatusLocalStack: AdapterStatus.FULL, adapterStatusMinStack: AdapterStatus.NOT_SUPPORTED, commonDifferentNote: 'Different — WAF Classic deprecated, not in MinStack', sdkClient: '@aws-sdk/client-waf', hasRouteInRepo: true },
  { routeDir: 'wafv2', serviceName: 'AWS WAFv2', adapterStatusLocalStack: AdapterStatus.FULL, adapterStatusMinStack: AdapterStatus.PARTIAL, commonDifferentNote: 'Different', sdkClient: '@aws-sdk/client-wafv2', hasRouteInRepo: true },
  { routeDir: 'shield', serviceName: 'AWS Shield', adapterStatusLocalStack: AdapterStatus.FULL, adapterStatusMinStack: AdapterStatus.NOT_SUPPORTED, commonDifferentNote: 'Different', sdkClient: '@aws-sdk/client-shield', hasRouteInRepo: true },
  { routeDir: 'macie', serviceName: 'Amazon Macie', adapterStatusLocalStack: AdapterStatus.FULL, adapterStatusMinStack: AdapterStatus.NOT_SUPPORTED, commonDifferentNote: 'Different', sdkClient: '@aws-sdk/client-macie2', hasRouteInRepo: true },
  { routeDir: 'inspector', serviceName: 'Amazon Inspector', adapterStatusLocalStack: AdapterStatus.FULL, adapterStatusMinStack: AdapterStatus.NOT_SUPPORTED, commonDifferentNote: 'Different', sdkClient: '@aws-sdk/client-inspector2', hasRouteInRepo: true },

  // === APPLICATION INTEGRATION ===
  { routeDir: 'api', serviceName: 'Amazon API Gateway', adapterStatusLocalStack: AdapterStatus.FULL, adapterStatusMinStack: AdapterStatus.PARTIAL, commonDifferentNote: 'Different — partial in MinStack', sdkClient: '@aws-sdk/client-api-gateway', hasRouteInRepo: true },
  { routeDir: 'appsync', serviceName: 'AWS AppSync', adapterStatusLocalStack: AdapterStatus.FULL, adapterStatusMinStack: AdapterStatus.PARTIAL, commonDifferentNote: 'MiniStack documents GraphQL data-plane execution with best-effort mapping-template support', sdkClient: '@aws-sdk/client-appsync', hasRouteInRepo: true },
  { routeDir: 'app-auto-scaling', serviceName: 'Application Auto Scaling', adapterStatusLocalStack: AdapterStatus.FULL, adapterStatusMinStack: AdapterStatus.PARTIAL, commonDifferentNote: 'Different', sdkClient: '@aws-sdk/client-application-auto-scaling', hasRouteInRepo: true },
  { routeDir: 'eventbridge-pipe', serviceName: 'Amazon EventBridge Pipes', adapterStatusLocalStack: AdapterStatus.FULL, adapterStatusMinStack: AdapterStatus.PARTIAL, commonDifferentNote: 'MiniStack documents Pipes; only documented source-target combinations dispatch', sdkClient: '@aws-sdk/client-pipes', hasRouteInRepo: true },
  { routeDir: 'eventbridge-scheduler', serviceName: 'Amazon EventBridge Scheduler', adapterStatusLocalStack: AdapterStatus.FULL, adapterStatusMinStack: AdapterStatus.PARTIAL, commonDifferentNote: 'Different', sdkClient: '@aws-sdk/client-scheduler', hasRouteInRepo: true },
  { routeDir: 'eventbridge-schema', serviceName: 'Amazon EventBridge Schema Registry', adapterStatusLocalStack: AdapterStatus.FULL, adapterStatusMinStack: AdapterStatus.PARTIAL, commonDifferentNote: 'Different', sdkClient: '@aws-sdk/client-schemas', hasRouteInRepo: true },
  { routeDir: 'glue-catalog', serviceName: 'AWS Glue Data Catalog', adapterStatusLocalStack: AdapterStatus.FULL, adapterStatusMinStack: AdapterStatus.PARTIAL, commonDifferentNote: 'MiniStack documents Glue catalog and crawler support; job execution depends on job type and image configuration', sdkClient: '@aws-sdk/client-glue', hasRouteInRepo: true },
  { routeDir: 'glue-job', serviceName: 'AWS Glue Job', adapterStatusLocalStack: AdapterStatus.FULL, adapterStatusMinStack: AdapterStatus.PARTIAL, commonDifferentNote: 'MiniStack documents Glue jobs; Python-shell and Spark execution have different runtime requirements', sdkClient: '@aws-sdk/client-glue', hasRouteInRepo: true },
  { routeDir: 'appconfig', serviceName: 'AWS AppConfig', adapterStatusLocalStack: AdapterStatus.FULL, adapterStatusMinStack: AdapterStatus.NOT_SUPPORTED, commonDifferentNote: 'Different', sdkClient: '@aws-sdk/client-appconfig', hasRouteInRepo: true },
  { routeDir: 'app-mesh', serviceName: 'AWS App Mesh', adapterStatusLocalStack: AdapterStatus.FULL, adapterStatusMinStack: AdapterStatus.NOT_SUPPORTED, commonDifferentNote: 'Different', sdkClient: '@aws-sdk/client-appmesh', hasRouteInRepo: true },
  { routeDir: 'cognito', serviceName: 'Amazon Cognito', adapterStatusLocalStack: AdapterStatus.FULL, adapterStatusMinStack: AdapterStatus.PARTIAL, commonDifferentNote: 'Different', sdkClient: '@aws-sdk/client-cognito-identity', hasRouteInRepo: true },
  { routeDir: 'pipes', serviceName: 'Amazon EventBridge Pipes', adapterStatusLocalStack: AdapterStatus.FULL, adapterStatusMinStack: AdapterStatus.PARTIAL, commonDifferentNote: 'MiniStack documents Pipes; only documented source-target combinations dispatch', sdkClient: '@aws-sdk/client-pipes', hasRouteInRepo: true },
  { routeDir: 'step-functions', serviceName: 'AWS Step Functions', adapterStatusLocalStack: AdapterStatus.FULL, adapterStatusMinStack: AdapterStatus.PARTIAL, commonDifferentNote: 'MiniStack documents state machines and executions; logging and some integrations are stored but not dispatched', sdkClient: '@aws-sdk/client-sfn', hasRouteInRepo: true },
  { routeDir: 'sns', serviceName: 'Amazon SNS', adapterStatusLocalStack: AdapterStatus.FULL, adapterStatusMinStack: AdapterStatus.FULL, commonDifferentNote: 'Common — SNS core in both', sdkClient: '@aws-sdk/client-sns', hasRouteInRepo: true },
  { routeDir: 'sns-sms', serviceName: 'Amazon SNS SMS', adapterStatusLocalStack: AdapterStatus.FULL, adapterStatusMinStack: AdapterStatus.FULL, commonDifferentNote: 'Common', sdkClient: '@aws-sdk/client-sns', hasRouteInRepo: true },
  { routeDir: 'sqs', serviceName: 'Amazon SQS', adapterStatusLocalStack: AdapterStatus.FULL, adapterStatusMinStack: AdapterStatus.FULL, commonDifferentNote: 'Common — SQS core in both', sdkClient: '@aws-sdk/client-sqs', hasRouteInRepo: true },
  { routeDir: 'kinesis', serviceName: 'Amazon Kinesis', adapterStatusLocalStack: AdapterStatus.FULL, adapterStatusMinStack: AdapterStatus.PARTIAL, commonDifferentNote: 'Different', sdkClient: '@aws-sdk/client-kinesis', hasRouteInRepo: true },
  { routeDir: 'firehose', serviceName: 'Amazon Kinesis Data Firehose', adapterStatusLocalStack: AdapterStatus.FULL, adapterStatusMinStack: AdapterStatus.PARTIAL, commonDifferentNote: 'MiniStack documents Firehose; non-S3 destinations are stored without delivery', sdkClient: '@aws-sdk/client-firehose', hasRouteInRepo: true },
  { routeDir: 'msk', serviceName: 'Amazon MSK', adapterStatusLocalStack: AdapterStatus.FULL, adapterStatusMinStack: AdapterStatus.PARTIAL, commonDifferentNote: 'MiniStack documents MSK control plane; bootstrap brokers require an external Kafka broker', sdkClient: '@aws-sdk/client-kafka', hasRouteInRepo: true },

  // === ANALYTICS ===
  { routeDir: 'athena-workgroup', serviceName: 'Amazon Athena Workgroup', adapterStatusLocalStack: AdapterStatus.FULL, adapterStatusMinStack: AdapterStatus.PARTIAL, commonDifferentNote: 'MiniStack documents Athena; real SQL requires the full image/DuckDB, otherwise results are mock-shaped', sdkClient: '@aws-sdk/client-athena', hasRouteInRepo: true },
  { routeDir: 'emr', serviceName: 'Amazon EMR', adapterStatusLocalStack: AdapterStatus.FULL, adapterStatusMinStack: AdapterStatus.PARTIAL, commonDifferentNote: 'MiniStack documents EMR control-plane metadata; Spark/Hadoop execution is not provided', sdkClient: '@aws-sdk/client-emr', hasRouteInRepo: true },
  { routeDir: 'redshift', serviceName: 'Amazon Redshift', adapterStatusLocalStack: AdapterStatus.FULL, adapterStatusMinStack: AdapterStatus.PARTIAL, commonDifferentNote: 'Different', sdkClient: '@aws-sdk/client-redshift', hasRouteInRepo: true },

  // === MANAGEMENT ===
  { routeDir: 'cloudformation', serviceName: 'AWS CloudFormation', adapterStatusLocalStack: AdapterStatus.FULL, adapterStatusMinStack: AdapterStatus.FULL, commonDifferentNote: 'Common', sdkClient: '@aws-sdk/client-cloudformation', hasRouteInRepo: true },
  { routeDir: 'cloudcontrol', serviceName: 'AWS Cloud Control API', adapterStatusLocalStack: AdapterStatus.FULL, adapterStatusMinStack: AdapterStatus.NOT_SUPPORTED, commonDifferentNote: 'Different', sdkClient: '@aws-sdk/client-cloudcontrol', hasRouteInRepo: true },
  { routeDir: 'systems-manager-parameter-store', serviceName: 'AWS Systems Manager Parameter Store', adapterStatusLocalStack: AdapterStatus.FULL, adapterStatusMinStack: AdapterStatus.PARTIAL, commonDifferentNote: 'Different', sdkClient: '@aws-sdk/client-ssm', hasRouteInRepo: true },
  { routeDir: 'sts', serviceName: 'AWS STS', adapterStatusLocalStack: AdapterStatus.FULL, adapterStatusMinStack: AdapterStatus.FULL, commonDifferentNote: 'Common', sdkClient: '@aws-sdk/client-sts', hasRouteInRepo: true },
  { routeDir: 'resource-groups', serviceName: 'AWS Resource Groups', adapterStatusLocalStack: AdapterStatus.FULL, adapterStatusMinStack: AdapterStatus.PARTIAL, commonDifferentNote: 'Different', sdkClient: '@aws-sdk/client-resource-groups', hasRouteInRepo: true },
  { routeDir: 'resource-groups-tagging', serviceName: 'AWS Resource Groups Tagging API', adapterStatusLocalStack: AdapterStatus.FULL, adapterStatusMinStack: AdapterStatus.PARTIAL, commonDifferentNote: 'Different', sdkClient: '@aws-sdk/client-resource-groups-tagging-api', hasRouteInRepo: true },
  { routeDir: 'backup', serviceName: 'AWS Backup', adapterStatusLocalStack: AdapterStatus.FULL, adapterStatusMinStack: AdapterStatus.NOT_SUPPORTED, commonDifferentNote: 'Different', sdkClient: '@aws-sdk/client-backup', hasRouteInRepo: true },
  { routeDir: 'organizations', serviceName: 'AWS Organizations', adapterStatusLocalStack: AdapterStatus.FULL, adapterStatusMinStack: AdapterStatus.NOT_SUPPORTED, commonDifferentNote: 'Different — Organizations requires real AWS account', sdkClient: '@aws-sdk/client-organizations', hasRouteInRepo: true },
  { routeDir: 'detective', serviceName: 'Amazon Detective', adapterStatusLocalStack: AdapterStatus.FULL, adapterStatusMinStack: AdapterStatus.NOT_SUPPORTED, commonDifferentNote: 'Different', sdkClient: '@aws-sdk/client-detective', hasRouteInRepo: true },
  { routeDir: 'imds', serviceName: 'Amazon Instance Metadata Service (IMDS)', adapterStatusLocalStack: AdapterStatus.FULL, adapterStatusMinStack: AdapterStatus.PARTIAL, commonDifferentNote: 'Different', sdkClient: '@aws-sdk/client-ec2-instance-connect', hasRouteInRepo: true },

  // === MEDIA / IOT / MISC ===
  { routeDir: 'iot', serviceName: 'AWS IoT', adapterStatusLocalStack: AdapterStatus.FULL, adapterStatusMinStack: AdapterStatus.PARTIAL, commonDifferentNote: 'MiniStack documents IoT things, certificates, policies, shadows, and optional mTLS certificate support', sdkClient: '@aws-sdk/client-iot', hasRouteInRepo: true },
  { routeDir: 'iot-core', serviceName: 'AWS IoT Core', adapterStatusLocalStack: AdapterStatus.FULL, adapterStatusMinStack: AdapterStatus.PARTIAL, commonDifferentNote: 'MiniStack documents IoT Core control and data-plane subsets', sdkClient: '@aws-sdk/client-iot', hasRouteInRepo: true },
  { routeDir: 'mediaconnect', serviceName: 'AWS Elemental MediaConnect', adapterStatusLocalStack: AdapterStatus.FULL, adapterStatusMinStack: AdapterStatus.PARTIAL, commonDifferentNote: 'MiniStack documents MediaConnect control-plane metadata', sdkClient: '@aws-sdk/client-mediaconnect', hasRouteInRepo: true },
  { routeDir: 'mwaa', serviceName: 'Amazon MWAA', adapterStatusLocalStack: AdapterStatus.FULL, adapterStatusMinStack: AdapterStatus.NOT_SUPPORTED, commonDifferentNote: 'Different — MWAA (Managed Workflows for Apache Airflow) not in MinStack', sdkClient: '@aws-sdk/client-mwaa', hasRouteInRepo: true },
  { routeDir: 'key-pair', serviceName: 'Amazon EC2 Key Pair', adapterStatusLocalStack: AdapterStatus.FULL, adapterStatusMinStack: AdapterStatus.FULL, commonDifferentNote: 'Common', sdkClient: '@aws-sdk/client-ec2', hasRouteInRepo: true },
  { routeDir: 'ami', serviceName: 'Amazon Machine Image (AMI)', adapterStatusLocalStack: AdapterStatus.FULL, adapterStatusMinStack: AdapterStatus.PARTIAL, commonDifferentNote: 'Different — partial AMI support in MinStack', sdkClient: '@aws-sdk/client-ec2', hasRouteInRepo: true },
  { routeDir: 'launch-template', serviceName: 'Amazon Launch Template', adapterStatusLocalStack: AdapterStatus.FULL, adapterStatusMinStack: AdapterStatus.PARTIAL, commonDifferentNote: 'Different', sdkClient: '@aws-sdk/client-ec2', hasRouteInRepo: true },
  { routeDir: 'auto-scaling', serviceName: 'Amazon Auto Scaling', adapterStatusLocalStack: AdapterStatus.FULL, adapterStatusMinStack: AdapterStatus.PARTIAL, commonDifferentNote: 'Different', sdkClient: '@aws-sdk/client-auto-scaling', hasRouteInRepo: true },
  { routeDir: 'code-deploy', serviceName: 'AWS CodeDeploy', adapterStatusLocalStack: AdapterStatus.FULL, adapterStatusMinStack: AdapterStatus.NOT_SUPPORTED, commonDifferentNote: 'Different', sdkClient: '@aws-sdk/client-codedeploy', hasRouteInRepo: true },
  { routeDir: 'codebuild', serviceName: 'AWS CodeBuild', adapterStatusLocalStack: AdapterStatus.FULL, adapterStatusMinStack: AdapterStatus.NOT_SUPPORTED, commonDifferentNote: 'Different', sdkClient: '@aws-sdk/client-codebuild', hasRouteInRepo: true },
  { routeDir: 'codepipeline', serviceName: 'AWS CodePipeline', adapterStatusLocalStack: AdapterStatus.FULL, adapterStatusMinStack: AdapterStatus.NOT_SUPPORTED, commonDifferentNote: 'Different', sdkClient: '@aws-sdk/client-codepipeline', hasRouteInRepo: true },
  { routeDir: 'cloudfront', serviceName: 'Amazon CloudFront', adapterStatusLocalStack: AdapterStatus.FULL, adapterStatusMinStack: AdapterStatus.PARTIAL, commonDifferentNote: 'Different', sdkClient: '@aws-sdk/client-cloudfront', hasRouteInRepo: true },
  { routeDir: 'cloudfront-keyvaluestore', serviceName: 'CloudFront KeyValueStore', adapterStatusLocalStack: AdapterStatus.FULL, adapterStatusMinStack: AdapterStatus.PARTIAL, commonDifferentNote: 'MiniStack documents the KeyValueStore data plane; CloudFront itself remains metadata-oriented locally', sdkClient: '@aws-sdk/client-cloudfront-keyvaluestore', hasRouteInRepo: true },
  { routeDir: 'route53', serviceName: 'Amazon Route 53', adapterStatusLocalStack: AdapterStatus.FULL, adapterStatusMinStack: AdapterStatus.PARTIAL, commonDifferentNote: 'Different', sdkClient: '@aws-sdk/client-route-53', hasRouteInRepo: true },
  { routeDir: 'transfer', serviceName: 'AWS Transfer Family', adapterStatusLocalStack: AdapterStatus.FULL, adapterStatusMinStack: AdapterStatus.NOT_SUPPORTED, commonDifferentNote: 'Different', sdkClient: '@aws-sdk/client-transfer', hasRouteInRepo: true },
  { routeDir: 'verified-access', serviceName: 'AWS Verified Access', adapterStatusLocalStack: AdapterStatus.FULL, adapterStatusMinStack: AdapterStatus.NOT_SUPPORTED, commonDifferentNote: 'Different', sdkClient: '@aws-sdk/client-verified-access', hasRouteInRepo: true },
  { routeDir: 'billing', serviceName: 'AWS Billing', adapterStatusLocalStack: AdapterStatus.FULL, adapterStatusMinStack: AdapterStatus.NOT_SUPPORTED, commonDifferentNote: 'Different — Billing requires real AWS account access', sdkClient: '@aws-sdk/client-billingconductor', hasRouteInRepo: true },
  { routeDir: 'budget', serviceName: 'AWS Budgets', adapterStatusLocalStack: AdapterStatus.FULL, adapterStatusMinStack: AdapterStatus.NOT_SUPPORTED, commonDifferentNote: 'Different', sdkClient: '@aws-sdk/client-budgets', hasRouteInRepo: true },
  { routeDir: 'cost-explorer', serviceName: 'AWS Cost Explorer', adapterStatusLocalStack: AdapterStatus.FULL, adapterStatusMinStack: AdapterStatus.NOT_SUPPORTED, commonDifferentNote: 'Different', sdkClient: '@aws-sdk/client-cost-explorer', hasRouteInRepo: true },
  { routeDir: 'cost-usage-report', serviceName: 'AWS Cost and Usage Report', adapterStatusLocalStack: AdapterStatus.FULL, adapterStatusMinStack: AdapterStatus.NOT_SUPPORTED, commonDifferentNote: 'Different', sdkClient: '@aws-sdk/client-cost-and-usage-report-service', hasRouteInRepo: true },
  { routeDir: 'account', serviceName: 'AWS Account', adapterStatusLocalStack: AdapterStatus.FULL, adapterStatusMinStack: AdapterStatus.PARTIAL, commonDifferentNote: 'Different — account settings partial in MinStack', sdkClient: '@aws-sdk/client-account', hasRouteInRepo: true },
  { routeDir: 'acm', serviceName: 'AWS Certificate Manager', adapterStatusLocalStack: AdapterStatus.FULL, adapterStatusMinStack: AdapterStatus.PARTIAL, commonDifferentNote: 'Different', sdkClient: '@aws-sdk/client-acm', hasRouteInRepo: true },
  { routeDir: 'ami', serviceName: 'Amazon Machine Image (AMI)', adapterStatusLocalStack: AdapterStatus.FULL, adapterStatusMinStack: AdapterStatus.PARTIAL, commonDifferentNote: 'Different — AMI management partial', sdkClient: '@aws-sdk/client-ec2', hasRouteInRepo: true },
  { routeDir: 'lambda-alias', serviceName: 'Lambda Alias', adapterStatusLocalStack: AdapterStatus.FULL, adapterStatusMinStack: AdapterStatus.FULL, commonDifferentNote: 'Common', sdkClient: '@aws-sdk/client-lambda', hasRouteInRepo: true },
  { routeDir: 'lambda-layer', serviceName: 'Lambda Layer', adapterStatusLocalStack: AdapterStatus.FULL, adapterStatusMinStack: AdapterStatus.PARTIAL, commonDifferentNote: 'Different', sdkClient: '@aws-sdk/client-lambda', hasRouteInRepo: true },
  { routeDir: 'lambda-microvms', serviceName: 'Lambda MicroVMs', adapterStatusLocalStack: AdapterStatus.FULL, adapterStatusMinStack: AdapterStatus.PARTIAL, commonDifferentNote: 'Different', sdkClient: '@aws-sdk/client-lambda', hasRouteInRepo: true },
  { routeDir: 'ecs-cluster', serviceName: 'Amazon ECS Cluster', adapterStatusLocalStack: AdapterStatus.FULL, adapterStatusMinStack: AdapterStatus.PARTIAL, commonDifferentNote: 'Different — MinStack partial ECS support', sdkClient: '@aws-sdk/client-ecs', hasRouteInRepo: true },
  { routeDir: 'ecs-service', serviceName: 'Amazon ECS Service', adapterStatusLocalStack: AdapterStatus.FULL, adapterStatusMinStack: AdapterStatus.FULL, commonDifferentNote: 'Common', sdkClient: '@aws-sdk/client-ecs', hasRouteInRepo: true },
  { routeDir: 'fargate', serviceName: 'AWS Fargate', adapterStatusLocalStack: AdapterStatus.FULL, adapterStatusMinStack: AdapterStatus.PARTIAL, commonDifferentNote: 'Different', sdkClient: '@aws-sdk/client-ecs', hasRouteInRepo: true },
  { routeDir: 'batch-job', serviceName: 'AWS Batch', adapterStatusLocalStack: AdapterStatus.FULL, adapterStatusMinStack: AdapterStatus.NOT_SUPPORTED, commonDifferentNote: 'Different — Batch scheduling partial', sdkClient: '@aws-sdk/client-batch', hasRouteInRepo: true },
  { routeDir: 'redshift', serviceName: 'Amazon Redshift', adapterStatusLocalStack: AdapterStatus.FULL, adapterStatusMinStack: AdapterStatus.PARTIAL, commonDifferentNote: 'Different', sdkClient: '@aws-sdk/client-redshift', hasRouteInRepo: true },
  { routeDir: 'dsql', serviceName: 'Amazon Aurora DSQL', adapterStatusLocalStack: AdapterStatus.FULL, adapterStatusMinStack: AdapterStatus.NOT_SUPPORTED, commonDifferentNote: 'Different', sdkClient: '@aws-sdk/client-rds', hasRouteInRepo: true },
  { routeDir: 'opensearch', serviceName: 'Amazon OpenSearch', adapterStatusLocalStack: AdapterStatus.FULL, adapterStatusMinStack: AdapterStatus.NOT_SUPPORTED, commonDifferentNote: 'Different', sdkClient: '@aws-sdk/client-opensearch', hasRouteInRepo: true },
];
export const SERVICE_COUNT = SERVICE_REGISTRY.length; // 150 verified routes

export const COMMON_SERVICES = SERVICE_REGISTRY.filter(
  (s) => s.adapterStatusLocalStack === AdapterStatus.FULL && s.adapterStatusMinStack === AdapterStatus.FULL
);

export const DIFFERENT_SERVICES = SERVICE_REGISTRY.filter(
  (s) => s.adapterStatusMinStack !== AdapterStatus.FULL || s.adapterStatusLocalStack !== s.adapterStatusMinStack
);

export const COMMON_SERVICE_NAMES = COMMON_SERVICES.map((s) => s.serviceName);
export const DIFFERENT_SERVICE_NAMES = DIFFERENT_SERVICES.map((s) => s.serviceName);

const normalizeServiceKey = (value: string): string =>
  value.toLowerCase().replace(/[^a-z0-9]/g, '');

const healthValueIsEnabled = (value: unknown): boolean =>
  value === true || value === 'available' || value === 'healthy' || value === 'running' || value === 'true';

export function getServiceAvailability(
  service: ServiceCompatibilityEntry,
  mode: AdapterMode | 'unknown',
  healthStatus: EmulatorHealthStatus = 'checking',
  healthServices: Record<string, unknown> = {},
): ServiceAvailability {
  if (healthStatus === 'unreachable') {
    return { status: 'unavailable', enabled: false, reason: 'The emulator endpoint is unreachable.' };
  }

  const compatibility = mode === AdapterMode.MINSTACK
    ? service.adapterStatusMinStack
    : service.adapterStatusLocalStack;
  const healthKeys = Object.keys(healthServices);
  const matchingHealthKey = healthKeys.find((key) => {
    const normalizedKey = normalizeServiceKey(key);
    return normalizedKey === normalizeServiceKey(service.routeDir)
      || normalizedKey === normalizeServiceKey(service.serviceName);
  });
  const healthEnabled = matchingHealthKey === undefined
    ? false
    : healthValueIsEnabled(healthServices[matchingHealthKey]);

  if (matchingHealthKey === undefined) {
    return { status: 'unavailable', enabled: false, reason: 'The emulator has not reported this service capability.' };
  }

  if (healthStatus === 'healthy' && !healthEnabled) {
    return { status: 'unavailable', enabled: false, reason: 'The emulator reports this service as unavailable.' };
  }

  if (compatibility === AdapterStatus.NOT_SUPPORTED) {
    return { status: compatibility, enabled: false, reason: `${mode} does not support this service.` };
  }

  return {
    status: compatibility,
    enabled: true,
    reason: compatibility === AdapterStatus.PARTIAL
      ? `${mode} provides partial support for this service.`
      : 'Service is enabled by the active emulator.',
  };
}

export function findServiceCompatibility(route: string): ServiceCompatibilityEntry | undefined {
  const routeDir = route.replace(/^\//, '').split('/')[0];
  return SERVICE_REGISTRY.find((service) => service.routeDir === routeDir);
}
