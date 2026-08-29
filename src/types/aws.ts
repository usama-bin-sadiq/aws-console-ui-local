// S3 Types
export interface S3Bucket {
  Name?: string;
  CreationDate?: string;
  Region?: string;
  Versioning?: "Enabled" | "Suspended" | "Disabled";
  Encryption?: "SSE-S3" | "SSE-KMS" | "None";
  PublicAccess?: "Blocked" | "Allowed";
}

export interface S3Object {
  Key?: string;
  Size?: number;
  LastModified?: string;
  StorageClass?: string;
  ETag?: string;
}

// EC2 Types
export interface EC2Instance {
  InstanceId?: string;
  Name?: string;
  InstanceType?: string;
  State?: { Name?: "running" | "stopped" | "pending" | "terminated" | "stopping" };
  PublicIpAddress?: string;
  PrivateIpAddress?: string;
  KeyName?: string;
  LaunchTime?: string;
  AvailabilityZone?: string;
  VpcId?: string;
  SubnetId?: string;
  SecurityGroups?: { GroupId?: string; GroupName?: string }[];
}

export interface SecurityGroup {
  GroupId?: string;
  GroupName?: string;
  Description?: string;
  VpcId?: string;
  IpPermissions?: any[];
  IpPermissionsEgress?: any[];
}

export interface KeyPair {
  KeyName?: string;
  KeyFingerprint?: string;
  KeyType?: string;
  CreateTime?: string;
}

export interface Volume {
  VolumeId?: string;
  Size?: number;
  VolumeType?: string;
  State?: string;
  AvailabilityZone?: string;
  Attachments?: any[];
  CreateTime?: string;
}

export interface ElasticIP {
  PublicIp?: string;
  AllocationId?: string;
  Domain?: string;
  InstanceId?: string;
  AssociationId?: string;
}

export interface AMI {
  ImageId?: string;
  Name?: string;
  Description?: string;
  State?: string;
  Architecture?: string;
  CreationDate?: string;
}

export interface Snapshot {
  SnapshotId?: string;
  VolumeId?: string;
  State?: string;
  StartTime?: string;
  Progress?: string;
  Description?: string;
}

// IAM Types
export interface IAMUser {
  UserName?: string;
  UserId?: string;
  Arn?: string;
  CreateDate?: string;
  PasswordLastUsed?: string;
  MFAEnabled?: boolean;
}

export interface IAMRole {
  RoleName?: string;
  RoleId?: string;
  Arn?: string;
  CreateDate?: string;
  AssumeRolePolicyDocument?: string;
  Description?: string;
}

export interface IAMPolicy {
  PolicyName?: string;
  PolicyId?: string;
  Arn?: string;
  Path?: string;
  DefaultVersionId?: string;
  AttachmentCount?: number;
  CreateDate?: string;
}

// Lambda Types
export interface LambdaFunction {
  FunctionName?: string;
  FunctionArn?: string;
  Runtime?: string;
  Role?: string;
  Handler?: string;
  CodeSize?: number;
  Description?: string;
  Timeout?: number;
  MemorySize?: number;
  LastModified?: string;
  PackageType?: string;
}

// DynamoDB Types
export interface DynamoDBTable {
  TableName?: string;
  TableStatus?: string;
  KeySchema?: any[];
  AttributeDefinitions?: any[];
  ProvisionedThroughput?: any;
  TableSizeBytes?: number;
  ItemCount?: number;
  TableArn?: string;
  CreationDateTime?: string;
}

// RDS Types
export interface RDSInstance {
  DBInstanceIdentifier?: string;
  DBInstanceClass?: string;
  Engine?: string;
  DBInstanceStatus?: string;
  Endpoint?: {
    Address?: string;
    Port?: number;
  };
  AllocatedStorage?: number;
  MultiAZ?: boolean;
  InstanceCreateTime?: string;
}

// SQS Types
export interface SQSQueue {
  QueueUrl?: string;
  QueueName?: string;
  QueueArn?: string;
  ApproximateNumberOfMessages?: number;
  ApproximateNumberOfMessagesNotVisible?: number;
  ApproximateNumberOfMessagesDelayed?: number;
  CreatedTimestamp?: string;
  LastModifiedTimestamp?: string;
}

// SNS Types
export interface SNSTopic {
  TopicArn?: string;
  DisplayName?: string;
  SubscriptionsConfirmed?: number;
  SubscriptionsPending?: number;
  SubscriptionsDeleted?: number;
}

// VPC Types
export interface VPC {
  VpcId?: string;
  State?: string;
  CidrBlock?: string;
  IsDefault?: boolean;
  DhcpOptionsId?: string;
  Tags?: Array<{ Key?: string; Value?: string }>;
}

export interface Subnet {
  SubnetId?: string;
  VpcId?: string;
  CidrBlock?: string;
  AvailabilityZone?: string;
  AvailableIpAddressCount?: number;
  State?: string;
  MapPublicIpOnLaunch?: boolean;
}

// CloudWatch Types
export interface CloudWatchAlarm {
  AlarmName?: string;
  AlarmArn?: string;
  AlarmDescription?: string;
  StateValue?: "OK" | "ALARM" | "INSUFFICIENT_DATA";
  StateReason?: string;
  MetricName?: string;
  Namespace?: string;
  Threshold?: number;
  ComparisonOperator?: string;
  AlarmActions?: string[];
}

// CloudFormation Types
export interface CloudFormationStack {
  StackName?: string;
  StackId?: string;
  StackStatus?: string;
  CreationTime?: string;
  LastUpdatedTime?: string;
  Description?: string;
  DriftInformation?: any;
}

// Tag Type (universal)
export interface Tag {
  key: string;
  value: string;
}
