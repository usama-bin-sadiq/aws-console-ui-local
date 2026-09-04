/**
 * IAM Types
 */

export interface IAMUserConfig {
  UserName?: string;
  Path?: string;
  Tags?: Array<{ Key?: string; Value?: string }>;
}

export interface IAMPolicyConfig {
  PolicyName?: string;
  PolicyDocument?: string;
  Path?: string;
}
