/**
 * Universal Service CRUD — Adapter-aware CRUD using middleware-connected endpoints.
 */

import { useState, useCallback } from "react";
import { ADAPTER_CONFIG } from "@/config/adapter-config";

export type CRUDOperation = "create" | "read" | "update" | "delete";

export interface CRUDState {
  data: unknown[];
  selectedItem: Record<string, unknown> | null;
  loading: boolean;
  error: string | null;
  operation: CRUDOperation | null;
}

export interface CRUDConfig {
  serviceName: string;
  resourceType: string;
}

export function useUniversalCRUD(config: CRUDConfig) {
  const [state, setState] = useState<CRUDState>({
    data: [],
    selectedItem: null,
    loading: false,
    error: null,
    operation: null,
  });

  const adapterMode = ADAPTER_CONFIG.adapterMode;
  const endpointBase = adapterMode === "ministack"
    ? ADAPTER_CONFIG.endpointConfig.minstackEndpoint
    : ADAPTER_CONFIG.endpointConfig.localstackEndpoint;

  const createResource = useCallback(async (params: Record<string, unknown>) => {
    setState((prev) => ({ ...prev, loading: true, error: null, operation: "create" as CRUDOperation }));
    try {
      const res = await fetch(`/api/${config.serviceName.toLowerCase()}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-adapter-mode": adapterMode },
        body: JSON.stringify({ action: "create", ...params }),
      });
      const result = await res.json();
      setState((prev) => ({ ...prev, loading: false, operation: null }));
      return result;
    } catch (err: unknown) {
      setState((prev) => ({ ...prev, error: String(err), loading: false, operation: null }));
      throw err;
    }
  }, [config, adapterMode]);

  const readResources = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null, operation: "read" as CRUDOperation }));
    try {
      const res = await fetch(`/api/${config.serviceName.toLowerCase()}`, {
        headers: { "x-adapter-mode": adapterMode },
      });
      const result = await res.json();
      const items = result[`${config.resourceType}s`] || result.buckets || result.functions || result.resources || result.data || result;
      setState((prev) => ({ ...prev, data: Array.isArray(items) ? items : [items], loading: false, operation: null }));
    } catch (err: unknown) {
      setState((prev) => ({ ...prev, error: String(err), loading: false, operation: null }));
    }
  }, [config, adapterMode]);

  const updateResource = useCallback(async (id: string, params: Record<string, unknown>) => {
    setState((prev) => ({ ...prev, loading: true, error: null, operation: "update" as CRUDOperation }));
    try {
      const res = await fetch(`/api/${config.serviceName.toLowerCase()}?id=${encodeURIComponent(id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-adapter-mode": adapterMode },
        body: JSON.stringify({ action: "update", ...params, id }),
      });
      const result = await res.json();
      setState((prev) => ({ ...prev, loading: false, operation: null }));
      return result;
    } catch (err: unknown) {
      setState((prev) => ({ ...prev, error: String(err), loading: false, operation: null }));
      throw err;
    }
  }, [config, adapterMode]);

  const deleteResource = useCallback(async (id: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null, operation: "delete" as CRUDOperation }));
    try {
      const res = await fetch(`/api/${config.serviceName.toLowerCase()}?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: { "x-adapter-mode": adapterMode },
      });
      const result = await res.json();
      setState((prev) => ({ ...prev, loading: false, operation: null }));
      return result;
    } catch (err: unknown) {
      setState((prev) => ({ ...prev, error: String(err), loading: false, operation: null }));
      throw err;
    }
  }, [config, adapterMode]);

  return {
    ...state,
    adapterMode,
    createResource,
    readResources,
    updateResource,
    deleteResource,
  };
}
