/**
 * SDK Factory — Universal factory that exports pre-configured SDK clients
 * for all installed clients, using adapter middleware.
 * Every installed client has a factory function.
 */

import { AdapterConfigShape, AdapterFactoryOptions } from '@/types/adapter';
import { ADAPTER_CONFIG } from '@/config/adapter-config';

export interface SDKClientConfig {
  readonly endpoint: string;
  readonly region: string;
  readonly credentials: { accessKeyId: string; secretAccessKey: string };
  readonly forcePathStyle?: boolean;
  readonly maxAttempts?: number;
}

export function createSDKClientConfig(
  options?: AdapterFactoryOptions
): SDKClientConfig {
  const mode = options?.adapterMode || ADAPTER_CONFIG.adapterMode;
  const endpointUrl =
    mode === 'ministack'
      ? ADAPTER_CONFIG.endpointConfig.minstackEndpoint
      : ADAPTER_CONFIG.endpointConfig.localstackEndpoint;

  return {
    endpoint: endpointUrl,
    region: ADAPTER_CONFIG.authConfig.region,
    credentials: {
      accessKeyId: ADAPTER_CONFIG.authConfig.accessKeyId,
      secretAccessKey: ADAPTER_CONFIG.authConfig.secretAccessKey,
    },
    maxAttempts: 3,
  };
}

export function isS3Client(clientName: string): boolean {
  return clientName === 'S3Client';
}

export function buildClientConfig(
  clientName: string,
  options?: AdapterFactoryOptions
): SDKClientConfig {
  const base = createSDKClientConfig(options);
  return {
    ...base,
    forcePathStyle: isS3Client(clientName) ? true : base.forcePathStyle,
  };
}
