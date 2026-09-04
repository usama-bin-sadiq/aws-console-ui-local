/**
 * CloudFormation Types — Phase 11 (Complete)
 * Source: docs/prd-aws-management-console-v1.3.md §9.2.8, §15.11
 * Feature IDs: F-006, F-007, F-008, F-014
 */

export interface CloudFormationStackConfig {
  StackName?: string;
  TemplateBody?: string;
  Capabilities?: string[];
  Tags?: Array<{ Key?: string; Value?: string }>;
}

export interface CloudFormationStackSummary {
  StackName?: string;
  StackStatus?: string;
  CreationTime?: string;
  LastUpdatedTime?: string;
  StackStatusReason?: string;
  DriftInformation?: {
    StackDriftStatus?: string;
  };
}

export interface CloudFormationStackEvent {
  Timestamp?: string;
  ResourceStatus?: string;
  ResourceStatusReason?: string;
  LogicalResourceId?: string;
  PhysicalResourceId?: string;
  ResourceType?: string;
}

export interface CloudFormationStackResourceSummary {
  LogicalResourceId?: string;
  PhysicalResourceId?: string;
  ResourceType?: string;
  ResourceStatus?: string;
  LastUpdatedTimestamp?: string;
}

export interface CloudFormationStackOutput {
  OutputKey?: string;
  OutputValue?: string;
  Description?: string;
  ExportName?: string;
}

export interface CloudFormationStackDetail {
  StackName?: string;
  StackStatus?: string;
  CreationTime?: string;
  LastUpdatedTime?: string;
  StackStatusReason?: string;
  DriftInformation?: { StackDriftStatus?: string };
  Tags?: Array<{ Key?: string; Value?: string }>;
  Outputs?: CloudFormationStackOutput[];
  Parameters?: Array<{
    ParameterKey?: string;
    ParameterValue?: string;
    UsePreviousValue?: boolean;
    ResolvedValue?: string;
  }>;
  TemplateDescription?: string;
  NotificationARNs?: string[];
}
