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
  | "rebooting";

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

// ─── Instance Status Checks ──────────────────────────────────────────────────

export interface EC2InstanceStatusCheck {
  InstanceId?: string;
  InstanceState?: { Code?: number; Name?: string };
  SystemStatus?: {
    Status?: "ok" | "impaired" | "initializing" | "insufficient-data" | "not-applicable";
    Details?: Array<{ Name?: string; Status?: string; ImpairedSince?: Date }>;
    ImpairedSince?: Date;
  };
  InstanceStatus?: {
    Status?: "ok" | "impaired" | "initializing" | "insufficient-data" | "not-applicable";
    Details?: Array<{ Name?: string; Status?: string; ImpairedSince?: Date }>;
    ImpairedSince?: Date;
  };
}

// ─── AMI Launch Permissions ──────────────────────────────────────────────────

export interface EC2LaunchPermission {
  UserId?: string;
  Group?: "all" | string;
  OrganizationArn?: string;
  OrganizationalUnitArn?: string;
}

export interface EC2AMIAttribute {
  ImageId?: string;
  LaunchPermissions?: EC2LaunchPermission[];
  ProductCodes?: Array<{ ProductCodeId?: string; ProductCodeType?: string }>;
  BlockDeviceMapping?: Array<{
    DeviceName?: string;
    Ebs?: {
      SnapshotId?: string;
      VolumeSize?: number;
      DeleteOnTermination?: boolean;
      VolumeType?: string;
      Encrypted?: boolean;
      Iops?: number;
      Throughput?: number;
      KmsKeyId?: string;
    };
  }>;
  Description?: string;
  KernelId?: string;
  RamdiskId?: string;
  SriovNetSupport?: string;
  BootMode?: string;
  TpmSupport?: string;
  UefiData?: string;
  ImdsSupport?: string;
}

// ─── Instance Connect ────────────────────────────────────────────────────────

export interface EC2InstanceConnectInfo {
  InstanceId?: string;
  AvailabilityZone?: string;
  ConnectionType?: "ssh" | "rdp" | "session-manager" | "ec2-instance-connect" | "serial-console";
  Username?: string;
  PrivateKey?: string;
  PublicKey?: string;
  ConnectionUrl?: string;
  SessionId?: string;
}

export interface EC2SerialConsoleConnection {
  InstanceId?: string;
  Port?: number;
  Status?: "connected" | "disconnected" | "connecting" | "failed";
  SessionId?: string;
}

// ─── Elastic IP Types ────────────────────────────────────────────────────────

export interface EC2ElasticIP {
  AllocationId?: string;
  PublicIp?: string;
  PrivateIpAddress?: string;
  Domain?: "vpc" | "standard";
  InstanceId?: string;
  AssociationId?: string;
  NetworkInterfaceId?: string;
  NetworkInterfaceOwnerId?: string;
  PublicIpv4Pool?: string;
  NetworkBorderGroup?: string;
  CustomerOwnedIp?: string;
  CustomerOwnedIpv4Pool?: string;
  CarrierIp?: string;
  Tags?: Array<{ Key?: string; Value?: string }>;
}

export interface EC2AddressAssociation {
  AllocationId?: string;
  InstanceId?: string;
  NetworkInterfaceId?: string;
  PrivateIpAddress?: string;
  AssociationId?: string;
}

// ─── Volume Attachment ──────────────────────────────────────────────────────

export interface EC2VolumeAttachment {
  VolumeId?: string;
  InstanceId?: string;
  Device?: string;
  State?: "attaching" | "attached" | "detaching" | "detached" | "busy";
  AttachTime?: Date;
  DeleteOnTermination?: boolean;
}

// ─── Network Interface ───────────────────────────────────────────────────────

export interface EC2NetworkInterface {
  NetworkInterfaceId?: string;
  SubnetId?: string;
  VpcId?: string;
  AvailabilityZone?: string;
  Description?: string;
  OwnerId?: string;
  RequesterId?: string;
  RequesterManaged?: boolean;
  Status?: "available" | "attaching" | "in-use" | "detaching" | "detached";
  MacAddress?: string;
  PrivateIpAddress?: string;
  PrivateIpAddresses?: Array<{
    PrivateIpAddress?: string;
    Primary?: boolean;
    Association?: {
      AllocationId?: string;
      AssociationId?: string;
      PublicIp?: string;
      PublicDnsName?: string;
    };
  }>;
  PrivateDnsName?: string;
  SourceDestCheck?: boolean;
  Groups?: Array<{ GroupId?: string; GroupName?: string }>;
  Attachment?: {
    AttachmentId?: string;
    InstanceId?: string;
    InstanceOwnerId?: string;
    DeviceIndex?: number;
    Status?: string;
    AttachTime?: Date;
    DeleteOnTermination?: boolean;
  };
  Association?: {
    AllocationId?: string;
    AssociationId?: string;
    PublicIp?: string;
    PublicDnsName?: string;
  };
  TagSet?: Array<{ Key?: string; Value?: string }>;
  Ipv6Addresses?: Array<{ Ipv6Address?: string }>;
  Ipv6Native?: boolean;
  Ipv4Prefixes?: Array<{ Ipv4Prefix?: string }>;
  Ipv6Prefixes?: Array<{ Ipv6Prefix?: string }>;
  ClientToken?: string;
  EnablePrimaryIpv6?: boolean;
}

