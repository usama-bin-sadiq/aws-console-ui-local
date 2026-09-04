/**
 * IAM Types — Extended for Phase 7 (Users, Groups, Roles, Policies)
 */

export interface IAMUserConfig {
  UserName?: string;
  Path?: string;
  Tags?: Array<{ Key?: string; Value?: string }>; 
  PermissionsBoundary?: string;
}

export interface IAMPolicyConfig {
  PolicyName?: string;
  PolicyDocument?: string;
  Path?: string;
  Description?: string;
}

export interface IAMRoleConfig {
  RoleName?: string;
  Path?: string;
  AssumeRolePolicyDocument?: string;
  Description?: string;
  MaxSessionDuration?: number;
  Tags?: Array<{ Key?: string; Value?: string }>;
}

export interface IAMGroupConfig {
  GroupName?: string;
  Path?: string;
}

export interface IAMUserDetail {
  UserName: string;
  UserId: string;
  Arn: string;
  CreateDate: string;
  Path: string;
  Tags?: Array<{ Key?: string; Value?: string }>;
  AttachedPolicies?: Array<{ PolicyName: string; PolicyArn: string }>
  Groups?: Array<{ GroupName: string; Arn?: string }>
}

export interface IAMRoleDetail {
  RoleName: string;
  RoleId: string;
  Arn: string;
  CreateDate: string;
  Path: string;
  AssumeRolePolicyDocument?: string;
  Description?: string;
  Tags?: Array<{ Key?: string; Value?: string }>;
  AttachedPolicies?: Array<{ PolicyName: string; PolicyArn: string }>
}

export interface IAMPolicyDetail {
  PolicyName: string;
  PolicyArn?: string;
  Arn: string;
  Path: string;
  DefaultVersionId?: string;
  Description?: string;
  CreateDate?: string;
  UpdateDate?: string;
  PolicyDocument?: string;
}

export interface IAMGroupDetail {
  GroupName: string;
  GroupId: string;
  Arn?: string;
  Path: string;
  CreateDate?: string;
  AttachedPolicies?: Array<{ PolicyName: string; PolicyArn: string }>
  Users?: Array<{ UserName: string; UserId?: string }>
}
