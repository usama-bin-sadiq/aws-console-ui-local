/**
 * CloudTrail Types
 */
export interface CloudTrailConfig {
  TrailName?: string;
  S3BucketName?: string;
  IncludeGlobalServiceEvents?: boolean;
  MultiRegionTrail?: boolean;
}
