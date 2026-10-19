import { NextResponse } from "next/server";
import {
  XRayClient,
  GetServiceGraphCommand,
  GetSamplingRulesCommand,
  PutTraceSegmentsCommand,
} from "@aws-sdk/client-xray";
import { getUserClientFromRequest } from "@/lib/aws-clients";
import { requirePermission } from "@/lib/data-isolation";
import { getAdapterStatus, handleAdapterError } from "@/lib/adapter-error-handler";

export async function GET(request: Request) {
  const denied = await requirePermission(request, "GET");
  if (denied) return denied;

  try {
    const xrayClient = getUserClientFromRequest(XRayClient, request);
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - 60 * 60 * 1000); // last 1 hour
    const res = await xrayClient.send(
      new GetServiceGraphCommand({ StartTime: startTime, EndTime: endTime }),
    );
    return NextResponse.json({ services: res.Services || [] });
  } catch (error: unknown) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}

export async function POST(request: Request) {
  const denied = await requirePermission(request, "POST");
  if (denied) return denied;

  try {
    const xrayClient = getUserClientFromRequest(XRayClient, request);
    const body = await request.json();
    if (body.action === "getSamplingRules") {
      const res = await xrayClient.send(new GetSamplingRulesCommand({}));
      return NextResponse.json({ samplingRuleRecords: res.SamplingRuleRecords || [] });
    }
    if (body.action === "putTraceSegments") {
      await xrayClient.send(
        new PutTraceSegmentsCommand({ TraceSegmentDocuments: body.traceSegmentDocuments || [] }),
      );
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error: unknown) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}
