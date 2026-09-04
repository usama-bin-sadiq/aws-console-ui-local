/**
 * useVPCService — VPC adapter hook.
 */

import { useState, useCallback } from 'react';
import { ec2 } from '@/lib/aws-clients'
import { DescribeVpcsCommand } from '@aws-sdk/client-ec2';
import { ADAPTER_CONFIG } from '@/config/adapter-config';

export interface VPCServiceState {
  vpcs: unknown[];
  loading: boolean;
  error: string | null;
}

export function useVPCService() {
  const [state, setState] = useState<VPCServiceState>({ vpcs: [], loading: false, error: null });

  const describeVpcs = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const result = await ec2.send(new DescribeVpcsCommand({}));
      setState((prev) => ({ ...prev, vpcs: (result as any)?.Vpcs || [], loading: false }));
    } catch (err: unknown) {
      setState((prev) => ({ ...prev, error: String(err), loading: false }));
    }
  }, []);

  return { ...state, describeVpcs, adapterMode: ADAPTER_CONFIG.adapterMode };
}
