/**
 * useLambdaService — Lambda adapter hook.
 */

import { useState, useCallback } from "react";
import { lambda } from "@/lib/aws-clients";
import { ListFunctionsCommand } from "@aws-sdk/client-lambda";
import { ADAPTER_CONFIG } from "@/config/adapter-config";

export interface LambdaServiceState {
  functions: unknown[];
  loading: boolean;
  error: string | null;
}

export function useLambdaService() {
  const [state, setState] = useState<LambdaServiceState>({
    functions: [],
    loading: false,
    error: null,
  });

  const listFunctions = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const result = await lambda.send(new ListFunctionsCommand({}));
      setState((prev) => ({
        ...prev,
        functions: result.Functions || [],
        loading: false,
      }));
    } catch (err: unknown) {
      setState((prev) => ({ ...prev, error: String(err), loading: false }));
    }
  }, []);

  return { ...state, listFunctions, adapterMode: ADAPTER_CONFIG.adapterMode };
}
