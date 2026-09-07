import { NextResponse } from "next/server";
import { ADAPTER_CONFIG } from "@/config/adapter-config";

export async function GET() {
  const mode = ADAPTER_CONFIG.adapterMode;
  const endpointUrl = mode === "ministack"
    ? ADAPTER_CONFIG.endpointConfig.minstackEndpoint
    : mode === "real"
      ? ADAPTER_CONFIG.endpointConfig.realEndpointUrl
      : ADAPTER_CONFIG.endpointConfig.localstackEndpoint;

  if (!endpointUrl) {
    return NextResponse.json({ status: "unreachable", provider: mode, error: "No endpoint configured" }, { status: 503 });
  }

  const healthCheckUrl = mode === "ministack"
    ? `${endpointUrl}/_ministack/health`
    : mode === "real"
      ? `${endpointUrl}/health`
      : `${endpointUrl}/_localstack/health`;

  try {
    const response = await fetch(healthCheckUrl, {
      signal: AbortSignal.timeout(3000),
    });

    if (response.ok) {
      const data = await response.json();
      let readiness: "ready" | "starting" | "unknown" = "unknown";
      if (mode === "ministack") {
        try {
          const readyResponse = await fetch(`${endpointUrl}/_ministack/ready`, {
            signal: AbortSignal.timeout(1500),
          });
          readiness = readyResponse.ok ? "ready" : "starting";
        } catch {
          readiness = "starting";
        }
      }
      const serviceValues = Object.values(data.services || {});
      const hasUnavailableService = serviceValues.some((service) => {
        if (typeof service !== "object" || service === null) return false;
        const value = (service as { status?: unknown }).status;
        return value === false || value === "unavailable" || value === "error";
      });
      return NextResponse.json({
        status: readiness === "starting" ? "starting" : hasUnavailableService ? "degraded" : "healthy",
        provider: mode,
        endpoint: endpointUrl,
        edition: data.edition,
        readiness,
        services: data.services || {},
      });
    }
  } catch {
    // Endpoint unreachable — app is still healthy, adapter just not connected
  }

  return NextResponse.json({
    status: "unreachable",
    provider: mode,
    endpoint: endpointUrl,
    error: `Adapter configured for ${mode} at ${endpointUrl} but endpoint is unreachable`,
  }, { status: 503 });
}
