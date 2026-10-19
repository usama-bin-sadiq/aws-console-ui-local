/**
 * Launch Template Types — Dedicated interfaces for EC2 Launch Templates.
 * Matches AWS Console data structures and API responses.
 */

// ─── Core Launch Template ─────────────────────────────────────────────────────

export interface LaunchTemplate {
  LaunchTemplateId?: string;
  LaunchTemplateName?: string;
  /** ISO-8601 string once serialized to JSON (never a Date on the client). */
  CreateTime?: string;
  CreatedBy?: string;
  DefaultVersionNumber?: number;
  LatestVersionNumber?: number;
  Tags?: Array<{ Key?: string; Value?: string }>;
}

export interface LaunchTemplateVersion {
  LaunchTemplateId?: string;
  LaunchTemplateName?: string;
  VersionNumber?: number;
  VersionDescription?: string;
  /** ISO-8601 string once serialized to JSON (never a Date on the client). */
  CreateTime?: string;
  CreatedBy?: string;
  DefaultVersion?: boolean;
  LaunchTemplateData?: LaunchTemplateData;
}

export interface LaunchTemplateData {
  ImageId?: string;
  InstanceType?: string;
  KeyName?: string;
  SecurityGroupIds?: string[];
  SecurityGroups?: string[];
  SubnetId?: string;
  IamInstanceProfile?: { Arn?: string; Name?: string };
  InstanceInitiatedShutdownBehavior?: "stop" | "terminate";
  UserData?: string;
  TagSpecifications?: LaunchTemplateTagSpecification[];
  BlockDeviceMappings?: LaunchTemplateBlockDeviceMapping[];
  NetworkInterfaces?: LaunchTemplateInstanceNetworkInterfaceSpecification[];
  Monitoring?: { Enabled?: boolean };
  DisableApiTermination?: boolean;
  InstanceMarketOptions?: LaunchTemplateInstanceMarketOptionsRequest;
  CreditSpecification?: { CpuCredits?: string };
  CpuOptions?: { CoreCount?: number; ThreadsPerCore?: number };
  CapacityReservationSpecification?: LaunchTemplateCapacityReservationSpecification;
  LicenseSpecifications?: Array<{ LicenseConfigurationArn?: string }>;
  HibernationOptions?: { Configured?: boolean };
  MetadataOptions?: LaunchTemplateInstanceMetadataOptions;
  EnclaveOptions?: { Enabled?: boolean };
  PrivateDnsNameOptions?: LaunchTemplatePrivateDnsNameOptions;
  MaintenanceOptions?: LaunchTemplateInstanceMaintenanceOptions;
  Placement?: LaunchTemplatePlacement;
  ElasticGpuSpecifications?: Array<{ Type?: string }>;
  ElasticInferenceAccelerators?: Array<{ Type?: string; Count?: number }>;
}

// ─── Supporting Types ──────────────────────────────────────────────────────────

export interface LaunchTemplateTagSpecification {
  ResourceType?:
    | "instance"
    | "volume"
    | "network-interface"
    | "elastic-gpu"
    | "spot-instances-request"
    | "prefix-list"
    | "egress-only-internet-gateway";
  Tags?: Array<{ Key?: string; Value?: string }>;
}

export interface LaunchTemplateBlockDeviceMapping {
  DeviceName?: string;
  VirtualName?: string;
  Ebs?: LaunchTemplateEbsBlockDevice;
  NoDevice?: string;
}

export interface LaunchTemplateEbsBlockDevice {
  SnapshotId?: string;
  VolumeSize?: number;
  VolumeType?: "gp2" | "gp3" | "io1" | "io2" | "st1" | "sc1" | "standard";
  Iops?: number;
  Throughput?: number;
  Encrypted?: boolean;
  KmsKeyId?: string;
  DeleteOnTermination?: boolean;
}

