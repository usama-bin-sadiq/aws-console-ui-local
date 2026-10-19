import { NextResponse } from "next/server";
import { ADAPTER_CONFIG, getAdapterEndpoint } from "@/config/adapter-config";
import {
  SERVICE_REGISTRY,
  AdapterMode,
  EmulatorHealthStatus,
  getHealthPathForMode,
  getServiceAvailability,
} from "@/constants/service-compatibility";
import { requirePermission } from "@/lib/data-isolation";

async function fetchEmulatorHealth(
  endpointUrl: string,
  mode: AdapterMode,
): Promise<{
  status: string;
  services: Record<string, unknown>;
} | null> {
  const healthCheckUrl = `${endpointUrl}${getHealthPathForMode(mode)}`;

  try {
    const response = await fetch(healthCheckUrl, {
      signal: AbortSignal.timeout(3000),
    });

    if (response.ok) {
      const data = await response.json();
      const services = data.services || {};
      const values = Object.values(services);
      const hasUnavailable = values.some((value) => {
        if (value && typeof value === "object") {
          const status = (value as { status?: unknown }).status;
          return status === false || status === "unavailable" || status === "error";
        }
        return value === false || value === "unavailable" || value === "error";
      });
      return {
        status:
          data.status ||
          (values.length > 0 ? (hasUnavailable ? "degraded" : "healthy") : "unknown"),
        services,
      };
    }
  } catch {
    // Endpoint unreachable
  }

  return null;
}

export async function GET(request: Request) {
  const denied = await requirePermission(request, "GET");
  if (denied) return denied;

  const mode = ADAPTER_CONFIG.adapterMode as AdapterMode;
  const endpointUrl = getAdapterEndpoint(mode);

  const healthData = await fetchEmulatorHealth(endpointUrl, mode);
  const healthStatus = healthData?.status || "unreachable";
  const healthServices = healthData?.services || {};

  const services = SERVICE_REGISTRY.map((service) => {
    const result = getServiceAvailability(
      service,
      mode,
      healthStatus as EmulatorHealthStatus,
      healthServices,
    );
    const status = result.status === "unavailable" ? "unknown" : result.status;
    return {
      routeDir: service.routeDir,
      serviceName: service.serviceName,
      available: result.enabled,
      status,
      reason: result.reason,
    };
  });

  const counts = services.reduce(
    (acc, service) => {
      const key = service.status as "full" | "partial" | "not-supported" | "unknown";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    },
    {
      full: 0,
      partial: 0,
      "not-supported": 0,
      unknown: 0,
    } as Record<"full" | "partial" | "not-supported" | "unknown", number>,
  );

  return NextResponse.json({
    provider: mode,
    endpoint: endpointUrl,
    healthStatus,
    services,
    counts: {
      full: counts.full || 0,
      partial: counts.partial || 0,
      "not-supported": counts["not-supported"] || 0,
      unknown: counts.unknown || 0,
    },
  });
}
