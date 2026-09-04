/**
 * EC2 Types — Dedicated interfaces for EC2 service.
 * Separated from generic aws.ts per AGENTS.md Section 3.1.
 */

export interface EC2InstanceDetails {
  InstanceId?: string;
  Name?: string;
  InstanceType?: string;
  State?: { Name?: 'running' | 'stopped' | 'pending' | 'terminated' | 'stopping' };
  PublicIpAddress?: string;
  PrivateIpAddress?: string;
  KeyName?: string;
  LaunchTime?: string;
  AvailabilityZone?: string;
  VpcId?: string;
  SubnetId?: string;
  SecurityGroups?: Array<{ GroupId?: string; GroupName?: string }>;
  Monitoring?: { State?: 'enabled' | 'disabled' };
  Tags?: Array<{ Key?: string; Value?: string }>;
}

export interface EC2VolumeDetails {
  VolumeId?: string;
  Size?: number;
  VolumeType?: 'gp2' | 'gp3' | 'io1' | 'io2' | 'st1' | 'sc1' | 'standard';
  State?: 'creating' | 'available' | 'in-use' | 'deleting' | 'deleted' | 'error';
  AvailabilityZone?: string;
  Attachments?: Array<{ InstanceId?: string; State?: string; AttachTime?: string; Device?: string }>;
  CreateTime?: string;
  Tags?: Array<{ Key?: string; Value?: string }>;
}

export interface EC2SecurityGroupRule {
  IpProtocol?: string;
  FromPort?: number;
  ToPort?: number;
  IpRanges?: Array<{ CidrIp?: string; Description?: string }>;
  UserIdGroupPairs?: Array<{ GroupId?: string; Description?: string }>;
}

export interface EC2SecurityGroupDetails {
  GroupId?: string;
  GroupName?: string;
  Description?: string;
  VpcId?: string;
  IpPermissions?: EC2SecurityGroupRule[];
  IpPermissionsEgress?: EC2SecurityGroupRule[];
  Tags?: Array<{ Key?: string; Value?: string }>;
}

export interface EC2LoadBalancerDetails {
  LoadBalancerArn?: string;
  DNSName?: string;
  Type?: 'application' | 'network' | 'gateway';
  State?: { Code?: string; Reason?: string };
  AvailabilityZones?: Array<{ ZoneName?: string; SubnetId?: string; LoadBalancerAddresses?: Array<{ IpAddress?: string; AllocationId?: string }> }>;
}

export interface EC2KeyPairDetails {
  KeyName?: string;
  KeyFingerprint?: string;
  KeyType?: 'rsa' | 'ed25519';
  CreateTime?: string;
}

export interface EC2AMIImage {
  ImageId?: string;
  Name?: string;
  Description?: string;
  State?: 'pending' | 'available' | 'invalid' | 'deregistered' | 'transient' | 'failed' | 'error';
  Architecture?: 'x86_64' | 'arm64';
  CreationDate?: string;
}

export interface EC2PlacementGroup {
  GroupName?: string;
  Strategy?: 'cluster' | 'spread' | 'partition';
  State?: 'pending' | 'available';
  PartitionCount?: number;
}
