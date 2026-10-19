import { describe, it, expect } from "vite-plus/test";
import {
  AdapterMode,
  AdapterStatus,
  LOCALEMU_API_COMPATIBLE_SERVICES,
  LOCALEMU_FULL_SERVICES,
  LOCALEMU_GOOD_SERVICES,
  LOCALEMU_RUNTIME_UNAVAILABLE_SERVICES,
  LOCALEMU_UNDOCUMENTED_SERVICES,
  SERVICE_REGISTRY,
  findServiceCompatibility,
  getLocalEmuDocumentedStatus,
  getServiceAvailability,
  toAdapterMode,
} from "./service-compatibility";

/**
 * LocalEmu capability model.
 *
 * LocalEmu publishes a per-service fidelity tier in its documentation
 * ("Full emulation" / "Good emulation" / "API compatible"). The console honours
 * those published tiers, requires the running build to report the service as
 * available, and keeps the runtime-probe overrides that outrank the docs.
 */

/** A health payload where every documented service reports as available. */
function healthForAllDocumented(): Record<string, unknown> {
  const services: Record<string, unknown> = {};
  for (const routeDir of [
    ...LOCALEMU_FULL_SERVICES,
    ...LOCALEMU_GOOD_SERVICES,
    ...LOCALEMU_API_COMPATIBLE_SERVICES,
  ]) {
    services[routeDir] = "available";
  }
  return services;
}

const HEALTH_ALL = healthForAllDocumented();

describe("LocalEmu documented tiers", () => {
  it("classifies the published tiers", () => {
    expect(getLocalEmuDocumentedStatus("s3")).toBe(AdapterStatus.FULL);
    expect(getLocalEmuDocumentedStatus("lambda")).toBe(AdapterStatus.FULL);
    expect(getLocalEmuDocumentedStatus("dynamodb")).toBe(AdapterStatus.FULL);
    expect(getLocalEmuDocumentedStatus("cloudformation")).toBe(AdapterStatus.PARTIAL);
    expect(getLocalEmuDocumentedStatus("athena")).toBe(AdapterStatus.PARTIAL);
    expect(getLocalEmuDocumentedStatus("ecr")).toBe(AdapterStatus.PARTIAL);
  });

  it("has no overlap between tiers", () => {
    const seen = new Set<string>();
    for (const set of [
      LOCALEMU_FULL_SERVICES,
      LOCALEMU_GOOD_SERVICES,
      LOCALEMU_API_COMPATIBLE_SERVICES,
    ]) {
      for (const routeDir of set) {
        expect(seen.has(routeDir)).toBe(false);
        seen.add(routeDir);
      }
    }
    expect(seen.size).toBe(
      LOCALEMU_FULL_SERVICES.size +
        LOCALEMU_GOOD_SERVICES.size +
        LOCALEMU_API_COMPATIBLE_SERVICES.size,
    );
  });

  it("only references route directories that exist in the registry", () => {
    const known = new Set(SERVICE_REGISTRY.map((entry) => entry.routeDir));
    const all = [
      ...LOCALEMU_FULL_SERVICES,
      ...LOCALEMU_GOOD_SERVICES,
      ...LOCALEMU_API_COMPATIBLE_SERVICES,
      ...LOCALEMU_RUNTIME_UNAVAILABLE_SERVICES,
      ...LOCALEMU_UNDOCUMENTED_SERVICES,
    ];
    for (const routeDir of all) {
      expect(known.has(routeDir), `${routeDir} is not a registry route`).toBe(true);
    }
  });

  it("does not place a probe-proven defect in a supported tier", () => {
    for (const routeDir of LOCALEMU_RUNTIME_UNAVAILABLE_SERVICES) {
      const inTier =
        LOCALEMU_FULL_SERVICES.has(routeDir) ||
        LOCALEMU_GOOD_SERVICES.has(routeDir) ||
        LOCALEMU_API_COMPATIBLE_SERVICES.has(routeDir);
      expect(inTier, `${routeDir} must not be enabled`).toBe(false);
    }
  });
});

