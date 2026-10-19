/**
 * AMI Types — Strongly typed interfaces for AMI operations.
 * Mirrors AWS EC2 Image and related types.
 */

export interface AMI {
  ImageId: string;
  Name?: string;
  Description?: string;
  State?: "available" | "pending" | "failed" | "deregistered" | "transient" | "temporary" | string;
  Architecture?: "i386" | "x86_64" | "arm64" | "x86_64_mac" | "arm64_mac" | string;
  CreationDate?: string;
  ImageOwnerAlias?: string;
  OwnerId?: string;
  Platform?: "windows" | string;
  PlatformDetails?: string;
  UsageOperation?: string;
  RootDeviceType?: "ebs" | "instance-store" | string;
  RootDeviceName?: string;
  VirtualizationType?: "hvm" | "paravirtual" | string;
  Public?: boolean;
  ImageType?: "machine" | "kernel" | "ramdisk" | string;
  KernelId?: string;
  RamdiskId?: string;
  SriovNetSupport?: string;
  EnaSupport?: boolean;
  Hypervisor?: "xen" | "nitro" | string;
  BlockDeviceMappings?: BlockDeviceMapping[];
  Tags?: Array<{ Key?: string; Value?: string }>;
  ProductCodes?: ProductCode[];
  BillingProducts?: string[];
  ImdsSupport?: "v2.0" | string;
  BootMode?: "legacy-bios" | "uefi" | "uefi-preferred" | string;
  TpmSupport?: "v2.0" | string;
  DeprecationTime?: string;
  /** S3 location the image manifest was registered from, when applicable. */
  ImageLocation?: string;
  /** Instance the image was created from (CreateImage), when applicable. */
  SourceInstanceId?: string;
}

export interface BlockDeviceMapping {
  DeviceName?: string;
  VirtualName?: string;
  Ebs?: EbsBlockDevice;
  NoDevice?: string;
}

export interface EbsBlockDevice {
  SnapshotId?: string;
  VolumeSize?: number;
  DeleteOnTermination?: boolean;
  VolumeType?: "standard" | "io1" | "io2" | "gp2" | "gp3" | "sc1" | "st1" | string;
  Iops?: number;
  Throughput?: number;
  Encrypted?: boolean;
  KmsKeyId?: string;
  OutpostArn?: string;
}

export interface ProductCode {
  ProductCodeId?: string;
  ProductCodeType?: "devpay" | "marketplace" | string;
}

export interface LaunchPermission {
  /** "all" makes the image public — matches the EC2 PermissionGroup type. */
  Group?: "all";
  /** AWS account ID granted launch permission. */
  UserId?: string;
}

export interface LaunchPermissionModification {
  Add?: LaunchPermission[];
  Remove?: LaunchPermission[];
}

/** A snapshot associated with an image's block device mappings. */
export interface AMISnapshot {
  SnapshotId: string;
  State?: string;
  Description?: string;
  VolumeSize?: number;
  VolumeType?: string;
  Encrypted?: boolean;
  KmsKeyId?: string;
  Progress?: string;
  StartTime?: string;
  OwnerId?: string;
  Tags?: Array<{ Key?: string; Value?: string }>;
}

export interface KmsKeyInfo {
  KeyId?: string;
  KeyArn?: string;
  Description?: string;
  Enabled?: boolean;
}

export interface RegionInfo {
  RegionName?: string;
  Endpoint?: string;
  OptInStatus?: string;
}

export interface CopyImageParams {
  SourceRegion: string;
  SourceImageId: string;
  Name: string;
  Description?: string;
  Encrypted?: boolean;
  KmsKeyId?: string;
  Tags?: Array<{ Key: string; Value: string }>;
  DryRun?: boolean;
}

export interface RegisterImageParams {
  Name: string;
  Description?: string;
  ImageLocation?: string;
  Architecture?: "i386" | "x86_64" | "arm64" | "x86_64_mac" | "arm64_mac";
  RootDeviceName?: string;
  BlockDeviceMappings?: BlockDeviceMapping[];
  VirtualizationType?: "hvm" | "paravirtual";
  EnaSupport?: boolean;
  SriovNetSupport?: string;
  BootMode?: "legacy-bios" | "uefi" | "uefi-preferred";
  TpmSupport?: "v2.0";
  ImdsSupport?: "v2.0";
  KernelId?: string;
  RamdiskId?: string;
  BillingProducts?: string[];
  Tags?: Array<{ Key: string; Value: string }>;
  DryRun?: boolean;
}

export interface CreateSnapshotFromImageParams {
  ImageId: string;
  Description?: string;
  Tags?: Array<{ Key: string; Value: string }>;
}

export interface ImageAttribute {
  ImageId?: string;
  LaunchPermissions?: LaunchPermission[];
  ProductCodes?: ProductCode[];
  BlockDeviceMappings?: BlockDeviceMapping[];
  Description?: { Value?: string };
  Kernel?: { Value?: string };
  Ramdisk?: { Value?: string };
  SriovNetSupport?: { Value?: string };
}

/**
 * Typed request body for POST /api/ami. Field names mirror the EC2 API so the
 * route can forward them to the SDK without casts. Register/copy field unions
 * are subsets of the corresponding SDK enum types.
 */
