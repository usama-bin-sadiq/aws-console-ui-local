// Availability Zones — powers the VPC creation wizard region/AZ picker.
// Commands: @aws-sdk/client-ec2 (DescribeAvailabilityZones)
import { NextResponse } from "next/server";
import { EC2Client, DescribeAvailabilityZonesCommand } from "@aws-sdk/client-ec2";
import { getUserClientFromRequest } from "@/lib/aws-clients";
import { requirePermission } from "@/lib/data-isolation";
import { getAdapterStatus } from "@/lib/adapter-error-handler";

export async function GET(request: Request) {
  const denied = await requirePermission(request, "GET");
  if (denied) return denied;

  try {
    const ec2Client = getUserClientFromRequest(EC2Client, request);
    const res = await ec2Client.send(
      new DescribeAvailabilityZonesCommand({ AllAvailabilityZones: true }),
    );
    const zones = res.AvailabilityZones || [];
    return NextResponse.json({
      zones,
      items: zones,
      count: zones.length,
      region: zones[0]?.RegionName || process.env.AWS_DEFAULT_REGION || "us-east-1",
    });
  } catch (error: unknown) {
    // The region/AZ picker needs a usable response even when the emulator cannot
    // describe zones, so this degrades to an empty list plus the reason rather
    // than failing the whole picker.
    const adapter = getAdapterStatus();
    const message = error instanceof Error ? error.message : "Unknown error";
    const region = process.env.AWS_DEFAULT_REGION || process.env.AWS_REGION || "us-east-1";
    return NextResponse.json({
      zones: [],
      items: [],
      count: 0,
      region,
      message: `Availability zones unavailable from ${adapter.mode} adapter (${adapter.endpoint}): ${message}`,
      adapterMode: adapter.mode,
      adapterEndpoint: adapter.endpoint,
    });
  }
}
