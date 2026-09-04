/**
 * VERIFICATION GATE CHECKLIST (Phase 5 — S3 Buckets + Objects)
 * [x] S3_DEFAULT_REGION defined
 * [x] S3_BUCKET_RULES defined per PRD
 * [x] S3_REGION_OPTIONS for wizard select
 * [x] S3_ENCRYPTION_OPTIONS (AES256, aws:kms)
 * [x] S3_VERSIONING_OPTIONS
 * [x] S3_BLOCK_PUBLIC_ACCESS_OPTIONS
 * [x] S3_STORAGE_CLASSES
 */

/**
 * S3 Constants — Per PRD §9.2.2, §15.2, §16.1.
 */
export const S3_DEFAULT_REGION = 'us-east-1';
export const S3_BUCKET_RULES = [
  'Bucket name must be globally unique',
  'Must start with lowercase letter or number',
  'Only lowercase letters, numbers, hyphens allowed',
  'Length between 3 and 63 characters',
];

export const S3_REGION_OPTIONS = [
  { value: 'us-east-1', label: 'US East (N. Virginia)' },
  { value: 'us-east-2', label: 'US East (Ohio)' },
  { value: 'us-west-1', label: 'US West (N. California)' },
  { value: 'us-west-2', label: 'US West (Oregon)' },
  { value: 'eu-west-1', label: 'Europe (Ireland)' },
  { value: 'eu-central-1', label: 'Europe (Frankfurt)' },
  { value: 'ap-southeast-1', label: 'Asia Pacific (Singapore)' },
];

export const S3_ENCRYPTION_OPTIONS = [
  { value: 'AES256', label: 'SSE-S3 (AES-256)' },
  { value: 'aws:kms', label: 'SSE-KMS (AWS KMS key)' },
];

export const S3_VERSIONING_OPTIONS = [
  { value: 'Enabled', label: 'Enabled' },
  { value: 'Suspended', label: 'Suspended' },
];

export const S3_BLOCK_PUBLIC_ACCESS_OPTIONS = [
  { value: true, label: 'Block all public access' },
  { value: false, label: 'Allow public access' },
];

export const S3_STORAGE_CLASSES = [
  'STANDARD',
  'REDUCED_REDUNDANCY',
  'STANDARD_IA',
  'ONEZONE_IA',
  'INTELLIGENT_TIERING',
  'GLACIER',
  'GLACIER_IR',
  'DEEP_ARCHIVE',
];
