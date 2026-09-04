/**
 * useCloudFormationService — CloudFormation adapter hook.
 */

import { useState, useCallback } from 'react';
import { cloudformation } from '@/lib/aws-clients'
import { ListStacksCommand } from '@aws-sdk/client-cloudformation';
import { ADAPTER_CONFIG } from '@/config/adapter-config';

export interface CloudFormationServiceState {
  stacks: unknown[];
  loading: boolean;
  error: string | null;
}

export function useCloudFormationService() {
  const [state, setState] = useState<CloudFormationServiceState>({ stacks: [], loading: false, error: null });
  const listStacks = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const result = await cloudformation.send(new ListStacksCommand({}));
      setState((prev) => ({ ...prev, stacks: (result as any)?.StackSummaries || [], loading: false }));
    } catch (err: unknown) {
      setState((prev) => ({ ...prev, error: String(err), loading: false }));
    }
  }, []);
  return { ...state, listStacks, adapterMode: ADAPTER_CONFIG.adapterMode };
}
