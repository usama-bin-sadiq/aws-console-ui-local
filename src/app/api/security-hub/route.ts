import { NextResponse } from "next/server";
import { securityhub } from "@/lib/aws-clients";
import { GetFindingsCommand } from "@aws-sdk/client-securityhub";

export async function GET() {
  try {
    const res = await securityhub.send(new GetFindingsCommand({ MaxResults: 20 }));
    return NextResponse.json({ findings: res.Findings || [] });
  } catch (error: unknown) {
    // Security Hub may not be enabled — return graceful empty state
    return NextResponse.json({ findings: [], message: error instanceof Error ? error.message : "Security Hub not enabled" });
  }
}
