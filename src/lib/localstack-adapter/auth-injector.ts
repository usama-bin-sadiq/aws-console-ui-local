/**
 * Adapter Auth Injector — Injects dummy/test credentials for adapter mode.
 * Every SDK client must receive these credentials. No exceptions.
 */

import { AuthCredentials } from "@/types/adapter";
import { ADAPTER_CONFIG } from "@/config/adapter-config";
import { ADAPTER_DEFAULT_REGION } from "@/constants/adapter-constants";

export function injectAuth(adapterMode?: "localstack" | "ministack" | "real"): AuthCredentials {
  const mode = adapterMode || ADAPTER_CONFIG.adapterMode;

  if (mode === "real") {
    return {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || "real-user-key",
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "real-user-secret",
      sessionToken: process.env.AWS_SESSION_TOKEN,
      region: ADAPTER_CONFIG.authConfig.region || ADAPTER_DEFAULT_REGION,
    };
  }

  return {
    accessKeyId:
      ADAPTER_CONFIG.authConfig.accessKeyId ||
      process.env.AWS_ACCESS_KEY_ID ||
      "AKIAIOSFODNN7EXAMPLE",
    secretAccessKey:
      ADAPTER_CONFIG.authConfig.secretAccessKey ||
      process.env.AWS_SECRET_ACCESS_KEY ||
      "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
    sessionToken: ADAPTER_CONFIG.authConfig.sessionToken || process.env.AWS_SESSION_TOKEN,
    region: ADAPTER_CONFIG.authConfig.region || ADAPTER_DEFAULT_REGION,
  };
}