export interface LaunchTemplateInstanceNetworkInterfaceSpecification {
  AssociateCarrierIpAddress?: boolean;
  AssociatePublicIpAddress?: boolean;
  DeleteOnTermination?: boolean;
  Description?: string;
  DeviceIndex?: number;
  Groups?: string[];
  InterfaceType?: string;
  Ipv4PrefixCount?: number;
  Ipv4Prefixes?: Array<{ Ipv4Prefix?: string }>;
  Ipv6AddressCount?: number;
  Ipv6Addresses?: Array<{ Ipv6Address?: string }>;
  Ipv6PrefixCount?: number;
  Ipv6Prefixes?: Array<{ Ipv6Prefix?: string }>;
  NetworkCardIndex?: number;
  NetworkInterfaceId?: string;
  PrivateIpAddress?: string;
  PrivateIpAddresses?: Array<{ Primary?: boolean; PrivateIpAddress?: string }>;
  SecondaryPrivateIpAddressCount?: number;
  SubnetId?: string;
}

export interface LaunchTemplateInstanceMarketOptionsRequest {
  MarketType?: "spot" | "capacity-block";
  SpotOptions?: LaunchTemplateSpotMarketOptions;
}

export interface LaunchTemplateSpotMarketOptions {
  MaxPrice?: string;
  SpotInstanceType?: "one-time" | "persistent";
  BlockDurationMinutes?: number;
  ValidUntil?: string;
  InstanceInterruptionBehavior?: "hibernate" | "stop" | "terminate";
}

export interface LaunchTemplateCapacityReservationSpecification {
  CapacityReservationPreference?: "open" | "none";
  CapacityReservationTarget?: {
    CapacityReservationId?: string;
    CapacityReservationResourceGroupArn?: string;
  };
}

export interface LaunchTemplateInstanceMetadataOptions {
  HttpTokens?: "optional" | "required";
  HttpPutResponseHopLimit?: number;
  HttpEndpoint?: "enabled" | "disabled";
  HttpProtocolIpv6?: "enabled" | "disabled";
  InstanceMetadataTags?: "enabled" | "disabled";
}

export interface LaunchTemplatePrivateDnsNameOptions {
  EnableResourceNameDnsARecord?: boolean;
  EnableResourceNameDnsAAAARecord?: boolean;
  HostnameType?: "ip-name" | "resource-name";
}

export interface LaunchTemplateInstanceMaintenanceOptions {
  AutoRecovery?: "default" | "disabled";
}

export interface LaunchTemplatePlacement {
  AvailabilityZone?: string;
  Affinity?: string;
  GroupName?: string;
  HostId?: string;
  Tenancy?: "default" | "dedicated" | "host";
  SpreadDomain?: string;
  HostResourceGroupArn?: string;
  PartitionNumber?: number;
  GroupId?: string;
}

// ─── Form State Types (for UI) ─────────────────────────────────────────────────

export interface LaunchTemplateFormState {
  // Basic
  launchTemplateName: string;
  versionDescription: string;

  // Machine Image (AMI)
  imageId: string;

  // Instance Type
  instanceType: string;

  // Key Pair
  keyName: string;

  // Security Groups
  securityGroupIds: string[];

  // Storage (Root Volume)
  rootVolume: {
    deviceName: string;
    volumeSize: number;
    volumeType: "gp2" | "gp3" | "io1" | "io2" | "st1" | "sc1" | "standard";
    iops?: number;
    throughput?: number;
    encrypted: boolean;
    deleteOnTermination: boolean;
    kmsKeyId?: string;
    snapshotId?: string;
  };

  // Network Settings
  network: {
    subnetId: string;
    assignPublicIp: boolean;
    securityGroupIds: string[];
  };

  // IAM Instance Profile
  iamInstanceProfileArn: string;
  iamInstanceProfileName: string;

  // Shutdown Behavior
  shutdownBehavior: "stop" | "terminate";

  // Tags (instance, volume, network interface)
  instanceTags: Array<{ Key: string; Value: string }>;
  volumeTags: Array<{ Key: string; Value: string }>;
  networkInterfaceTags: Array<{ Key: string; Value: string }>;
}

// ─── Create / Edit Version Form State ────────────────────────────────────────
// String-valued fields mirror what the form inputs hold so the UI never has to
// juggle number/string conversions mid-render. Numeric values are parsed and
// validated at submit time.

export type RootVolumeType = NonNullable<LaunchTemplateEbsBlockDevice["VolumeType"]>;

export type RootVolumeExtras = Omit<
  LaunchTemplateEbsBlockDevice,
  "VolumeSize" | "VolumeType" | "Encrypted" | "DeleteOnTermination"
>;

