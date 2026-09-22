import { NextResponse } from "next/server";
import { STSClient, GetCallerIdentityCommand } from "@aws-sdk/client-sts";
import { getUserClientFromRequest } from "@/lib/aws-clients";
import { requirePermission } from "@/lib/data-isolation";

export async function GET(request: Request) {
  const denied = await requirePermission(request, "GET");
  if (denied) return denied;

  try {
    const stsClient = getUserClientFromRequest(STSClient, request);
    const res = await stsClient.send(new GetCallerIdentityCommand({}));
    return NextResponse.json({
      identity: { Account: res.Account, UserId: res.UserId, Arn: res.Arn },
    });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
