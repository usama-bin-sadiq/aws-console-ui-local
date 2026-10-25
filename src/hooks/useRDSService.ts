/**
 * useRDSService — RDS adapter hook.
 */

import { useState, useCallback } from "react";
import { rds } from "@/lib/aws-clients";
import { DescribeDBInstancesCommand } from "@aws-sdk/client-rds";
import { ADAPTER_CONFIG } from "@/config/adapter-config";

export interface RDSServiceState {
  instances: unknown[];
  loading: boolean;
  error: string | null;
}

export function useRDSService() {
  const [state, setState] = useState<RDSServiceState>({
    instances: [],
    loading: false,
    error: null,
  });

  const describeDBInstances = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const result = await rds.send(new DescribeDBInstancesCommand({}));
      setState((prev) => ({
        ...prev,
        instances: result.DBInstances || [],
        loading: false,
      }));
    } catch (err: unknown) {
      setState((prev) => ({ ...prev, error: String(err), loading: false }));
    }
  }, []);

  return { ...state, describeDBInstances, adapterMode: ADAPTER_CONFIG.adapterMode };
}
