import { describe, expect, it } from "vite-plus/test";
import {
  AdapterMode,
  findServiceCompatibility,
  getServiceAvailability,
} from "@/constants/service-compatibility";
import { getAvailableNavigationItems } from "@/constants/navigation";

function findNavigationItem(items: ReturnType<typeof getAvailableNavigationItems>, href: string) {
  for (const group of items) {
    const match = group.items?.find((item) => item.href === href);
    if (match) return match;
  }
  return undefined;
}

describe("getAvailableNavigationItems", () => {
  it("keeps nested service routes enabled when their parent service reports healthy", () => {
    const items = getAvailableNavigationItems(AdapterMode.LOCALSTACK, "healthy", { iam: true });

    expect(findNavigationItem(items, "/iam/policies")?.disabled).toBe(false);
  });

  it("disables a service when the active emulator reports it unavailable", () => {
    const items = getAvailableNavigationItems(AdapterMode.LOCALSTACK, "healthy", { ec2: false });

    expect(findNavigationItem(items, "/ec2")?.disabled).toBe(true);
  });

  it("disables navigation while the emulator capability is unknown", () => {
    const items = getAvailableNavigationItems(AdapterMode.LOCALSTACK, "checking", {});

    expect(findNavigationItem(items, "/ec2")?.disabled).toBe(true);
  });

  it("disables navigation when the emulator is unreachable", () => {
    const items = getAvailableNavigationItems(AdapterMode.LOCALSTACK, "unreachable", {});

    expect(findNavigationItem(items, "/ec2")?.disabled).toBe(true);
  });

  it("labels a compatible partial service", () => {
    const items = getAvailableNavigationItems(AdapterMode.MINSTACK, "healthy", { config: true });
    const config = findNavigationItem(items, "/config");

    expect(config?.disabled).toBe(false);
    expect(config?.text).toContain("partial");
  });

  it("uses the emulator health alias for route-family services", () => {
    const service = findServiceCompatibility("/cloudwatch-logs");
    expect(service).toBeDefined();

    const availability = getServiceAvailability(service!, AdapterMode.LOCALSTACK, "healthy", {
      logs: "running",
    });

    expect(availability.enabled).toBe(true);
    expect(availability.status).toBe("full");
  });

  it("uses MiniStack health names for CloudWatch and EC2 subresources", () => {
    const cloudwatch = findServiceCompatibility("/cloudwatch");
    const networkInterface = findServiceCompatibility("/ec2-network-interface");
    expect(cloudwatch).toBeDefined();
    expect(networkInterface).toBeDefined();

    expect(
      getServiceAvailability(cloudwatch!, AdapterMode.MINSTACK, "healthy", {
        monitoring: "available",
      }).enabled,
    ).toBe(true);
    expect(
      getServiceAvailability(networkInterface!, AdapterMode.MINSTACK, "healthy", {
        ec2: "available",
      }).enabled,
    ).toBe(true);
  });

  it("does not enable a service whose health value is explicitly unavailable", () => {
    const service = findServiceCompatibility("/s3");
    expect(service).toBeDefined();

    const availability = getServiceAvailability(service!, AdapterMode.LOCALSTACK, "degraded", {
      s3: false,
    });

    expect(availability.enabled).toBe(false);
    expect(availability.status).toBe("unavailable");
  });

  it("keeps runtime-probed LocalStack limitations disabled even when health reports a service key", () => {
    const service = findServiceCompatibility("/rds");
    expect(service).toBeDefined();

    const availability = getServiceAvailability(service!, AdapterMode.LOCALSTACK, "healthy", {
      rds: "available",
    });

    expect(availability.enabled).toBe(false);
    expect(availability.status).toBe("not-supported");
    expect(availability.reason).toContain("license or operation limitation");
  });

  it("keeps runtime-probed MiniStack limitations disabled", () => {
    const service = findServiceCompatibility("/redshift");
    expect(service).toBeDefined();

    const availability = getServiceAvailability(service!, AdapterMode.MINSTACK, "healthy", {
      redshift: "available",
    });

    expect(availability.enabled).toBe(false);
    expect(availability.status).toBe("not-supported");
    expect(availability.reason).toContain("MiniStack runtime");
  });
});