/** Key/value pair as edited by the TagEditor component. */
export interface LaunchTemplateTagDraft {
  key: string;
  value: string;
}

export interface LaunchTemplateCreateFormState {
  /** Template name — required on create, read-only when creating a version. */
  launchTemplateName: string;
  /** Description stored on the version being created. */
  versionDescription: string;

  // Machine image (AMI)
  imageId: string;

  // Instance type
  instanceType: string;

  // Key pair
  keyName: string;

  // Security groups (applied to the primary network interface)
  securityGroupIds: string[];

  // Root volume — device name comes from the AMI (or the source version)
  rootDeviceName: string;
  rootVolume: {
    volumeSize: string;
    volumeType: RootVolumeType;
    encrypted: boolean;
    deleteOnTermination: boolean;
  };
  /** Fields from the source version that the form does not edit (IOPS, KMS key…). */
  rootVolumeExtras: RootVolumeExtras;

  // Network settings
  network: {
    subnetId: string;
    assignPublicIp: boolean;
  };

  // IAM instance profile (name or ARN)
  iamInstanceProfile: string;

  // Shutdown behavior
  shutdownBehavior: "stop" | "terminate";

  // Tags — applied to instances, volumes and network interfaces at launch
  resourceTags: LaunchTemplateTagDraft[];
  volumeTags: LaunchTemplateTagDraft[];
  networkInterfaceTags: LaunchTemplateTagDraft[];
}

export const DEFAULT_ROOT_DEVICE_NAME = "/dev/sda1";
export const DEFAULT_ROOT_VOLUME_SIZE = "8";
export const DEFAULT_ROOT_VOLUME_TYPE: RootVolumeType = "gp3";

export function createEmptyLaunchTemplateForm(): LaunchTemplateCreateFormState {
  return {
    launchTemplateName: "",
    versionDescription: "",
    imageId: "",
    instanceType: "",
    keyName: "",
    securityGroupIds: [],
    rootDeviceName: DEFAULT_ROOT_DEVICE_NAME,
    rootVolume: {
      volumeSize: DEFAULT_ROOT_VOLUME_SIZE,
      volumeType: DEFAULT_ROOT_VOLUME_TYPE,
      encrypted: false,
      deleteOnTermination: true,
    },
    rootVolumeExtras: {},
    network: { subnetId: "", assignPublicIp: true },
    iamInstanceProfile: "",
    shutdownBehavior: "stop",
    resourceTags: [],
    volumeTags: [],
    networkInterfaceTags: [],
  };
}

// ─── API Response Types ────────────────────────────────────────────────────────
// Shapes returned by /api/launch-template. Every response may carry `error`.

export interface DescribeLaunchTemplatesResponse {
  templates?: LaunchTemplate[];
  error?: string;
}

export interface GetLaunchTemplateResponse {
  template?: LaunchTemplate;
  error?: string;
}

export interface DescribeLaunchTemplateVersionsResponse {
  versions?: LaunchTemplateVersion[];
  error?: string;
}

export interface GetLaunchTemplateVersionResponse {
  version?: LaunchTemplateVersion;
  error?: string;
}

export interface CreateLaunchTemplateResponse {
  template?: LaunchTemplate;
  warning?: { Errors?: Array<{ Code?: string; Message?: string }> };
  error?: string;
}

export interface CreateLaunchTemplateVersionResponse {
  version?: LaunchTemplateVersion;
  error?: string;
}

export interface DeleteLaunchTemplateResponse {
  template?: LaunchTemplate;
  error?: string;
}

export interface DeleteLaunchTemplateVersionsResponse {
  successfullyDeleted?: Array<{ VersionNumber?: number; ReturnCode?: string }>;
  unsuccessfullyDeleted?: Array<{
    VersionNumber?: number;
    ResponseError?: { Code?: string; Message?: string };
  }>;
  error?: string;
}

export interface ModifyLaunchTemplateResponse {
  template?: LaunchTemplate;
  error?: string;
}

// ─── UI Display Types ──────────────────────────────────────────────────────────

export interface LaunchTemplateListItem {
  LaunchTemplateId: string;
  LaunchTemplateName: string;
  LatestVersionNumber: number;
  DefaultVersionNumber: number;
  CreateTime: string;
  CreatedBy?: string;
  Tags?: Array<{ Key?: string; Value?: string }>;
}
