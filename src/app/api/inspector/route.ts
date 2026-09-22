import { NextResponse } from "next/server";
import { ListFindingsCommand, Inspector2Client } from "@aws-sdk/client-inspector2";
import { getUserClientFromRequest } from "@/lib/aws-clients";
import { requirePermission } from "@/lib/data-isolation";

export async function GET(request: Request) {
  const denied = await requirePermission(request, "GET");
  if (denied) return denied;

  try {
    const inspector2Client = getUserClientFromRequest(Inspector2Client, request);
    const res = await inspector2Client.send(new ListFindingsCommand({}));
    return NextResponse.json({ findings: res.findings || [] });
  } catch (error: unknown) {
    return NextResponse.json({ findings: [], message: error instanceof Error ? error.message : "Inspector not enabled" });
  }
}
