/**
 * Cognito Types
 */
export interface CognitoUserPoolConfig {
  PoolName?: string;
  AutoVerifiedAttributes?: string[];
  Schema?: Array<{ Name?: string; AttributeDataType?: 'String' | 'Number' | 'Boolean' }>;
}
