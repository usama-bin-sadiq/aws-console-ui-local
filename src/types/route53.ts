/**
 * Route53 Types
 */
export interface Route53HostedZoneConfig {
  Name?: string;
  CallerReference?: string;
  VPC?: { VPCRegion?: string; VPCId?: string };
}
