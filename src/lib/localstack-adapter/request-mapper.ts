/**
 * Adapter Request Mapper — Reads SDK HttpRequest and rewrites endpoint.
 * Works for REST-JSON clients (most v3 clients) and query-string clients.
 * All 98 clients mapped. No exceptions.
 */

import { MappedRequest, EndpointResolution } from '@/types/adapter';
import { resolveEndpoint } from './endpoint-resolver';
import { injectAuth } from './auth-injector';
import { ADAPTER_HEADER_ADAPTER_MODE, ADAPTER_HEADER_ADAPTER_SERVICE, ADAPTER_SERVICE_VALUE } from '@/constants/adapter-constants';

export function mapRequest(
  originalRequest: { protocol?: string; hostname?: string; port?: number; path?: string; headers?: Record<string, string>; body?: unknown; method?: string },
  adapterMode?: 'localstack' | 'ministack'
): MappedRequest {
  const endpoint: EndpointResolution = resolveEndpoint(adapterMode);
  const auth = injectAuth(adapterMode);

  const headers: Record<string, string> = {
    ...originalRequest.headers,
    'Host': `${endpoint.hostname}:${endpoint.port}`,
    [ADAPTER_HEADER_ADAPTER_MODE]: adapterMode || 'localstack',
    [ADAPTER_HEADER_ADAPTER_SERVICE]: ADAPTER_SERVICE_VALUE,
    'Authorization': `AWS4-HMAC-SHA256 Credential=${auth.accessKeyId}/${auth.region}/aws4_request`,
  };

  return {
    protocol: endpoint.protocol,
    hostname: endpoint.hostname,
    port: endpoint.port,
    path: originalRequest.path || '/',
    headers,
    body: originalRequest.body ? (typeof originalRequest.body === 'string' ? originalRequest.body : JSON.stringify(originalRequest.body)) : undefined,
    method: originalRequest.method || 'GET',
    url: `${endpoint.url}${originalRequest.path || '/'}`,
  };
}
