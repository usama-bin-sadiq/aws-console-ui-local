import { NextResponse } from "next/server";
import { ListSchedulesCommand, CreateScheduleCommand, DeleteScheduleCommand } from "@aws-sdk/client-scheduler";
import { scheduler } from "@/lib/aws-clients";

export async function GET() {
  try {
    const res = await scheduler.send(new ListSchedulesCommand({}));
    return NextResponse.json({ schedules: res.Schedules || [] });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    await scheduler.send(new CreateScheduleCommand({
      Name: body.name,
      ScheduleExpression: body.scheduleExpression || "rate(1 hour)",
      Target: body.target || {
        Arn: "arn:aws:sqs:us-east-1:000000000000:default",
        RoleArn: "arn:aws:iam::000000000000:role/scheduler-role",
      },
      FlexibleTimeWindow: body.flexibleTimeWindow || { Mode: "OFF" },
    }));
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    await scheduler.send(new DeleteScheduleCommand({ Name: searchParams.get("name")! }));
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
