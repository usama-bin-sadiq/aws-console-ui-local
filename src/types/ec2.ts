/**
 * EC2 Types — Dedicated interfaces for EC2 service.
 * Separated from generic aws.ts per AGENTS.md Section 3.1.
 */

// ─── Instance Types ─────────────────────────────────────────────────────────

export type EC2InstanceState =
  | "running"
  | "stopped"
  | "pending"
  | "terminated"
  | "stopping"
  | "shutting-down"
  | "stopping"
  | "rebooting"
  | "pending";

export interface EC2Instance {
  InstanceId?: string;
  Name?: string;
  InstanceType?: string;
  State?: { Name?: EC2InstanceState; Code?: number };
  PublicIpAddress?: string;
  PrivateIpAddress?: string;
  KeyName?: string;
  LaunchTime?: Date;
  AvailabilityZone?: string;
  VpcId?: string;
  SubnetId?: string;
  SecurityGroups?: Array<{ GroupId?: string; GroupName?: string }>;
  Monitoring?: { State?: "enabled" | "disabled" };
  Tags?: Array<{ Key?: string; Value?: string }>;
  ImageId?: string;
  Platform?: "windows" | "amazon-linux" | string;
  RootDeviceType?: "ebs" | "instance-store";
  VirtualizationType?: "hvm" | "paravirtual";
  Architecture?: "x86_64" | "arm64";
  Hypervisor?: "xen" | "nitro";
  IamInstanceProfile?: { Arn?: string };
  EbsOptimized?: boolean;
  DisableApiTermination?: boolean;
  InstanceInitiatedShutdownBehavior?: "stop" | "terminate";
  PublicDnsName?: string;
  PrivateDnsName?: string;
  StatusChecks?: {
    SystemStatus?: { Status?: string; ImpairedSince?: Date };
    InstanceStatus?: { Status?: string; ImpairedSince?: Date };
  };
  BlockDeviceMappings?: Array<{
    DeviceName?: string;
    Ebs?: {
      VolumeId?: string;
      Status?: string;
      DeleteOnTermination?: boolean;
      AttachTime?: Date;
    };
  }>;
  NetworkInterfaces?: Array<{
    NetworkInterfaceId?: string;
    SubnetId?: string;
    VpcId?: string;
    PrivateDnsName?: string;
    PrivateIpAddress?: string;
    Attachment?: { Status?: string; DeviceIndex?: number };
  }>;
}

// ─── Launch Configuration ──────────────────────────────────────────────────

export interface EC2LaunchConfig {
  imageId: string;
  instanceType: string;
  keyName?: string;
  subnetId?: string;
  securityGroupIds?: string[];
  iamInstanceProfile?: string;
  userData?: string;
  tags: Array<{ Key: string; Value: string }>;
  blockDeviceMappings: EC2BlockDeviceMapping[];
  monitoring: boolean;
  disableApiTermination: boolean;
  shutdownBehavior: "stop" | "terminate";
  numInstances: number;
  networkInterfaces?: EC2NetworkInterfaceConfig[];
}

export interface EC2BlockDeviceMapping {
  deviceName: string;
  volumeSize: number;
  volumeType: EC2VolumeType;
  iops?: number;
  throughput?: number;
  encrypted: boolean;
  deleteOnTermination: boolean;
  kmsKeyId?: string;
}

export interface EC2NetworkInterfaceConfig {
  subnetId: string;
  securityGroupIds: string[];
  associatePublicIpAddress: boolean;
}

// ─── Instance Types (from DescribeInstanceTypes) ───────────────────────────

export interface EC2InstanceTypeInfo {
  InstanceType?: string;
  VCpuInfo?: {
    DefaultVCpus?: number;
    DefaultCores?: number;
    SustainedClockSpeedInGhz?: number;
  };
  MemoryInfo?: {
    SizeInMiB?: number;
  };
  StorageInfo?: {
    EbsInfo?: {
      EbsOptimizedInfo?: {
        BaselineBandwidthInMbps?: number;
        BaselineIOPS?: number;
        BaselineThroughputInMBps?: number;
        MaximumBandwidthInMbps?: number;
        MaximumIOPS?: number;
        MaximumThroughputInMBps?: number;
      };
      EbsOptimizedSupport?: string;
      NvmeSupport?: string;
    };
    EphemeralNvmeSupport?: string;
    EphemeralStorageSupport?: string;
  };
  NetworkInfo?: {
    EfaSupported?: boolean;
    MaximumNetworkCards?: number;
    MaximumNetworkInterfaces?: number;
  };
  ProcessorInfo?: {
    SupportedArchitectures?: string[];
    SustainedClockSpeedInGhz?: number;
  };
  SupportedUsageClasses?: string[];
  BurstablePerformanceSupported?: boolean;
  CurrentGeneration?: boolean;
  FreeTierEligible?: boolean;
  Hypervisor?: string;
}

