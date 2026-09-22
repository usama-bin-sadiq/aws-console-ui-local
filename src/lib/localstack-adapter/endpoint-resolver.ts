/**
 * Adapter Endpoint Resolver — Resolves endpoint for any adapter mode.
 * All 150 services must use this resolver. No exceptions. No stubs.
 */

import { EndpointResolution } from '@/types/adapter';
import { ADAPTER_CONFIG } from '@/config/adapter-config';

export function resolveEndpoint(adapterMode?: 'localstack' | 'ministack'): EndpointResolution {
  const mode = adapterMode || ADAPTER_CONFIG.adapterMode;

  if (mode === 'ministack') {
    const host = ADAPTER_CONFIG.endpointConfig.minstackHostname;
    const port = ADAPTER_CONFIG.endpointConfig.minstackPort;
    const ssl = ADAPTER_CONFIG.endpointConfig.minstackSslEnabled;
    return {
      protocol: ssl ? 'https' : 'http',
      hostname: host,
      port,
      url: `${ssl ? 'https' : 'http'}://${host}:${port}`,
      sslEnabled: ssl,
    };
  }

  const host = ADAPTER_CONFIG.endpointConfig.localstackHostname;
  const port = ADAPTER_CONFIG.endpointConfig.localstackPort;
  const ssl = ADAPTER_CONFIG.endpointConfig.localstackSslEnabled;
  return {
    protocol: ssl ? 'https' : 'http',
    hostname: host,
    port,
    url: `${ssl ? 'https' : 'http'}://${host}:${port}`,
    sslEnabled: ssl,
  };
}
