import { NextResponse } from "next/server";
import {
  DescribeLogGroupsCommand,
  CreateLogGroupCommand,
  DeleteLogGroupCommand,
  GetLogEventsCommand,
  FilterLogEventsCommand,
  CloudWatchLogsClient,
} from "@aws-sdk/client-cloudwatch-logs";
import { getUserClientFromRequest } from "@/lib/aws-clients";
import { requirePermission } from "@/lib/data-isolation";
import { getAdapterStatus, handleAdapterError } from "@/lib/adapter-error-handler";

export async function GET(request: Request) {
  const denied = await requirePermission(request, "GET");
  if (denied) return denied;

  try {
    const cloudwatchLogsClient = getUserClientFromRequest(CloudWatchLogsClient, request);
    const res = await cloudwatchLogsClient.send(new DescribeLogGroupsCommand({}));
    return NextResponse.json({ logGroups: res.logGroups || [] });
  } catch (error) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}

export async function POST(request: Request) {
  const denied = await requirePermission(request, "POST");
  if (denied) return denied;

  try {
    const cloudwatchLogsClient = getUserClientFromRequest(CloudWatchLogsClient, request);
    const body = await request.json();
    if (body.action === "getEvents") {
      const res = await cloudwatchLogsClient.send(
        new GetLogEventsCommand({
          logGroupName: body.logGroupName,
          logStreamName: body.logStreamName,
        }),
      );
      return NextResponse.json({ events: res.events || [] });
    }
    if (body.action === "filterEvents") {
      const res = await cloudwatchLogsClient.send(
        new FilterLogEventsCommand({
          logGroupName: body.logGroupName,
          filterPattern: body.filterPattern,
        }),
      );
      return NextResponse.json({ events: res.events || [] });
    }
    await cloudwatchLogsClient.send(new CreateLogGroupCommand({ logGroupName: body.logGroupName }));
    return NextResponse.json({ success: true });
  } catch (error) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}

export async function DELETE(request: Request) {
  const denied = await requirePermission(request, "DELETE");
  if (denied) return denied;

  try {
    const cloudwatchLogsClient = getUserClientFromRequest(CloudWatchLogsClient, request);
    const { searchParams } = new URL(request.url);
    await cloudwatchLogsClient.send(
      new DeleteLogGroupCommand({ logGroupName: searchParams.get("logGroupName")! }),
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}
