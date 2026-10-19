/**
 * useConfigService — Config adapter hook.
 */

import { useState, useCallback } from "react";
import { configService } from "@/lib/aws-clients";
import { DescribeConfigRulesCommand } from "@aws-sdk/client-config-service";
import { ADAPTER_CONFIG } from "@/config/adapter-config";

export interface ConfigServiceState {
  rules: unknown[];
  loading: boolean;
  error: string | null;
}

export function useConfigService() {
  const [state, setState] = useState<ConfigServiceState>({
    rules: [],
    loading: false,
    error: null,
  });
  const describeConfigRules = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const result = await configService.send(new DescribeConfigRulesCommand({}));
      setState((prev) => ({ ...prev, rules: (result as any)?.ConfigRules || [], loading: false }));
    } catch (err: unknown) {
      setState((prev) => ({ ...prev, error: String(err), loading: false }));
    }
  }, []);
  return { ...state, describeConfigRules, adapterMode: ADAPTER_CONFIG.adapterMode };
}