// ─── AMI Types ─────────────────────────────────────────────────────────────

export interface EC2AMIImage {
  ImageId?: string;
  Name?: string;
  Description?: string;
  State?: "pending" | "available" | "invalid" | "deregistered" | "transient" | "failed" | "error";
  Architecture?: "x86_64" | "arm64";
  CreationDate?: string;
  OwnerId?: string;
  OwnerAlias?: string;
  Platform?: string;
  RootDeviceType?: string;
  VirtualizationType?: string;
  ImageType?: string;
  Public?: boolean;
  ProductCodes?: Array<{ ProductCodeId?: string; ProductCodeType?: string }>;
  Hypervisor?: string;
  EnaSupport?: boolean;
  SriovNetSupport?: string;
  BootMode?: string;
  DeprecationTime?: string;
}

// ─── Key Pair Types ────────────────────────────────────────────────────────

export interface EC2KeyPair {
  KeyName?: string;
  KeyFingerprint?: string;
  KeyType?: "rsa" | "ed25519";
  Tags?: Array<{ Key?: string; Value?: string }>;
  CreateTime?: Date;
}

// ─── Security Group Types ──────────────────────────────────────────────────

export interface EC2SecurityGroupRule {
  IpProtocol?: string;
  FromPort?: number;
  ToPort?: number;
  IpRanges?: Array<{ CidrIp?: string; Description?: string }>;
  UserIdGroupPairs?: Array<{ GroupId?: string; Description?: string }>;
}

export interface EC2SecurityGroup {
  GroupId?: string;
  GroupName?: string;
  Description?: string;
  VpcId?: string;
  IpPermissions?: EC2SecurityGroupRule[];
  IpPermissionsEgress?: EC2SecurityGroupRule[];
  Tags?: Array<{ Key?: string; Value?: string }>;
}

// ─── Volume Types ──────────────────────────────────────────────────────────

export type EC2VolumeType = "gp2" | "gp3" | "io1" | "io2" | "st1" | "sc1" | "standard";

export interface EC2Volume {
  VolumeId?: string;
  Size?: number;
  VolumeType?: EC2VolumeType;
  State?: "creating" | "available" | "in-use" | "deleting" | "deleted" | "error";
  AvailabilityZone?: string;
  Iops?: number;
  Throughput?: number;
  Encrypted?: boolean;
  KmsKeyId?: string;
  Attachments?: Array<{
    InstanceId?: string;
    State?: string;
    Device?: string;
    VolumeId?: string;
  }>;
  CreateTime?: Date;
  Tags?: Array<{ Key?: string; Value?: string }>;
}

// ─── Placement Group Types ─────────────────────────────────────────────────

export interface EC2PlacementGroup {
  GroupName?: string;
  Strategy?: "cluster" | "spread" | "partition";
  State?: "pending" | "available";
  PartitionCount?: number;
}

// ─── Network Types ─────────────────────────────────────────────────────────

export interface EC2Vpc {
  VpcId?: string;
  CidrBlock?: string;
  State?: "pending" | "available";
  IsDefault?: boolean;
  Tags?: Array<{ Key?: string; Value?: string }>;
}

export interface EC2Subnet {
  SubnetId?: string;
  VpcId?: string;
  CidrBlock?: string;
  AvailabilityZone?: string;
  State?: "pending" | "available";
  AvailableIpAddressCount?: number;
  Tags?: Array<{ Key?: string; Value?: string }>;
}

// ─── Instance Status ───────────────────────────────────────────────────────

export interface EC2InstanceStatus {
  InstanceId?: string;
  InstanceState?: { Code?: number; Name?: string };
  SystemStatus?: { Status?: string; ImpairedSince?: Date };
  InstanceStatus?: { Status?: string; ImpairedSince?: Date };
}

// ─── Region Types ──────────────────────────────────────────────────────────

export interface EC2Region {
  RegionName?: string;
  RegionEndpoint?: string;
  OptInStatus?: string;
}

export interface EC2AvailabilityZone {
  ZoneName?: string;
  ZoneId?: string;
  State?: string;
  RegionName?: string;
}
