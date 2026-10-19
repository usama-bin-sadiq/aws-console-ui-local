/**
 * useSecretsManagerService — Secrets adapter hook.
 */

import { useState, useCallback } from "react";
import { secretsManager } from "@/lib/aws-clients";
import { ListSecretsCommand } from "@aws-sdk/client-secrets-manager";
import { ADAPTER_CONFIG } from "@/config/adapter-config";

export interface SecretsServiceState {
  secrets: unknown[];
  loading: boolean;
  error: string | null;
}

export function useSecretsManagerService() {
  const [state, setState] = useState<SecretsServiceState>({
    secrets: [],
    loading: false,
    error: null,
  });

  const listSecrets = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const result = await secretsManager.send(new ListSecretsCommand({}));
      setState((prev) => ({ ...prev, secrets: (result as any)?.SecretList || [], loading: false }));
    } catch (err: unknown) {
      setState((prev) => ({ ...prev, error: String(err), loading: false }));
    }
  }, []);

  return { ...state, listSecrets, adapterMode: ADAPTER_CONFIG.adapterMode };
}