export interface AmiPostBody {
  action?: string;
  // Copy image
  SourceRegion?: string;
  SourceImageId?: string;
  Name?: string;
  Description?: string;
  Encrypted?: boolean;
  KmsKeyId?: string;
  // Register image
  Architecture?: "i386" | "x86_64" | "arm64" | "x86_64_mac" | "arm64_mac";
  RootDeviceName?: string;
  RootDeviceType?: "ebs" | "instance-store";
  VirtualizationType?: "hvm" | "paravirtual";
  EnaSupport?: boolean;
  SriovNetSupport?: string;
  BootMode?: "legacy-bios" | "uefi" | "uefi-preferred";
  TpmSupport?: "v2.0";
  ImdsSupport?: "v2.0";
  KernelId?: string;
  RamdiskId?: string;
  BillingProducts?: string[];
  ImageLocation?: string;
  S3Bucket?: string;
  S3Key?: string;
  BlockDeviceMappings?: Array<{
    DeviceName?: string;
    VirtualName?: string;
    NoDevice?: string;
    Ebs?: {
      SnapshotId?: string;
      VolumeSize?: number;
      DeleteOnTermination?: boolean;
      VolumeType?: "standard" | "io1" | "io2" | "gp2" | "gp3" | "sc1" | "st1";
      Iops?: number;
      Throughput?: number;
      Encrypted?: boolean;
      KmsKeyId?: string;
      OutpostArn?: string;
    };
  }>;
  // Launch permissions, tags, snapshots, deregister
  ImageId?: string;
  Add?: LaunchPermission[];
  Remove?: LaunchPermission[];
  Resources?: string[];
  Keys?: string[];
  Tags?: Array<{ Key: string; Value: string }>;
}

/** Typed response envelope for /api/ami (GET/POST/DELETE). */
export interface AmiApiResponse {
  images?: AMI[];
  image?: AMI | null;
  snapshots?: AMISnapshot[];
  keys?: KmsKeyInfo[];
  regions?: RegionInfo[];
  attribute?: ImageAttribute;
  imageId?: string;
  snapshotId?: string;
  success?: boolean;
  error?: string;
  [key: string]: unknown;
}

export type AMIState =
  | "available"
  | "pending"
  | "failed"
  | "deregistered"
  | "transient"
  | "temporary";

export type StatusColor =
  | "success"
  | "warning"
  | "error"
  | "info"
  | "in-progress"
  | "stopped"
  | "pending";

export function getStateType(state?: string): StatusColor {
  switch (state?.toLowerCase()) {
    case "available":
      return "success";
    case "pending":
    case "transient":
    case "temporary":
      return "in-progress";
    case "failed":
      return "error";
    case "deregistered":
      return "stopped";
    default:
      return "info";
  }
}

export function getVisibilityLabel(publicFlag?: boolean): {
  label: string;
  type: "success" | "warning";
} {
  if (publicFlag) {
    return { label: "Public", type: "warning" };
  }
  return { label: "Private", type: "success" };
}

/**
 * Human-readable Source shown in the console's AMI table: where the image
 * came from (AWS Marketplace, Amazon, an instance, an S3 manifest, or a
 * custom registration).
 */
export function getSourceLabel(image: AMI): string {
  if (image.ImageOwnerAlias === "aws-marketplace") return "AWS Marketplace";
  if (image.ImageOwnerAlias === "amazon") return "Amazon";
  if (image.SourceInstanceId) return "Instance";
  const location = image.ImageLocation ?? "";
  if (
    location.endsWith(".manifest.xml") ||
    /\.s3[.-]/.test(location) ||
    /s3[.-][a-z0-9-]*\.amazonaws\.com/.test(location)
  ) {
    return "S3";
  }
  return "Custom";
}

/** Platform column: EC2 only reports a Platform for Windows; otherwise use PlatformDetails. */
export function platformLabel(image: AMI): string {
  if (image.Platform === "windows") return "Windows";
  return image.PlatformDetails ?? "—";
}

/** Formats an ISO timestamp (e.g. CreationDate) for table/detail display. */
export function formatDate(iso?: string): string {
  if (!iso) return "—";
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleString();
}

export const ARCHITECTURE_OPTIONS = [
  { value: "x86_64", label: "x86_64 (64-bit)" },
  { value: "arm64", label: "arm64 (64-bit ARM)" },
  { value: "i386", label: "i386 (32-bit)" },
  { value: "x86_64_mac", label: "x86_64_mac (macOS)" },
  { value: "arm64_mac", label: "arm64_mac (macOS ARM)" },
] as const;

export const VIRTUALIZATION_OPTIONS = [
  { value: "hvm", label: "HVM (Hardware Virtual Machine)" },
  { value: "paravirtual", label: "Paravirtual (PV)" },
] as const;

export const ROOT_DEVICE_OPTIONS = [
  { value: "ebs", label: "EBS-backed" },
  { value: "instance-store", label: "Instance store-backed" },
] as const;

export const VOLUME_TYPE_OPTIONS = [
  { value: "gp3", label: "General Purpose SSD (gp3)" },
  { value: "gp2", label: "General Purpose SSD (gp2)" },
  { value: "io2", label: "Provisioned IOPS SSD (io2)" },
  { value: "io1", label: "Provisioned IOPS SSD (io1)" },
  { value: "st1", label: "Throughput Optimized HDD (st1)" },
  { value: "sc1", label: "Cold HDD (sc1)" },
  { value: "standard", label: "Magnetic (standard)" },
] as const;

export const BOOT_MODE_OPTIONS = [
  { value: "legacy-bios", label: "Legacy BIOS" },
  { value: "uefi", label: "UEFI" },
  { value: "uefi-preferred", label: "UEFI Preferred" },
] as const;
