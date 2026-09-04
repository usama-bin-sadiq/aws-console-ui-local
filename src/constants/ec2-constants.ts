/**
 * EC2 Constants — Service-level constants for EC2 feature parity.
 * PRD §9.2.1, §15.1
 */

// ─── Instance States ───────────────────────────────────────────────────────

export const EC2_INSTANCE_STATES = [
  "running",
  "stopped",
  "pending",
  "terminated",
  "stopping",
  "shutting-down",
  "rebooting",
] as const;

export type EC2InstanceState = (typeof EC2_INSTANCE_STATES)[number];

// ─── Instance Types ────────────────────────────────────────────────────────

export const EC2_INSTANCE_FAMILIES = [
  "t3",
  "t3a",
  "t2",
  "m5",
  "m5a",
  "m6i",
  "m6a",
  "c5",
  "c5a",
  "c6i",
  "r5",
  "r5a",
  "r6i",
  "i3",
  "i3en",
  "d2",
  "g4dn",
  "g5",
  "p3",
  "p4d",
  "a1",
  "c6g",
  "m6g",
  "r6g",
] as const;

export const EC2_DEFAULT_INSTANCE_TYPE = "t3.micro";
export const EC2_DEFAULT_IMAGE_ID = "ami-0abcdef123456";
export const EC2_DEFAULT_VPC_ID = "vpc-12345678";
export const EC2_DEFAULT_SUBNET_ID = "subnet-12345678";
export const EC2_DEFAULT_KEY_PAIR = "aws-console-key";

// ─── Volume Types ──────────────────────────────────────────────────────────

export const EC2_VOLUME_TYPES = [
  { value: "gp3", label: "gp3 (General Purpose SSD)" },
  { value: "gp2", label: "gp2 (General Purpose SSD)" },
  { value: "io2", label: "io2 (Provisioned IOPS SSD)" },
  { value: "io1", label: "io1 (Provisioned IOPS SSD)" },
  { value: "st1", label: "st1 (Throughput Optimized HDD)" },
  { value: "sc1", label: "sc1 (Cold HDD)" },
  { value: "standard", label: "standard (Magnetic)" },
] as const;

export const EC2_VOLUME_TYPE_VALUES = [
  "gp2",
  "gp3",
  "io1",
  "io2",
  "st1",
  "sc1",
  "standard",
] as const;

export const EC2_DEFAULT_VOLUME_SIZE = 8;
export const EC2_DEFAULT_VOLUME_TYPE = "gp3";

// ─── Architecture ──────────────────────────────────────────────────────────

export const EC2_ARCHITECTURES = ["x86_64", "arm64"] as const;

// ─── Root Device Types ─────────────────────────────────────────────────────

export const EC2_ROOT_DEVICE_TYPES = ["ebs", "instance-store"] as const;

// ─── Virtualization Types ──────────────────────────────────────────────────

export const EC2_VIRTUALIZATION_TYPES = ["hvm", "paravirtual"] as const;

// ─── Placement Strategies ──────────────────────────────────────────────────

export const EC2_PLACEMENT_STRATEGIES = ["cluster", "spread", "partition"] as const;

// ─── Shutdown Behavior ─────────────────────────────────────────────────────

export const EC2_SHUTDOWN_BEHAVIORS = ["stop", "terminate"] as const;

// ─── Purchasing Options ────────────────────────────────────────────────────

export const EC2_PURCHASING_OPTIONS = [
  { value: "on-demand", label: "On-Demand" },
  { value: "spot", label: "Spot" },
  { value: "reserved", label: "Reserved" },
] as const;

// ─── Service Route ─────────────────────────────────────────────────────────

export const EC2_SERVICE_ROUTE = "/ec2";

// ─── AMI Owners ────────────────────────────────────────────────────────────

export const EC2_AMI_OWNERS = [
  { value: "amazon", label: "Amazon" },
  { value: "self", label: "Self" },
  { value: "marketplace", label: "AWS Marketplace" },
] as const;

// ─── Key Pair Types ────────────────────────────────────────────────────────

export const EC2_KEY_PAIR_TYPES = ["rsa", "ed25519"] as const;

// ─── Default Tags ──────────────────────────────────────────────────────────

export const EC2_DEFAULT_TAGS = [
  { Key: "Environment", Value: "dev" },
  { Key: "Project", Value: "aws-console-emulator" },
] as const;
