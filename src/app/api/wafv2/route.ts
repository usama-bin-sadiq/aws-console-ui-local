import { NextResponse } from "next/server";
import { getAdapterStatus, handleAdapterError } from "@/lib/adapter-error-handler";
import {
  ListWebACLsCommand,
  CreateWebACLCommand,
  DeleteWebACLCommand,
  GetWebACLCommand,
  UpdateWebACLCommand,
  ListIPSetsCommand,
  GetIPSetCommand,
} from "@aws-sdk/client-wafv2";
import { WAFV2Client } from "@aws-sdk/client-wafv2";
import { getUserClientFromRequest } from "@/lib/aws-clients";
import { requirePermission } from "@/lib/data-isolation";

export async function GET(request: Request) {
  const denied = await requirePermission(request, "GET");
  if (denied) return denied;

  try {
    const wafv2Client = getUserClientFromRequest(WAFV2Client, request);
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    if (action === "getWebAcl") {
      const res = await wafv2Client.send(
        new GetWebACLCommand({
          Name: searchParams.get("name")!,
          Scope: "REGIONAL",
          Id: searchParams.get("id") || undefined,
        }),
      );
      return NextResponse.json({ webAcl: res.WebACL || {} });
    }

    if (action === "listIPSets") {
      const res = await wafv2Client.send(new ListIPSetsCommand({ Scope: "REGIONAL", Limit: 100 }));
      return NextResponse.json({ ipSets: res.IPSets || [] });
    }

    const res = await wafv2Client.send(new ListWebACLsCommand({ Scope: "REGIONAL", Limit: 100 }));
    return NextResponse.json({ webAcls: res.WebACLs || [] });
  } catch (error: unknown) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}

export async function POST(request: Request) {
  const denied = await requirePermission(request, "POST");
  if (denied) return denied;

  try {
    const wafv2Client = getUserClientFromRequest(WAFV2Client, request);
    const body = await request.json();
    if (body.action === "create") {
      const res = await wafv2Client.send(
        new CreateWebACLCommand({
          Name: body.name,
          Scope: "REGIONAL",
          DefaultAction: body.defaultAction || { Allow: {} },
          VisibilityConfig: body.visibilityConfig || {
            SampledRequestsEnabled: true,
            CloudWatchMetricsEnabled: true,
            MetricName: body.name,
          },
        }),
      );
      return NextResponse.json({ webAcl: res.Summary });
    }
    if (body.action === "updateWebAcl") {
      const res = await wafv2Client.send(
        new UpdateWebACLCommand({
          Name: body.name,
          Scope: "REGIONAL",
          Id: body.id,
          DefaultAction: body.defaultAction || { Allow: {} },
          Rules: body.rules || [],
          VisibilityConfig: body.visibilityConfig || {
            SampledRequestsEnabled: true,
            CloudWatchMetricsEnabled: true,
            MetricName: body.name,
          },
          LockToken: body.lockToken || "dummy",
        }),
      );
      return NextResponse.json({ success: true, nextLockToken: res.NextLockToken });
    }
    const res = await wafv2Client.send(
      new CreateWebACLCommand({
        Name: body.name,
        Scope: "REGIONAL",
        DefaultAction: body.defaultAction || { Allow: {} },
        VisibilityConfig: body.visibilityConfig || {
          SampledRequestsEnabled: true,
          CloudWatchMetricsEnabled: true,
          MetricName: body.name,
        },
      }),
    );
    return NextResponse.json({ webAcl: res.Summary });
  } catch (error: unknown) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}

export async function DELETE(request: Request) {
  const denied = await requirePermission(request, "DELETE");
  if (denied) return denied;

  try {
    const wafv2Client = getUserClientFromRequest(WAFV2Client, request);
    const { searchParams } = new URL(request.url);
    const name = searchParams.get("name")!;
    const id = searchParams.get("id")!;
    const lockToken = searchParams.get("lockToken")!;
    await wafv2Client.send(
      new DeleteWebACLCommand({ Name: name, Scope: "REGIONAL", Id: id, LockToken: lockToken }),
    );
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}
