"use client";

import { useEffect, useState, useCallback } from "react";
import { useNotifications } from "@/context/NotificationContext";
import { useSettingsStore } from "@/stores/settings";

interface UseAwsApiOptions {
  endpoint: string;
  method?: "GET" | "POST" | "PUT" | "DELETE";
  autoFetch?: boolean;
}

interface UseAwsApiResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  mutate: (body?: any) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useAwsApi<T = any>(options: UseAwsApiOptions): UseAwsApiResult<T> {
  const { endpoint, method = "GET", autoFetch = true } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(autoFetch);
  const [error, setError] = useState<string | null>(null);
  const { addNotification } = useNotifications();
  const region = useSettingsStore((state) => state.region);

  const fetchData = useCallback(
    async (body?: any) => {
      setLoading(true);
      setError(null);

      try {
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          "x-aws-region": region,
        };

        const fetchOptions: RequestInit = {
          method: body ? "POST" : method,
          headers,
        };

        if (body) {
          fetchOptions.body = JSON.stringify(body);
        }

        const response = await fetch(endpoint, fetchOptions);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({
            error: "Request failed",
          }));
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        const result = await response.json();
        setData(result);
        return result;
      } catch (err: any) {
        const errorMessage = err.message || "An error occurred";
        setError(errorMessage);
        addNotification("error", "API Error", errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [endpoint, method, region, addNotification],
  );

  const mutate = useCallback(
    async (body?: any) => {
      await fetchData(body);
    },
    [fetchData],
  );

  const refetch = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (autoFetch) {
      fetchData();
    }
  }, [autoFetch]); // Only run on mount when autoFetch is true

  return {
    data,
    loading,
    error,
    mutate,
    refetch,
  };
}
