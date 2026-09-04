/**
 * Secrets Manager Types
 */

export interface SecretConfig {
  SecretName?: string;
  SecretString?: string;
  KmsKeyId?: string;
  Tags?: Array<{ Key?: string; Value?: string }>;
}