// ─── Launch Wizard Types ────────────────────────────────────────────────────

export interface EC2LaunchWizardStep1 {
  amiCategory: "quick-start" | "my-amis" | "marketplace" | "community";
  selectedImageId: string;
}

export interface EC2LaunchWizardStep2 {
  instanceType: string;
  vcpus: number;
  memory: number;
  network: string;
  freeTier: boolean;
  currentGeneration: boolean;
  supportsIpv6: boolean;
}

export interface EC2LaunchWizardStep3 {
  numberOfInstances: number;
  purchasingOption: "on-demand" | "spot" | "capacity-reservation";
  networkInterface: {
    subnetId: string;
    autoAssignPublicIp: boolean;
    securityGroupIds: string[];
    primaryNetworkInterface: boolean;
    deleteOnTermination: boolean;
    secondaryPrivateIpCount: number;
    ipv6AddressCount: number;
  };
  iamInstanceProfile: string;
  shutdownBehavior: "stop" | "terminate" | "hibernate";
  monitoring: boolean;
  ebsOptimized: boolean;
  userData: string;
  metadataOptions: {
    httpTokens: "required" | "optional";
    httpPutResponseHopLimit: number;
    httpEndpoint: "enabled" | "disabled";
    httpProtocolIpv6: "enabled" | "disabled";
    instanceMetadataTags: "enabled" | "disabled";
  };
  creditSpecification: {
    cpuCredits: "standard" | "unlimited";
  };
  placementGroup: string;
  tenancy: "default" | "dedicated" | "host";
  hostId: string;
  hostResourceGroupArn: string;
  capacityReservation: "open" | "targeted" | "none";
  capacityReservationId: string;
}

export interface EC2LaunchWizardStep4 {
  volumes: Array<{
    deviceName: string;
    snapshotId: string;
    volumeSize: number;
    volumeType: "gp2" | "gp3" | "io1" | "io2" | "st1" | "sc1" | "standard";
    iops?: number;
    throughput?: number;
    encrypted: boolean;
    kmsKeyId: string;
    deleteOnTermination: boolean;
  }>;
}

export interface EC2LaunchWizardStep5 {
  tags: Array<{ Key: string; Value: string }>;
}

export interface EC2LaunchWizardStep6 {
  /** Optional key pair selected for the launch. */
  keyName?: string;
  securityGroupId: string;
  securityGroupName: string;
  description: string;
  vpcId: string;
  rules: Array<{
    type: "inbound" | "outbound";
    protocol: string;
    fromPort: number;
    toPort: number;
    cidrIp: string;
    description: string;
  }>;
}

export interface EC2LaunchWizardStep7 {
  summary: {
    ami: string;
    instanceType: string;
    keyPair: string;
    subnet: string;
    securityGroups: string[];
    volumes: Array<{ deviceName: string; size: number; type: string; encrypted: boolean }>;
    tags: Array<{ Key: string; Value: string }>;
    iamRole: string;
    monitoring: boolean;
    estimatedCost: string;
  } | null;
}

export interface EC2LaunchWizardState {
  step1: EC2LaunchWizardStep1;
  step2: EC2LaunchWizardStep2;
  step3: EC2LaunchWizardStep3;
  step4: EC2LaunchWizardStep4;
  step5: EC2LaunchWizardStep5;
  step6: EC2LaunchWizardStep6;
  step7: EC2LaunchWizardStep7;
  currentStep: number;
}

// ─── Spot Instance Types ────────────────────────────────────────────────────

export interface EC2SpotInstanceRequest {
  SpotInstanceRequestId?: string;
  InstanceId?: string;
  State?: "open" | "active" | "closed" | "cancelled" | "failed";
  Status?: { Code?: string; Message?: string; UpdateTime?: Date };
  LaunchSpecification?: {
    ImageId?: string;
    InstanceType?: string;
    KeyName?: string;
    SecurityGroupIds?: string[];
    SubnetId?: string;
    UserData?: string;
    IamInstanceProfile?: { Arn?: string };
    BlockDeviceMappings?: EC2BlockDeviceMapping[];
    Monitoring?: { Enabled?: boolean };
    Placement?: { AvailabilityZone?: string; GroupName?: string };
    EbsOptimized?: boolean;
    SecurityGroups?: Array<{ GroupId?: string; GroupName?: string }>;
    NetworkInterfaces?: EC2NetworkInterfaceConfig[];
  };
  SpotPrice?: string;
  ValidFrom?: Date;
  ValidUntil?: Date;
  InstanceInterruptionBehavior?: "hibernate" | "stop" | "terminate";
  Type?: "one-time" | "persistent";
  CreateTime?: Date;
  Tags?: Array<{ Key?: string; Value?: string }>;
}

