export interface ServiceStatus {
  name: string;
  status: "available" | "unavailable" | "partial";
  displayName: string;
  category: string;
  icon: string;
}

export interface AwsError {
  name: string;
  message: string;
  $metadata?: { httpStatusCode?: number };
}

export const AWS_SERVICES: ServiceStatus[] = [
  { name: "s3", status: "available", displayName: "S3", category: "Storage", icon: "bucket" },
  {
    name: "dynamodb",
    status: "available",
    displayName: "DynamoDB",
    category: "Database",
    icon: "database",
  },
  {
    name: "lambda",
    status: "available",
    displayName: "Lambda",
    category: "Compute",
    icon: "function",
  },
  { name: "sqs", status: "available", displayName: "SQS", category: "Messaging", icon: "queue" },
  {
    name: "sns",
    status: "available",
    displayName: "SNS",
    category: "Messaging",
    icon: "notification",
  },
  { name: "iam", status: "available", displayName: "IAM", category: "Security", icon: "shield" },
  { name: "ec2", status: "available", displayName: "EC2", category: "Compute", icon: "server" },
  { name: "rds", status: "available", displayName: "RDS", category: "Database", icon: "database" },
  {
    name: "cloudwatch",
    status: "available",
    displayName: "CloudWatch",
    category: "Monitoring",
    icon: "chart",
  },
  {
    name: "cloudformation",
    status: "available",
    displayName: "CloudFormation",
    category: "Management",
    icon: "stack",
  },
  { name: "kms", status: "available", displayName: "KMS", category: "Security", icon: "key" },
  {
    name: "secrets-manager",
    status: "available",
    displayName: "Secrets Manager",
    category: "Security",
    icon: "lock",
  },
  {
    name: "route53",
    status: "available",
    displayName: "Route 53",
    category: "Networking",
    icon: "globe",
  },
  {
    name: "ssm",
    status: "available",
    displayName: "Systems Manager",
    category: "Management",
    icon: "parameter",
  },
  { name: "ecs", status: "available", displayName: "ECS", category: "Compute", icon: "container" },
  {
    name: "elasticache",
    status: "available",
    displayName: "ElastiCache",
    category: "Database",
    icon: "cache",
  },
  {
    name: "apigateway",
    status: "available",
    displayName: "API Gateway",
    category: "Networking",
    icon: "api",
  },
];

export const SERVICE_CATEGORIES = [
  "Storage",
  "Database",
  "Compute",
  "Messaging",
  "Security",
  "Networking",
  "Monitoring",
  "Management",
];

export const REGIONS = [
  "us-east-1",
  "us-east-2",
  "us-west-1",
  "us-west-2",
  "eu-west-1",
  "eu-west-2",
  "eu-central-1",
  "ap-southeast-1",
  "ap-northeast-1",
];
