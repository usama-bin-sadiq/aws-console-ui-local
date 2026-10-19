import { NextResponse } from "next/server";
import {
  ListSchedulesCommand,
  CreateScheduleCommand,
  DeleteScheduleCommand,
  SchedulerClient,
} from "@aws-sdk/client-scheduler";
import { getUserClientFromRequest } from "@/lib/aws-clients";
import { requirePermission } from "@/lib/data-isolation";
import { getAdapterStatus, handleAdapterError } from "@/lib/adapter-error-handler";

export async function GET(request: Request) {
  const denied = await requirePermission(request, "GET");
  if (denied) return denied;

  try {
    const schedulerClient = getUserClientFromRequest(SchedulerClient, request);
    const res = await schedulerClient.send(new ListSchedulesCommand({}));
    return NextResponse.json({ schedules: res.Schedules || [] });
  } catch (error) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}

export async function POST(request: Request) {
  const denied = await requirePermission(request, "POST");
  if (denied) return denied;

  try {
    const schedulerClient = getUserClientFromRequest(SchedulerClient, request);
    const body = await request.json();
    await schedulerClient.send(
      new CreateScheduleCommand({
        Name: body.name,
        ScheduleExpression: body.scheduleExpression || "rate(1 hour)",
        Target: body.target || {
          Arn: "arn:aws:sqs:us-east-1:000000000000:default",
          RoleArn: "arn:aws:iam::000000000000:role/scheduler-role",
        },
        FlexibleTimeWindow: body.flexibleTimeWindow || { Mode: "OFF" },
      }),
    );
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
    const schedulerClient = getUserClientFromRequest(SchedulerClient, request);
    const { searchParams } = new URL(request.url);
    await schedulerClient.send(new DeleteScheduleCommand({ Name: searchParams.get("name")! }));
    return NextResponse.json({ success: true });
  } catch (error) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}
