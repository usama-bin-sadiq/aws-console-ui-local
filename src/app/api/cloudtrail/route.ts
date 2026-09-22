import { NextResponse } from "next/server";
import {
  DescribeTrailsCommand,
  CreateTrailCommand,
  DeleteTrailCommand,
  GetTrailStatusCommand,
  StartLoggingCommand,
  StopLoggingCommand,
  LookupEventsCommand,
} from "@aws-sdk/client-cloudtrail";
import { CloudTrailClient } from "@aws-sdk/client-cloudtrail";
import { getUserClientFromRequest } from "@/lib/aws-clients";
import { requirePermission } from "@/lib/data-isolation";

export async function GET(request: Request) {
  const denied = await requirePermission(request, "GET");
  if (denied) return denied;

  try {
    const cloudtrailClient = getUserClientFromRequest(CloudTrailClient, request);
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    if (action === "lookupEvents") {
      const res = await cloudtrailClient.send(new LookupEventsCommand({ MaxResults: 50 }));
      return NextResponse.json({ events: res.Events || [] });
    }

    const res = await cloudtrailClient.send(new DescribeTrailsCommand({}));
    const trails = res.trailList || [];

    const trailsWithStatus = await Promise.all(
      trails.map(async (trail) => {
        try {
          const status = await cloudtrailClient.send(new GetTrailStatusCommand({ Name: trail.Name! }));
          return {
            ...trail,
            IsLogging: status.IsLogging ?? false,
          };
        } catch {
          return { ...trail, IsLogging: false };
        }
      })
    );

    return NextResponse.json({ trails: trailsWithStatus });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const denied = await requirePermission(request, "POST");
  if (denied) return denied;

  try {
    const cloudtrailClient = getUserClientFromRequest(CloudTrailClient, request);
    const body = await request.json();

    if (body.action === "startLogging") {
      await cloudtrailClient.send(new StartLoggingCommand({ Name: body.name }));
      return NextResponse.json({ success: true });
    }

    if (body.action === "stopLogging") {
      await cloudtrailClient.send(new StopLoggingCommand({ Name: body.name }));
      return NextResponse.json({ success: true });
    }

    await cloudtrailClient.send(
      new CreateTrailCommand({
        Name: body.name,
        S3BucketName: body.s3BucketName || "cloudtrail-logs",
        IsMultiRegionTrail: body.isMultiRegionTrail ?? false,
        EnableLogFileValidation: body.enableLogFileValidation ?? true,
      })
    );
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const denied = await requirePermission(request, "DELETE");
  if (denied) return denied;

  try {
    const cloudtrailClient = getUserClientFromRequest(CloudTrailClient, request);
    const { searchParams } = new URL(request.url);
    await cloudtrailClient.send(new DeleteTrailCommand({ Name: searchParams.get("name")! }));
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
