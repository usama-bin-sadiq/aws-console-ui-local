/**
 * SDK Adapter Middleware — Universal middleware that wraps SDK HttpHandler.
 * Applies endpoint rewrite and auth injection when adapter is active.
 */

import { ADAPTER_CONFIG } from '@/config/adapter-config';
import { resolveEndpoint } from './localstack-adapter/endpoint-resolver';
import { injectAuth } from './localstack-adapter/auth-injector';

export interface MiddlewareOptions {
  readonly adapterMode?: 'localstack' | 'ministack' | 'real';
  readonly disableAdapter?: boolean;
}

export interface HttpRequestLike {
  readonly hostname?: string;
  readonly port?: number;
  readonly protocol?: string;
  readonly path?: string;
  readonly method?: string;
  readonly headers?: Record<string, string>;
  readonly body?: unknown;
}

export interface HttpResponseLike {
  readonly statusCode: number;
  readonly headers?: Record<string, string>;
  readonly body?: string | Buffer | Uint8Array;
}

export function isAdapterDisabled(options?: MiddlewareOptions): boolean {
  if (options?.disableAdapter) return true;
  const mode = options?.adapterMode || ADAPTER_CONFIG.adapterMode;
  return mode === 'real';
}

export function createAdapterMiddleware(options?: MiddlewareOptions) {
  const disabled = isAdapterDisabled(options);
  return function adapterMiddleware(
    nextRequest: HttpRequestLike,
    nextHandler?: (req: HttpRequestLike) => Promise<HttpResponseLike>
  ): Promise<HttpResponseLike> {
    if (disabled) {
      if (nextHandler) {
        return nextHandler(nextRequest);
      }
      return Promise.resolve({
        statusCode: 200,
        headers: { 'content-type': 'application/json' },
        body: '{}',
      } as HttpResponseLike);
    }

    const endpoint = resolveEndpoint(options?.adapterMode);
    const auth = injectAuth(options?.adapterMode);

    const rewrittenRequest: HttpRequestLike = {
      ...nextRequest,
      protocol: endpoint.protocol,
      hostname: endpoint.hostname,
      port: endpoint.port,
      headers: {
        ...nextRequest.headers,
        'Host': `${endpoint.hostname}:${endpoint.port}`,
        'x-adapter-mode': options?.adapterMode || 'localstack',
        'x-adapter-service': 'aws-console-emulator',
        'Authorization': `AWS4-HMAC-SHA256 Credential=${auth.accessKeyId}/${auth.region}/aws4_request`,
      },
    };

    if (nextHandler) {
      return nextHandler(rewrittenRequest);
    }
    return Promise.resolve({
      statusCode: 200,
      headers: { 'content-type': 'application/json' },
      body: '{}',
    } as HttpResponseLike);
  };
}
