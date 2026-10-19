// Console settings — effective region + adapter endpoint configuration.
// Read by the VPC creation wizard (region fallback) and the settings surface.
import { NextResponse } from "next/server";
import { ADAPTER_CONFIG, getAdapterEndpoint } from "@/config/adapter-config";
import { requirePermission } from "@/lib/data-isolation";

export interface ConsoleSettings {
  region: string;
  adapterMode: string;
  adapterEndpoint: string;
  localstackEndpoint: string;
  minstackEndpoint: string;
  accountId: string;
  serviceStatusCheck: boolean;
}

export function getSettings(): ConsoleSettings {
  const region = process.env.AWS_DEFAULT_REGION || process.env.AWS_REGION || "us-east-1";
  const mode = ADAPTER_CONFIG.adapterMode;
  return {
    region,
    adapterMode: mode,
    adapterEndpoint: getAdapterEndpoint(mode),
    localstackEndpoint: ADAPTER_CONFIG.endpointConfig.localstackEndpoint,
    minstackEndpoint: ADAPTER_CONFIG.endpointConfig.minstackEndpoint,
    accountId: process.env.AWS_ACCOUNT_ID || "000000000000",
    serviceStatusCheck: ADAPTER_CONFIG.serviceStatusCheck,
  };
}

export async function GET(request: Request) {
  const denied = await requirePermission(request, "GET");
  if (denied) return denied;

  try {
    return NextResponse.json(getSettings());
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
