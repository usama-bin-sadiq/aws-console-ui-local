/**
 * useCloudTrailService — CloudTrail adapter hook.
 */

import { useState, useCallback } from "react";
import { cloudtrail } from "@/lib/aws-clients";
import { DescribeTrailsCommand } from "@aws-sdk/client-cloudtrail";
import { ADAPTER_CONFIG } from "@/config/adapter-config";

export interface CloudTrailServiceState {
  trails: unknown[];
  loading: boolean;
  error: string | null;
}

export function useCloudTrailService() {
  const [state, setState] = useState<CloudTrailServiceState>({
    trails: [],
    loading: false,
    error: null,
  });
  const describeTrails = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const result = await cloudtrail.send(new DescribeTrailsCommand({}));
      setState((prev) => ({ ...prev, trails: (result as any)?.trailList || [], loading: false }));
    } catch (err: unknown) {
      setState((prev) => ({ ...prev, error: String(err), loading: false }));
    }
  }, []);
  return { ...state, describeTrails, adapterMode: ADAPTER_CONFIG.adapterMode };
}
