import { NextResponse } from "next/server";
import { GetServiceGraphCommand, GetSamplingRulesCommand, PutTraceSegmentsCommand } from "@aws-sdk/client-xray";
import { xray } from "@/lib/aws-clients";

export async function GET() {
  try {
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - 60 * 60 * 1000); // last 1 hour
    const res = await xray.send(new GetServiceGraphCommand({ StartTime: startTime, EndTime: endTime }));
    return NextResponse.json({ services: res.Services || [] });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (body.action === "getSamplingRules") {
      const res = await xray.send(new GetSamplingRulesCommand({}));
      return NextResponse.json({ samplingRuleRecords: res.SamplingRuleRecords || [] });
    }
    if (body.action === "putTraceSegments") {
      await xray.send(new PutTraceSegmentsCommand({ TraceSegmentDocuments: body.traceSegmentDocuments || [] }));
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