// ─── Reserved Instance Types ─────────────────────────────────────────────────

export interface EC2ReservedInstance {
  ReservedInstancesId?: string;
  InstanceType?: string;
  AvailabilityZone?: string;
  Platform?: string;
  InstanceCount?: number;
  Start?: Date;
  End?: Date;
  Duration?: number;
  FixedPrice?: number;
  UsagePrice?: number;
  CurrencyCode?: string;
  InstanceTenancy?: "default" | "dedicated";
  OfferingClass?: "standard" | "convertible";
  OfferingType?: "All Upfront" | "Partial Upfront" | "No Upfront";
  State?: "payment-pending" | "active" | "payment-failed" | "retired" | "queued" | "queued-deleted";
  ProductDescription?: string;
  RecurringCharges?: Array<{ Amount?: number; Frequency?: string }>;
  Tags?: Array<{ Key?: string; Value?: string }>;
}

export interface EC2ReservedInstanceOffering {
  ReservedInstancesOfferingId?: string;
  InstanceType?: string;
  AvailabilityZone?: string;
  Duration?: number;
  FixedPrice?: number;
  UsagePrice?: number;
  CurrencyCode?: string;
  InstanceTenancy?: "default" | "dedicated";
  OfferingClass?: "standard" | "convertible";
  OfferingType?: "All Upfront" | "Partial Upfront" | "No Upfront";
  ProductDescription?: string;
  RecurringCharges?: Array<{ Amount?: number; Frequency?: string }>;
  PricingDetails?: Array<{ Count?: number; Price?: number }>;
}

// ─── Dedicated Host Types ────────────────────────────────────────────────────

export interface EC2DedicatedHost {
  HostId?: string;
  HostReservationId?: string;
  InstanceType?: string;
  InstanceFamily?: string;
  AutoPlacement?: "on" | "off";
  AvailabilityZone?: string;
  ClientToken?: string;
  State?:
    | "available"
    | "under-assessment"
    | "permanent-failure"
    | "released"
    | "released-permanently"
    | "pending";
  AvailableCapacity?: {
    AvailableInstanceCapacity?: Array<{
      InstanceType?: string;
      AvailableCapacity?: number;
      TotalCapacity?: number;
    }>;
    AvailableVCpus?: number;
  };
  AllocationTime?: Date;
  ReleaseTime?: Date;
  Tags?: Array<{ Key?: string; Value?: string }>;
  HostRecovery?: "on" | "off";
  HostMaintenance?: "on" | "off";
  AssetId?: string;
  OutpostArn?: string;
  SupportedInstanceTypeFamilies?: string[];
  MemberOfServiceLinkedResourceGroup?: boolean;
}

// ─── Capacity Reservation Types ──────────────────────────────────────────────

export interface EC2CapacityReservation {
  CapacityReservationId?: string;
  InstanceType?: string;
  InstancePlatform?:
    | "Linux/UNIX"
    | "Red Hat Enterprise Linux"
    | "SUSE Linux"
    | "Windows"
    | "Windows with SQL Server"
    | "Windows with SQL Server Enterprise"
    | "Windows with SQL Server Standard"
    | "Windows with SQL Server Web"
    | "Linux with SQL Server Standard"
    | "Linux with SQL Server Web"
    | "Linux with SQL Server Enterprise"
    | "RHEL with SQL Server Standard"
    | "RHEL with SQL Server Enterprise"
    | "RHEL with SQL Server Web";
  AvailabilityZone?: string;
  AvailabilityZoneId?: string;
  Tenancy?: "default" | "dedicated";
  TotalInstanceCount?: number;
  AvailableInstanceCount?: number;
  EbsOptimized?: boolean;
  EphemeralStorage?: boolean;
  State?: "active" | "expired" | "cancelled" | "pending" | "failed";
  StartDate?: Date;
  EndDate?: Date;
  EndDateType?: "unlimited" | "limited";
  InstanceMatchCriteria?: "open" | "targeted";
  CreateDate?: Date;
  Tags?: Array<{ Key?: string; Value?: string }>;
  OutpostArn?: string;
  CapacityReservationFleetId?: string;
  PlacementGroupArn?: string;
}

// ─── Placement Group Types ───────────────────────────────────────────────────

export interface EC2PlacementGroup {
  GroupName?: string;
  Strategy?: "cluster" | "spread" | "partition";
  State?: "pending" | "available" | "deleted" | "deleting";
  PartitionCount?: number;
  GroupId?: string;
  Tags?: Array<{ Key?: string; Value?: string }>;
}
