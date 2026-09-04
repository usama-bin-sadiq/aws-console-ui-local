import { NextResponse } from "next/server";
import { DescribeVerifiedAccessInstancesCommand } from "@aws-sdk/client-ec2";
import { ec2 } from "@/lib/aws-clients";

export async function GET() {
  try {
    const res = await ec2.send(new DescribeVerifiedAccessInstancesCommand({}));
    return NextResponse.json({ instances: res.VerifiedAccessInstances || [] });
  } catch (error: unknown) {
    return NextResponse.json({ instances: [], message: error instanceof Error ? error.message : "Verified Access not available" });
  }
}
