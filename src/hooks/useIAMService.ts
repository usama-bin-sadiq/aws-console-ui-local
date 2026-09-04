/**
 * useIAMService — IAM adapter hook.
 */

import { useState, useCallback } from 'react';
import { iam } from '@/lib/aws-clients'
import { ListUsersCommand } from '@aws-sdk/client-iam';
import { ADAPTER_CONFIG } from '@/config/adapter-config';

export interface IAMServiceState {
  users: unknown[];
  loading: boolean;
  error: string | null;
}

export function useIAMService() {
  const [state, setState] = useState<IAMServiceState>({ users: [], loading: false, error: null });

  const listUsers = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const result = await iam.send(new ListUsersCommand({}));
      setState((prev) => ({ ...prev, users: (result as any)?.Users || [], loading: false }));
    } catch (err: unknown) {
      setState((prev) => ({ ...prev, error: String(err), loading: false }));
    }
  }, []);

  return { ...state, listUsers, adapterMode: ADAPTER_CONFIG.adapterMode };
}
