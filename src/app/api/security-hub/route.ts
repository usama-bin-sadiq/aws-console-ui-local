import { NextResponse } from "next/server";
import { GetFindingsCommand, SecurityHubClient } from "@aws-sdk/client-securityhub";
import { getUserClientFromRequest } from "@/lib/aws-clients";
import { requirePermission } from "@/lib/data-isolation";

export async function GET(request: Request) {
  const denied = await requirePermission(request, "GET");
  if (denied) return denied;

  try {
    const securityhubClient = getUserClientFromRequest(SecurityHubClient, request);
    const res = await securityhubClient.send(new GetFindingsCommand({ MaxResults: 20 }));
    return NextResponse.json({ findings: res.Findings || [] });
  } catch (error: unknown) {
    // Security Hub may not be enabled — return graceful empty state
    return NextResponse.json({
      findings: [],
      message: error instanceof Error ? error.message : "Security Hub not enabled",
    });
  }
}
