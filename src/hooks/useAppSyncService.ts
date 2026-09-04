/**
 * useAppSyncService — AppSync adapter hook.
 */

import { useState, useCallback } from 'react';
import { appsync } from '@/lib/aws-clients'
import { ListGraphqlApisCommand } from '@aws-sdk/client-appsync';
import { ADAPTER_CONFIG } from '@/config/adapter-config';

export interface AppSyncServiceState {
  apis: unknown[];
  loading: boolean;
  error: string | null;
}

export function useAppSyncService() {
  const [state, setState] = useState<AppSyncServiceState>({ apis: [], loading: false, error: null });
  const listApis = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const result = await appsync.send(new ListGraphqlApisCommand({}));
      setState((prev) => ({ ...prev, apis: (result as any)?.graphqlApis || [], loading: false }));
    } catch (err: unknown) {
      setState((prev) => ({ ...prev, error: String(err), loading: false }));
    }
  }, []);
  return { ...state, listApis, adapterMode: ADAPTER_CONFIG.adapterMode };
}
