/**
 * useECRService — ECR adapter hook.
 */

import { useState, useCallback } from 'react';
import { ecr } from '@/lib/aws-clients'
import { DescribeRepositoriesCommand } from '@aws-sdk/client-ecr';
import { ADAPTER_CONFIG } from '@/config/adapter-config';

export interface ECRServiceState {
  repos: unknown[];
  loading: boolean;
  error: string | null;
}

export function useECRService() {
  const [state, setState] = useState<ECRServiceState>({ repos: [], loading: false, error: null });

  const describeRepos = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const result = await ecr.send(new DescribeRepositoriesCommand({}));
      setState((prev) => ({ ...prev, repos: (result as any)?.repositories || [], loading: false }));
    } catch (err: unknown) {
      setState((prev) => ({ ...prev, error: String(err), loading: false }));
    }
  }, []);

  return { ...state, describeRepos, adapterMode: ADAPTER_CONFIG.adapterMode };
}
