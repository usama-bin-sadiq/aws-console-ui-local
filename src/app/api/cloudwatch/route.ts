import { NextResponse } from "next/server";
import { DescribeAlarmsCommand, PutMetricAlarmCommand, DeleteAlarmsCommand, GetMetricStatisticsCommand, ListMetricsCommand } from "@aws-sdk/client-cloudwatch";
import { cloudwatch } from "@/lib/aws-clients";

export async function GET() {
  try {
    const [alarms, metrics] = await Promise.all([
      cloudwatch.send(new DescribeAlarmsCommand({})),
      cloudwatch.send(new ListMetricsCommand({})),
    ]);
    return NextResponse.json({
      alarms: alarms.MetricAlarms || [],
      metrics: metrics.Metrics || [],
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    await cloudwatch.send(new PutMetricAlarmCommand(body));
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const alarmNames = searchParams.get("alarmNames")?.split(",") || [];
    await cloudwatch.send(new DeleteAlarmsCommand({ AlarmNames: alarmNames }));
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
