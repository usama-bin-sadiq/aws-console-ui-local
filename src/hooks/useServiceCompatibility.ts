"use client";

import { useEffect, useState, useCallback } from "react";

export interface ServiceCompatibility {
  routeDir: string;
  serviceName: string;
  available: boolean;
  status: "full" | "partial" | "not-supported" | "unknown";
  reason: string;
}

export interface ServiceCompatibilityResponse {
  provider: "localstack" | "ministack" | "real";
  endpoint: string;
  healthStatus: string;
  services: ServiceCompatibility[];
  counts: {
    full: number;
    partial: number;
    "not-supported": number;
    unknown: number;
  };
}

export interface UseServiceCompatibilityResult {
  data: ServiceCompatibilityResponse | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useServiceCompatibility(): UseServiceCompatibilityResult {
  const [data, setData] = useState<ServiceCompatibilityResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/service-compatibility");

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          error: "Request failed",
        }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result = await response.json();
      setData(result);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const refetch = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch,
  };
}

export function useServiceAvailability(serviceRouteDir: string): {
  available: boolean;
  status: "full" | "partial" | "not-supported" | "unknown";
  reason: string;
  loading: boolean;
} {
  const { data, loading } = useServiceCompatibility();

  if (loading || !data) {
    return {
      available: false,
      status: "unknown",
      reason: "Loading service compatibility data...",
      loading: true,
    };
  }

  const service = data.services.find((s) => s.routeDir === serviceRouteDir);

  if (!service) {
    return {
      available: false,
      status: "unknown",
      reason: `Service "${serviceRouteDir}" not found in registry`,
      loading: false,
    };
  }

  return {
    available: service.available,
    status: service.status,
    reason: service.reason,
    loading: false,
  };
}
