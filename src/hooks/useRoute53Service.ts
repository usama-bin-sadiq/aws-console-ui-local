/**
 * useRoute53Service — Route53 adapter hook.
 */

import { useState, useCallback } from 'react';
import { route53 } from '@/lib/aws-clients'
import { ListHostedZonesCommand } from '@aws-sdk/client-route-53';
import { ADAPTER_CONFIG } from '@/config/adapter-config';

export interface Route53ServiceState {
  zones: unknown[];
  loading: boolean;
  error: string | null;
}

export function useRoute53Service() {
  const [state, setState] = useState<Route53ServiceState>({ zones: [], loading: false, error: null });
  const listHostedZones = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const result = await route53.send(new ListHostedZonesCommand({}));
      setState((prev) => ({ ...prev, zones: (result as any)?.HostedZones || [], loading: false }));
    } catch (err: unknown) {
      setState((prev) => ({ ...prev, error: String(err), loading: false }));
    }
  }, []);
  return { ...state, listHostedZones, adapterMode: ADAPTER_CONFIG.adapterMode };
}
