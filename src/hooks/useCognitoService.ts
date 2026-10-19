/**
 * useCognitoService — Cognito adapter hook.
 */

import { useState, useCallback } from "react";
import { cognitoIdp } from "@/lib/aws-clients";
import { ListUserPoolsCommand } from "@aws-sdk/client-cognito-identity-provider";
import { ADAPTER_CONFIG } from "@/config/adapter-config";

export interface CognitoServiceState {
  pools: unknown[];
  loading: boolean;
  error: string | null;
}

export function useCognitoService() {
  const [state, setState] = useState<CognitoServiceState>({
    pools: [],
    loading: false,
    error: null,
  });
  const listUserPools = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const result = await cognitoIdp.send(new ListUserPoolsCommand({ MaxResults: 10 }));
      setState((prev) => ({ ...prev, pools: (result as any)?.UserPools || [], loading: false }));
    } catch (err: unknown) {
      setState((prev) => ({ ...prev, error: String(err), loading: false }));
    }
  }, []);
  return { ...state, listUserPools, adapterMode: ADAPTER_CONFIG.adapterMode };
}
