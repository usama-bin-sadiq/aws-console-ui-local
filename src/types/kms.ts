/**
 * KMS Types
 */

export interface KMSKeyConfig {
  KeyUsage?: "ENCRYPT_DECRYPT" | "SIGN_VERIFY" | "MAC";
  KeySpec?: "SYMMETRIC_DEFAULT" | "RSA_2048";
  Alias?: string;
  Tags?: Array<{ Key?: string; Value?: string }>;
}
