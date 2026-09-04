/**
 * Lambda Types
 */

export interface LambdaFunctionConfig {
  FunctionName?: string;
  Runtime?: 'nodejs20.x' | 'python3.12' | 'java21';
  Handler?: string;
  MemorySize?: number;
  Timeout?: number;
  Role?: string;
  Environment?: Record<string, string>;
  Tags?: Array<{ Key?: string; Value?: string }>;
}

export interface LambdaAliasConfig {
  AliasName?: string;
  FunctionName?: string;
  FunctionVersion?: string;
  RoutingConfig?: { AdditionalVersionWeights?: Record<string, number> };
}
