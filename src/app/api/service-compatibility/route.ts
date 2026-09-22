import { NextResponse } from "next/server";
import { ADAPTER_CONFIG } from "@/config/adapter-config";
import {
  SERVICE_REGISTRY,
  ServiceCompatibilityEntry,
  AdapterMode,
  AdapterStatus,
} from "@/constants/service-compatibility";
import { requirePermission } from "@/lib/data-isolation";

const normalizeServiceKey = (value: string): string =>
  value.toLowerCase().replace(/[^a-z0-9]/g, "");

const healthValueIsEnabled = (value: unknown): boolean =>
  value === true ||
  value === "available" ||
  value === "healthy" ||
  value === "running" ||
  value === "true";

async function fetchEmulatorHealth(endpointUrl: string, mode: AdapterMode): Promise<{
  status: string;
  services: Record<string, unknown>;
} | null> {
  const healthCheckUrl =
    mode === AdapterMode.MINSTACK
      ? `${endpointUrl}/_ministack/health`
      : `${endpointUrl}/_localstack/health`;

  try {
    const response = await fetch(healthCheckUrl, {
      signal: AbortSignal.timeout(3000),
    });

    if (response.ok) {
      const data = await response.json();
      return {
        status: data.status || "unknown",
        services: data.services || {},
      };
    }
  } catch {
    // Endpoint unreachable
  }

  return null;
}

function determineServiceStatus(
  service: ServiceCompatibilityEntry,
  mode: AdapterMode,
  healthStatus: string,
  healthServices: Record<string, unknown>,
): { available: boolean; status: AdapterStatus | "unknown" | "not-supported"; reason: string } {
  if (healthStatus === "unreachable") {
    return {
      available: false,
      status: "unknown",
      reason: "Emulator endpoint is unreachable",
    };
  }

  const compatibility =
    mode === AdapterMode.MINSTACK
      ? service.adapterStatusMinStack
      : service.adapterStatusLocalStack;

  const healthKeys = Object.keys(healthServices);
  const matchingHealthKey = healthKeys.find((key) => {
    const normalizedKey = normalizeServiceKey(key);
    return (
      normalizedKey === normalizeServiceKey(service.routeDir) ||
      normalizedKey === normalizeServiceKey(service.serviceName)
    );
  });

  const healthEnabled = matchingHealthKey
    ? healthValueIsEnabled(healthServices[matchingHealthKey])
    : false;

  if (matchingHealthKey === undefined) {
    return {
      available: false,
      status: "unknown",
      reason: "Not reported by emulator health endpoint",
    };
  }

  if (!healthEnabled) {
    return {
      available: false,
      status: "not-supported",
      reason: "Emulator reports this service as unavailable",
    };
  }

  if (compatibility === AdapterStatus.NOT_SUPPORTED) {
    return {
      available: false,
      status: compatibility,
      reason: `${mode} does not support this service`,
    };
  }

  return {
    available: true,
    status: compatibility,
    reason:
      compatibility === AdapterStatus.PARTIAL
        ? `${mode} provides partial support for this service`
        : "Service is fully supported by the active emulator",
  };
}

export async function GET(request: Request) {
  const denied = await requirePermission(request, "GET");
  if (denied) return denied;

  const mode = ADAPTER_CONFIG.adapterMode as AdapterMode;
  const endpointUrl =
    mode === AdapterMode.MINSTACK
      ? ADAPTER_CONFIG.endpointConfig.minstackEndpoint
      : ADAPTER_CONFIG.endpointConfig.localstackEndpoint;

  const healthData = await fetchEmulatorHealth(endpointUrl, mode);
  const healthStatus = healthData?.status || "unreachable";
  const healthServices = healthData?.services || {};

  const services = SERVICE_REGISTRY.map((service) => {
    const result = determineServiceStatus(
      service,
      mode,
      healthStatus,
      healthServices,
    );
    return {
      routeDir: service.routeDir,
      serviceName: service.serviceName,
      available: result.available,
      status: result.status,
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