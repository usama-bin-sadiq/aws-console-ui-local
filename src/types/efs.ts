/**
 * EFS Types
 */

export interface EFSFileSystemConfig {
  FileSystemName?: string;
  PerformanceMode?: "generalPurpose" | "maxIO";
  ThroughputMode?: "bursting" | "provisioned" | "elastic";
  ProvisionedThroughputInMibps?: number;
  Encrypted?: boolean;
  Tags?: Array<{ Key?: string; Value?: string }>;
}
