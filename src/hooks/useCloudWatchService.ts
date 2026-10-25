/**
 * useCloudWatchService — CloudWatch adapter hook.
 */

import { useState, useCallback } from "react";
import { cloudwatch } from "@/lib/aws-clients";
import { DescribeAlarmsCommand } from "@aws-sdk/client-cloudwatch";
import { ADAPTER_CONFIG } from "@/config/adapter-config";

export interface CloudWatchServiceState {
  alarms: unknown[];
  loading: boolean;
  error: string | null;
}

export function useCloudWatchService() {
  const [state, setState] = useState<CloudWatchServiceState>({
    alarms: [],
    loading: false,
    error: null,
  });
  const describeAlarms = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const result = await cloudwatch.send(new DescribeAlarmsCommand({}));
      setState((prev) => ({
        ...prev,
        alarms: result.MetricAlarms || [],
        loading: false,
      }));
    } catch (err: unknown) {
      setState((prev) => ({ ...prev, error: String(err), loading: false }));
    }
  }, []);
  return { ...state, describeAlarms, adapterMode: ADAPTER_CONFIG.adapterMode };
}
