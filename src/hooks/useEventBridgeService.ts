/**
 * useEventBridgeService — EventBridge adapter hook.
 */

import { useState, useCallback } from "react";
import { eventbridge } from "@/lib/aws-clients";
import { ListEventBusesCommand } from "@aws-sdk/client-eventbridge";
import { ADAPTER_CONFIG } from "@/config/adapter-config";

export interface EventBridgeServiceState {
  buses: unknown[];
  loading: boolean;
  error: string | null;
}

export function useEventBridgeService() {
  const [state, setState] = useState<EventBridgeServiceState>({
    buses: [],
    loading: false,
    error: null,
  });
  const listEventBuses = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const result = await eventbridge.send(new ListEventBusesCommand({}));
      setState((prev) => ({ ...prev, buses: result.EventBuses || [], loading: false }));
    } catch (err: unknown) {
      setState((prev) => ({ ...prev, error: String(err), loading: false }));
    }
  }, []);
  return { ...state, listEventBuses, adapterMode: ADAPTER_CONFIG.adapterMode };
}
