import { NextResponse } from "next/server";
import { DescribeLogGroupsCommand, CreateLogGroupCommand, DeleteLogGroupCommand, GetLogEventsCommand, FilterLogEventsCommand } from "@aws-sdk/client-cloudwatch-logs";
import { cloudwatchLogs } from "@/lib/aws-clients";

export async function GET() {
  try {
    const res = await cloudwatchLogs.send(new DescribeLogGroupsCommand({}));
    return NextResponse.json({ logGroups: res.logGroups || [] });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (body.action === "getEvents") {
      const res = await cloudwatchLogs.send(new GetLogEventsCommand({ logGroupName: body.logGroupName, logStreamName: body.logStreamName }));
      return NextResponse.json({ events: res.events || [] });
    }
    if (body.action === "filterEvents") {
      const res = await cloudwatchLogs.send(new FilterLogEventsCommand({ logGroupName: body.logGroupName, filterPattern: body.filterPattern }));
      return NextResponse.json({ events: res.events || [] });
    }
    await cloudwatchLogs.send(new CreateLogGroupCommand({ logGroupName: body.logGroupName }));
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    await cloudwatchLogs.send(new DeleteLogGroupCommand({ logGroupName: searchParams.get("logGroupName")! }));
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
