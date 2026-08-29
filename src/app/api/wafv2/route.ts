import { NextResponse } from "next/server";
import {
  ListWebACLsCommand,
  CreateWebACLCommand,
  DeleteWebACLCommand,
} from "@aws-sdk/client-wafv2";
import { wafv2 } from "@/lib/aws-clients";

export async function GET() {
  try {
    const res = await wafv2.send(new ListWebACLsCommand({ Scope: "REGIONAL", Limit: 100 }));
    return NextResponse.json({ webAcls: res.WebACLs || [] });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const res = await wafv2.send(new CreateWebACLCommand({ Name: body.name, Scope: "REGIONAL", DefaultAction: body.defaultAction || { Allow: {} }, VisibilityConfig: body.visibilityConfig || { SampledRequestsEnabled: true, CloudWatchMetricsEnabled: true, MetricName: body.name } }));
    return NextResponse.json({ webAcl: res.Summary });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get("name")!;
    const id = searchParams.get("id")!;
    const lockToken = searchParams.get("lockToken")!;
    await wafv2.send(new DeleteWebACLCommand({ Name: name, Scope: "REGIONAL", Id: id, LockToken: lockToken }));
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
