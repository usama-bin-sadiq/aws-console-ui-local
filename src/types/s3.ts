/**
 * VERIFICATION GATE CHECKLIST (Phase 5 — S3 Buckets + Objects)
 * [x] Extended S3BucketConfig with BlockPublicAccess, ObjectLockEnabled, Policy, Website, LifecycleRules
 * [x] Added S3BucketSummary, S3BucketPolicyStatement, S3BucketPolicy
 * [x] Added S3VersioningConfig, S3Tag, S3LifecycleRule, S3WebsiteConfig
 * [x] Types exported for reuse across components
 */

/**
 * S3 Types — Separate from generic aws.ts.
 * Extended for Phase 5: Buckets + Objects (Complete) per PRD §9.2.2, §15.2, §15.14.
 */

export interface S3BucketConfig {
  Name?: string;
  Region?: string;
  ACL?: 'private' | 'public-read' | 'public-read-write' | 'authenticated-read';
  Versioning?: boolean;
  Encryption?: 'AES256' | 'aws:kms';
  Tags?: Array<{ Key?: string; Value?: string }>;
  BlockPublicAccess?: boolean;
  ObjectLockEnabled?: boolean;
  Policy?: string;
  Website?: {
    IndexDocument?: { Suffix?: string };
    ErrorDocument?: { Key?: string };
    RedirectAllRequestsTo?: { HostName?: string; Protocol?: string };
  };
  LifecycleRules?: Array<Record<string, unknown>>;
}

export interface S3BucketSummary {
  Name?: string;
  Region?: string;
  CreationDate?: string | Date;
  VersioningEnabled?: boolean;
  Encryption?: {
    ServerSideEncryptionConfiguration?: {
      Rules?: Array<{
        ApplyServerSideEncryptionByDefault?: {
          SSEAlgorithm?: string;
          KMSMasterKeyID?: string;
        };
      }>;
    };
  };
}

export interface S3ObjectConfig {
  Key?: string;
  Bucket?: string;
  StorageClass?: 'STANDARD' | 'REDUCED_REDUNDANCY' | 'GLACIER' | 'STANDARD_IA';
  Metadata?: Record<string, string>;
  Size?: number;
  LastModified?: string | Date;
  ETag?: string;
  StorageClass?: string;
}

export interface S3BucketPolicyStatement {
  Sid?: string;
  Effect?: string;
  Principal?: string | Record<string, unknown>;
  Action?: string | string[];
  Resource?: string | string[];
  Condition?: Record<string, unknown>;
}

export interface S3BucketPolicy {
  Version?: string;
  Statement?: S3BucketPolicyStatement[];
}

export interface S3VersioningConfig {
  Status?: 'Enabled' | 'Suspended';
  MFADelete?: 'Enabled' | 'Disabled';
}

export interface S3Tag {
  Key?: string;
  Value?: string;
}

export interface S3LifecycleRule {
  ID?: string;
  Status?: 'Enabled' | 'Disabled';
  Filter?: Record<string, unknown>;
  Transitions?: Array<{ Days?: number; StorageClass?: string }>;
  Expiration?: { Days?: number; ExpiredObjectDeleteMarker?: boolean };
  NoncurrentVersionTransitions?: Array<{ NoncurrentDays?: number; StorageClass?: string }>;
  NoncurrentVersionExpiration?: { NoncurrentDays?: number };
}

export interface S3WebsiteConfig {
  IndexDocument?: { Suffix?: string };
  ErrorDocument?: { Key?: string };
  RedirectAllRequestsTo?: { HostName?: string; Protocol?: string };
}
