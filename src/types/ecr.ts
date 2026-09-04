/**
 * ECR Types
 */

export interface ECRRepositoryConfig {
  RepositoryName?: string;
  ImageScanningConfiguration?: { scanOnPush?: boolean };
  ImageTagMutability?: 'MUTABLE' | 'IMMUTABLE';
  EncryptionConfiguration?: { encryptionType?: 'AES256' | 'KMS'; kmsKey?: string };
  Tags?: Array<{ Key?: string; Value?: string }>;
}
