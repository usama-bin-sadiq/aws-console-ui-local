/**
 * Adapter Factory — Main adapter initialization for all SDK clients.
 * Every service uses this factory. No exceptions. No stubs.
 */

import { AdapterFactoryOptions, AdapterFactoryResult } from '@/types/adapter';
import { resolveEndpoint } from './endpoint-resolver';
import { injectAuth } from './auth-injector';
import { mapRequest } from './request-mapper';
import { normalizeResponse } from './response-normalizer';
import { ADAPTER_DEFAULT_VERSION } from '@/constants/adapter-constants';

export type { AdapterFactoryOptions } from '@/types/adapter';

export function createAdapter(options?: AdapterFactoryOptions): AdapterFactoryResult {
  const adapterMode = options?.adapterMode || 'localstack';
  const endpoint = resolveEndpoint(adapterMode);
  const auth = injectAuth(adapterMode);
  const service = options?.serviceName || 'aws-console';

  return {
    endpoint,
    auth,
    service,
    adapterActive: true,
    adapterVersion: ADAPTER_DEFAULT_VERSION,
    adapterMode: { mode: adapterMode },
    mapRequest: (req: unknown, adapterMode?: string) => {
      const mappedReq = req as { protocol?: string; hostname?: string; port?: number; path?: string; headers?: Record<string, string>; body?: unknown; method?: string };
      return mapRequest(mappedReq, adapterMode as AdapterFactoryOptions['adapterMode']);
    },
    normalizeResponse: (res: unknown) => {
      const mappedRes = res as { status?: number; headers?: Record<string, string>; data?: string | Buffer | Uint8Array };
      return normalizeResponse(mappedRes);
    },
  };
}
