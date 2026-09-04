/**
 * S3 Types — Separate from generic aws.ts.
 */

export interface S3BucketConfig {
  Name?: string;
  Region?: string;
  ACL?: 'private' | 'public-read' | 'public-read-write' | 'authenticated-read';
  Versioning?: boolean;
  Encryption?: 'AES256' | 'aws:kms';
  Tags?: Array<{ Key?: string; Value?: string }>;
}

export interface S3ObjectConfig {
  Key?: string;
  Bucket?: string;
  StorageClass?: 'STANDARD' | 'REDUCED_REDUNDANCY' | 'GLACIER' | 'STANDARD_IA';
  Metadata?: Record<string, string>;
}
