/**
 * useSSMService — SSM adapter hook.
 */

import { useState, useCallback } from "react";
import { ssm } from "@/lib/aws-clients";
import { DescribeParametersCommand } from "@aws-sdk/client-ssm";
import { ADAPTER_CONFIG } from "@/config/adapter-config";

export interface SSMServiceState {
  parameters: unknown[];
  loading: boolean;
  error: string | null;
}

export function useSSMService() {
  const [state, setState] = useState<SSMServiceState>({
    parameters: [],
    loading: false,
    error: null,
  });
  const describeParameters = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const result = await ssm.send(new DescribeParametersCommand({}));
      setState((prev) => ({
        ...prev,
        parameters: (result as any)?.Parameters || [],
        loading: false,
      }));
    } catch (err: unknown) {
      setState((prev) => ({ ...prev, error: String(err), loading: false }));
    }
  }, []);
  return { ...state, describeParameters, adapterMode: ADAPTER_CONFIG.adapterMode };
}