describe("LocalEmu availability", () => {
  it("enables a documented service the running build reports as available", () => {
    const s3 = findServiceCompatibility("/s3");
    expect(s3).toBeDefined();
    const result = getServiceAvailability(s3!, AdapterMode.LOCALEMU, "healthy", HEALTH_ALL);
    expect(result.enabled).toBe(true);
    expect(result.status).toBe(AdapterStatus.FULL);
    expect(result.reason).toMatch(/full emulation/i);
  });

  it("enables an API-compatible service but never as full", () => {
    const ecr = findServiceCompatibility("/ecr-repo");
    expect(ecr).toBeDefined();
    const result = getServiceAvailability(ecr!, AdapterMode.LOCALEMU, "healthy", HEALTH_ALL);
    expect(result.enabled).toBe(true);
    expect(result.status).toBe(AdapterStatus.PARTIAL);
    expect(result.reason).toMatch(/API compatible/i);
  });

  it("keeps probe-proven defects disabled even though LocalEmu documents them", () => {
    for (const routeDir of LOCALEMU_RUNTIME_UNAVAILABLE_SERVICES) {
      const entry = findServiceCompatibility(`/${routeDir}`);
      if (!entry) continue;
      const result = getServiceAvailability(entry, AdapterMode.LOCALEMU, "healthy", HEALTH_ALL);
      expect(result.enabled, `${routeDir} should stay disabled`).toBe(false);
      expect(result.status).toBe(AdapterStatus.NOT_SUPPORTED);
      expect(result.reason).toMatch(/runtime probe/i);
    }
  });

  it("disables services LocalEmu does not document at all", () => {
    for (const routeDir of LOCALEMU_UNDOCUMENTED_SERVICES) {
      const entry = findServiceCompatibility(`/${routeDir}`);
      if (!entry) continue;
      const result = getServiceAvailability(entry, AdapterMode.LOCALEMU, "healthy", HEALTH_ALL);
      expect(result.enabled, `${routeDir} should stay disabled`).toBe(false);
      expect(result.reason).toMatch(/does not document/i);
    }
  });

  it("requires the running build to report the service", () => {
    const s3 = findServiceCompatibility("/s3")!;
    const result = getServiceAvailability(s3, AdapterMode.LOCALEMU, "healthy", {});
    expect(result.enabled).toBe(false);
    expect(result.reason).toMatch(/has not reported/i);
  });

  it("respects a limited SERVICES=... start", () => {
    const lambda = findServiceCompatibility("/lambda")!;
    const result = getServiceAvailability(lambda, AdapterMode.LOCALEMU, "healthy", {
      s3: "available",
    });
    expect(result.enabled).toBe(false);
  });

  it("disables everything when the emulator is unreachable", () => {
    const s3 = findServiceCompatibility("/s3")!;
    const result = getServiceAvailability(s3, AdapterMode.LOCALEMU, "unreachable", HEALTH_ALL);
    expect(result.enabled).toBe(false);
  });

  it("enables a large majority of the registry, not a handful", () => {
    const enabled = SERVICE_REGISTRY.filter(
      (entry) => getServiceAvailability(entry, AdapterMode.LOCALEMU, "healthy", HEALTH_ALL).enabled,
    );
    // Guards the regression that only the probed handful were enabled.
    expect(enabled.length).toBeGreaterThan(100);
  });
});

describe("toAdapterMode", () => {
  it("recognises the known providers", () => {
    expect(toAdapterMode("localstack")).toBe(AdapterMode.LOCALSTACK);
    expect(toAdapterMode("ministack")).toBe(AdapterMode.MINSTACK);
    expect(toAdapterMode("localemu")).toBe(AdapterMode.LOCALEMU);
  });

  it("rejects anything else", () => {
    expect(toAdapterMode("unknown")).toBe("unknown");
    expect(toAdapterMode(undefined)).toBe("unknown");
    expect(toAdapterMode("nope")).toBe("unknown");
  });
});
