/**
 * Key Pair Types — Dedicated interfaces for EC2 Key Pairs.
 * Separated from generic ec2.ts per AGENTS.md Section 3.1.
 */

export type KeyPairType = "rsa" | "ed25519";
export type KeyPairFormat = "pem" | "ppk";

export interface KeyPair {
  KeyName?: string;
  KeyPairId?: string;
  KeyFingerprint?: string;
  KeyType?: KeyPairType;
  Tags?: Array<{ Key?: string; Value?: string }>;
  CreateTime?: Date;
  KeyMaterial?: string; // Only returned on create
}

export interface CreateKeyPairRequest {
  KeyName: string;
  KeyType?: KeyPairType;
  KeyFormat?: KeyPairFormat;
  TagSpecifications?: Array<{
    ResourceType: "key-pair";
    Tags: Array<{ Key: string; Value: string }>;
  }>;
  DryRun?: boolean;
}

export interface ImportKeyPairRequest {
  KeyName: string;
  PublicKeyMaterial: string | Uint8Array;
  KeyType?: KeyPairType;
  TagSpecifications?: Array<{
    ResourceType: "key-pair";
    Tags: Array<{ Key: string; Value: string }>;
  }>;
  DryRun?: boolean;
}

export interface DescribeKeyPairsRequest {
  KeyNames?: string[];
  KeyPairIds?: string[];
  Filters?: Array<{
    Name: string;
    Values: string[];
  }>;
  DryRun?: boolean;
}

export interface DeleteKeyPairRequest {
  KeyName?: string;
  KeyPairId?: string;
  DryRun?: boolean;
}

export interface KeyPairDetailViewProps {
  keyPair: KeyPair;
  onClose: () => void;
  onDelete: () => void;
}

/** Shape returned by the /api/ec2 key pair actions. */
export interface KeyPairApiResponse {
  success?: boolean;
  error?: string;
  keyPairs?: KeyPair[];
  keyPair?: KeyPair;
}
