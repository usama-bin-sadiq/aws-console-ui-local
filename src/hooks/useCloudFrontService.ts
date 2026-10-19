/**
 * useCloudFrontService — CloudFront adapter hook.
 */

import { useState, useCallback } from "react";
import { cloudfront } from "@/lib/aws-clients";
import { ListDistributionsCommand } from "@aws-sdk/client-cloudfront";
import { ADAPTER_CONFIG } from "@/config/adapter-config";

export interface CloudFrontServiceState {
  distributions: unknown[];
  loading: boolean;
  error: string | null;
}

export function useCloudFrontService() {
  const [state, setState] = useState<CloudFrontServiceState>({
    distributions: [],
    loading: false,
    error: null,
  });
  const listDistributions = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const result = await cloudfront.send(new ListDistributionsCommand({}));
      setState((prev) => ({
        ...prev,
        distributions: (result as any)?.DistributionList?.Items || [],
        loading: false,
      }));
    } catch (err: unknown) {
      setState((prev) => ({ ...prev, error: String(err), loading: false }));
    }
  }, []);
  return { ...state, listDistributions, adapterMode: ADAPTER_CONFIG.adapterMode };
}
