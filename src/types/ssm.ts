/**
 * SSM Types
 */
export interface SSMParameterConfig {
  Name?: string;
  Type?: 'String' | 'StringList' | 'SecureString';
  Value?: string;
  Overwrite?: boolean;
}
