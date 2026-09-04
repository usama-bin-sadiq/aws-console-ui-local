import { ADAPTER_CONFIG } from "@/config/adapter-config";

export function getAdapterStatus(): { reachable: boolean; endpoint: string; mode: string } {
  const mode = ADAPTER_CONFIG.adapterMode;
  const endpoint = mode === "minstack"
    ? ADAPTER_CONFIG.endpointConfig.minstackEndpoint
    : ADAPTER_CONFIG.endpointConfig.localstackEndpoint;
  return { reachable: false, endpoint, mode };
}

export function handleAdapterError(error: any, mode: string, endpoint: string): Response {
  return new Response(JSON.stringify({
    error: error.message || "Adapter endpoint unreachable",
    adapterMode: mode,
    adapterEndpoint: endpoint,
    adapterStatus: "unreachable",
    message: `Adapter configured for ${mode} but endpoint ${endpoint} is not reachable. Ensure docker-compose service is running.`
  }), {
    status: 503,
    headers: { "Content-Type": "application/json", "x-adapter-mode": mode, "x-adapter-endpoint": endpoint },
  });
}
