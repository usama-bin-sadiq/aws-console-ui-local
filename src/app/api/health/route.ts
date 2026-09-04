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
      return NextResponse.json({
        status: "healthy",
        provider: mode,
        endpoint: endpointUrl,
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
