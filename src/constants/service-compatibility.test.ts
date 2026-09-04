import { describe, expect, it } from "vitest";
import {
  AdapterMode,
  AdapterStatus,
  SERVICE_REGISTRY,
  getServiceAvailability,
} from "./service-compatibility";

describe("service emulator availability", () => {
  const findService = (routeDir: string) => {
    const service = SERVICE_REGISTRY.find((entry) => entry.routeDir === routeDir);
    if (!service) throw new Error(`Missing registry entry: ${routeDir}`);
    return service;
  };

  it("enables fully supported services on LocalStack", () => {
    const result = getServiceAvailability(findService("s3"), AdapterMode.LOCALSTACK, "healthy");
    expect(result).toMatchObject({ status: AdapterStatus.FULL, enabled: true });
  });

  it("disables unsupported services on MiniStack", () => {
    const result = getServiceAvailability(findService("eks-cluster"), AdapterMode.MINSTACK, "healthy");
    expect(result).toMatchObject({ status: AdapterStatus.NOT_SUPPORTED, enabled: false });
  });

  it("disables a service reported unavailable by emulator health", () => {
    const result = getServiceAvailability(findService("s3"), AdapterMode.LOCALSTACK, "healthy", { s3: false });
    expect(result).toMatchObject({ status: "unavailable", enabled: false });
  });

  it("does not claim availability when the emulator is unreachable", () => {
    const result = getServiceAvailability(findService("s3"), AdapterMode.LOCALSTACK, "unreachable");
    expect(result).toMatchObject({ status: "unavailable", enabled: false });
  });
});