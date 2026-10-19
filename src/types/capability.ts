import { getAdapterStatusForMode } from "@/constants/service-compatibility";
import type {
  AdapterMode,
  AdapterStatus,
  EmulatorHealthStatus,
  ServiceCompatibilityEntry,
} from "@/constants/service-compatibility";

export type CapabilityState = AdapterStatus | "unknown" | "unavailable";

export interface OperationCapability {
  readonly operation: string;
  readonly write: boolean;
  readonly state: CapabilityState;
  readonly reason: string;
}

export interface ServiceCapability {
  readonly serviceKey: string;
  readonly serviceName: string;
  readonly category: string;
  readonly state: CapabilityState;
  readonly reason: string;
  readonly operations: readonly OperationCapability[];
}

export interface ProviderCapabilities {
  readonly provider: AdapterMode | "unknown";
  readonly endpoint: string | undefined;
  readonly region: string;
  readonly health: EmulatorHealthStatus;
  readonly services: readonly ServiceCapability[];
  readonly checkedAt: string | undefined;
}

export interface HealthServiceRecord {
  readonly status?: unknown;
  readonly operations?: Record<string, unknown>;
}

export type HealthServiceMap = Record<string, HealthServiceRecord | unknown>;

export interface CapabilityResolutionOptions {
  readonly optimisticHealth?: boolean;
}

export function resolveServiceCapability(
  service: ServiceCompatibilityEntry,
  mode: AdapterMode | "unknown",
  healthStatus: EmulatorHealthStatus,
  healthServices: HealthServiceMap,
  options: CapabilityResolutionOptions = {},
): ServiceCapability {
  const healthKey = Object.keys(healthServices).find(
    (key) =>
      key.toLowerCase().replace(/[^a-z0-9]/g, "") ===
        service.routeDir.toLowerCase().replace(/[^a-z0-9]/g, "") ||
      key.toLowerCase().replace(/[^a-z0-9]/g, "") ===
        service.serviceName.toLowerCase().replace(/[^a-z0-9]/g, ""),
  );
  const healthRecord = healthKey === undefined ? undefined : healthServices[healthKey];
  const healthValue =
    typeof healthRecord === "object" && healthRecord !== null && "status" in healthRecord
      ? healthRecord.status
      : healthRecord;
  const healthKnown = healthKey !== undefined;
  const healthEnabled =
    healthValue === true ||
    healthValue === "available" ||
    healthValue === "healthy" ||
    healthValue === "running" ||
    healthValue === "true";
  const compatibility = getAdapterStatusForMode(service, mode);

  if (healthStatus === "unreachable") {
    return {
      serviceKey: service.routeDir,
      serviceName: service.serviceName,
      category: "",
      state: "unavailable",
      reason: "The emulator endpoint is unreachable.",
      operations: [],
    };
  }
  if (compatibility === "not-supported") {
    return {
      serviceKey: service.routeDir,
      serviceName: service.serviceName,
      category: "",
      state: "unavailable",
      reason: `${mode} does not support this service.`,
      operations: [],
    };
  }
  if (!healthKnown && !options.optimisticHealth) {
    return {
      serviceKey: service.routeDir,
      serviceName: service.serviceName,
      category: "",
      state: "unknown",
      reason: "The emulator has not reported this service capability.",
      operations: [],
    };
  }
  if (healthKnown && !healthEnabled) {
    return {
      serviceKey: service.routeDir,
      serviceName: service.serviceName,
      category: "",
      state: "unavailable",
      reason: "The emulator reports this service as unavailable.",
      operations: [],
    };
  }

  return {
    serviceKey: service.routeDir,
    serviceName: service.serviceName,
    category: "",
    state: compatibility,
    reason:
      compatibility === "partial"
        ? `${mode} provides partial support for this service.`
        : "Service is enabled by the active emulator.",
    operations: [],
  };
}
