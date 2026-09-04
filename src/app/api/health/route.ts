import { NextResponse } from "next/server";
import { ADAPTER_CONFIG } from "@/config/adapter-config";

export async function GET() {
  const mode = ADAPTER_CONFIG.adapterMode;
  const endpointUrl =
    mode === "minstack"
      ? ADAPTER_CONFIG.endpointConfig.minstackEndpoint
      : ADAPTER_CONFIG.endpointConfig.localstackEndpoint;

  const healthCheckUrl =
    mode === "minstack"
      ? `${endpointUrl}/_ministack/health`
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
