import { NextResponse } from "next/server";
import {
  MemoryDBClient,
  DescribeClustersCommand,
  CreateClusterCommand,
  DeleteClusterCommand,
} from "@aws-sdk/client-memorydb";
import { getUserClientFromRequest } from "@/lib/aws-clients";
import { requirePermission } from "@/lib/data-isolation";
import { getAdapterStatus, handleAdapterError } from "@/lib/adapter-error-handler";

export async function GET(request: Request) {
  const denied = await requirePermission(request, "GET");
  if (denied) return denied;

  try {
    const memorydbClient = getUserClientFromRequest(MemoryDBClient, request);
    const res = await memorydbClient.send(new DescribeClustersCommand({}));
    return NextResponse.json({ clusters: res.Clusters || [] });
  } catch (error: unknown) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}

export async function POST(request: Request) {
  const denied = await requirePermission(request, "POST");
  if (denied) return denied;

  try {
    const memorydbClient = getUserClientFromRequest(MemoryDBClient, request);
    const body = await request.json();
    const res = await memorydbClient.send(
      new CreateClusterCommand({
        ClusterName: body.clusterName,
        NodeType: body.nodeType || "db.r6g.large",
        ACLName: body.aclName || "open-access",
      }),
    );
    return NextResponse.json({ cluster: res.Cluster });
  } catch (error: unknown) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}

export async function DELETE(request: Request) {
  const denied = await requirePermission(request, "DELETE");
  if (denied) return denied;

  try {
    const memorydbClient = getUserClientFromRequest(MemoryDBClient, request);
    const { searchParams } = new URL(request.url);
    await memorydbClient.send(new DeleteClusterCommand({ ClusterName: searchParams.get("name")! }));
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}
