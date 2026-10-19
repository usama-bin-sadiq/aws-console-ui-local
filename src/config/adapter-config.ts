import { AdapterConfigShape } from "@/types/adapter";

/**
 * Adapter Configuration — Emulator Only (LocalStack / MiniStack / LocalEmu)
 * Real AWS endpoint support removed. This console is for local emulators only.
 */

export const ADAPTER_CONFIG: AdapterConfigShape = {
  // LocalEmu is the default: it is the free, unarchived continuation of the
  // LocalStack Community codebase, with no account, token, tiers or limits.
  adapterMode: (process.env.ACTIVE_BACKEND ||
    process.env.ADAPTER_MODE ||
    "localemu") as AdapterConfigShape["adapterMode"],
  endpointConfig: {
    localstackHostname: process.env.LOCALSTACK_HOSTNAME || "localhost",
    localstackPort: parseInt(process.env.LOCALSTACK_EDGE_PORT || "4566", 10),
    localstackSslEnabled: process.env.LOCALSTACK_SSL_ENABLED === "true",
    minstackHostname: process.env.MINSTACK_HOSTNAME || "localhost",
    minstackPort: parseInt(process.env.MINSTACK_EDGE_PORT || "4566", 10),
    minstackSslEnabled: process.env.MINSTACK_SSL_ENABLED === "true",
    localstackEndpoint:
      process.env.LOCALSTACK_ENDPOINT ||
      `http://${process.env.LOCALSTACK_HOSTNAME || "localhost"}:${process.env.LOCALSTACK_EDGE_PORT || "4566"}`,
    minstackEndpoint:
      process.env.MINSTACK_ENDPOINT ||
      `http://${process.env.MINSTACK_HOSTNAME || "localhost"}:${process.env.MINSTACK_EDGE_PORT || "4566"}`,
    // LocalEmu (`localemu/localemu`) listens on the same edge port 4566.
    localemuHostname: process.env.LOCALEMU_HOSTNAME || "localhost",
    localemuPort: parseInt(process.env.LOCALEMU_EDGE_PORT || "4566", 10),
    localemuSslEnabled: process.env.LOCALEMU_SSL_ENABLED === "true",
    localemuEndpoint:
      process.env.LOCALEMU_ENDPOINT ||
      `http://${process.env.LOCALEMU_HOSTNAME || "localhost"}:${process.env.LOCALEMU_EDGE_PORT || "4566"}`,
  },
  authConfig: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "test",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "test",
    region: process.env.AWS_DEFAULT_REGION || process.env.AWS_REGION || "us-east-1",
  },
  serviceStatusCheck: true,
};

/**
 * Endpoint for the configured adapter mode. Every SDK client and adapter helper
 * resolves its endpoint here so a new emulator is wired in exactly one place.
 */
export function getAdapterEndpoint(mode: string = ADAPTER_CONFIG.adapterMode): string {
  if (mode === "ministack") return ADAPTER_CONFIG.endpointConfig.minstackEndpoint;
  if (mode === "localemu") return ADAPTER_CONFIG.endpointConfig.localemuEndpoint;
  return ADAPTER_CONFIG.endpointConfig.localstackEndpoint;
}
