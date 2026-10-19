/**
 * useKMSService — KMS adapter hook.
 */

import { useState, useCallback } from "react";
import { kms } from "@/lib/aws-clients";
import { ListKeysCommand } from "@aws-sdk/client-kms";
import { ADAPTER_CONFIG } from "@/config/adapter-config";

export interface KMSServiceState {
  keys: unknown[];
  loading: boolean;
  error: string | null;
}

export function useKMSService() {
  const [state, setState] = useState<KMSServiceState>({ keys: [], loading: false, error: null });

  const listKeys = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const result = await kms.send(new ListKeysCommand({}));
      setState((prev) => ({ ...prev, keys: (result as any)?.Keys || [], loading: false }));
    } catch (err: unknown) {
      setState((prev) => ({ ...prev, error: String(err), loading: false }));
    }
  }, []);

  return { ...state, listKeys, adapterMode: ADAPTER_CONFIG.adapterMode };
}
