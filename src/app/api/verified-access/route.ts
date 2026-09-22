import { NextResponse } from "next/server";
import { EC2Client, DescribeVerifiedAccessInstancesCommand } from "@aws-sdk/client-ec2";
import { getUserClientFromRequest } from "@/lib/aws-clients";
import { requirePermission } from "@/lib/data-isolation";

export async function GET(request: Request) {
  const denied = await requirePermission(request, "GET");
  if (denied) return denied;

  try {
    const ec2Client = getUserClientFromRequest(EC2Client, request);
    const res = await ec2Client.send(new DescribeVerifiedAccessInstancesCommand({}));
    return NextResponse.json({ instances: res.VerifiedAccessInstances || [] });
  } catch (error: unknown) {
    return NextResponse.json({ instances: [], message: error instanceof Error ? error.message : "Verified Access not available" });
  }
}
