/**
 * Lambda Types
 * PRD §9.2.1, §15.3
 */

export interface LambdaFunctionConfig {
  FunctionName?: string;
  FunctionArn?: string;
  Runtime?:
    | "nodejs20.x"
    | "python3.12"
    | "python3.11"
    | "java21"
    | "java17"
    | "dotnet8"
    | "ruby3.3"
    | "go1.x";
  Handler?: string;
  MemorySize?: number;
  Timeout?: number;
  Role?: string;
  Description?: string;
  Architecture?: "x86_64" | "arm64";
  Environment?: Record<string, string>;
  Tags?: Array<{ Key?: string; Value?: string }>;
  Code?: { ZipFile?: string; S3Bucket?: string; S3Key?: string };
  State?: "Active" | "Failed" | "Inactive" | "Pending";
  LastModified?: string;
  CodeSize?: number;
  CodeSha256?: string;
}

export interface LambdaAliasConfig {
  AliasName?: string;
  AliasArn?: string;
  FunctionName?: string;
  FunctionVersion?: string;
  Description?: string;
  RoutingConfig?: { AdditionalVersionWeights?: Record<string, number> };
}

export interface LambdaVersionConfig {
  Version?: string;
  Description?: string;
  CodeSize?: number;
  MemorySize?: number;
  Runtime?: string;
  LastModified?: string;
  CodeSha256?: string;
  State?: string;
}

export interface LambdaPermissionConfig {
  StatementId?: string;
  Action?: string;
  Principal?: string;
  SourceArn?: string;
  SourceAccount?: string;
  EventSourceToken?: string;
  FunctionUrlAuthType?: string;
  RevisionId?: string;
}

export interface LambdaEventSourceMappingConfig {
  UUID?: string;
  FunctionArn?: string;
  EventSourceArn?: string;
  BatchSize?: number;
  MaximumBatchingWindowInSeconds?: number;
  State?: "Creating" | "Enabling" | "Enabled" | "Disabling" | "Disabled";
}

export interface LambdaTriggerConfig {
  TriggerType?: "s3" | "sns" | "sqs" | "eventbridge" | "api-gateway";
  SourceArn?: string;
  SourceAccount?: string;
}
