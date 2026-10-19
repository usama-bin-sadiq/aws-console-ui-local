/**
 * VPC Types
 */
export interface VPCConfig {
  CidrBlock?: string;
  Tenancy?: "default" | "dedicated";
  Tags?: Array<{ Key?: string; Value?: string }>;
}
