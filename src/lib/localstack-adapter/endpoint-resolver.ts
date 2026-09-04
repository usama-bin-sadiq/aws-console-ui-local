/**
 * Adapter Endpoint Resolver — Resolves endpoint for any adapter mode.
 * All 150 services must use this resolver. No exceptions. No stubs.
 */

import { EndpointResolution } from '@/types/adapter';
import { ADAPTER_CONFIG } from '@/config/adapter-config';

export function resolveEndpoint(adapterMode?: 'localstack' | 'minstack' | 'real'): EndpointResolution {
  const mode = adapterMode || ADAPTER_CONFIG.adapterMode;

  if (mode === 'real') {
    const url = ADAPTER_CONFIG.endpointConfig.realEndpointUrl || 'https://amazonaws.com';
    return {
      protocol: url.startsWith('https') ? 'https' : 'http',
      hostname: url.replace(/^https?:\/\//, '').split(':')[0],
      port: url.includes(':') ? parseInt(url.split(':').pop() || '443', 10) : 443,
      url,
      sslEnabled: url.startsWith('https'),
    };
  }

  if (mode === 'minstack') {
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
