import { NextResponse } from "next/server";
import { DescribeClustersCommand, CreateClusterCommand, DeleteClusterCommand, PauseClusterCommand, ResumeClusterCommand, RedshiftClient } from "@aws-sdk/client-redshift";
import { getUserClientFromRequest } from "@/lib/aws-clients";
import { requirePermission } from "@/lib/data-isolation";

export async function GET(request: Request) {
  const denied = await requirePermission(request, "GET");
  if (denied) return denied;

  try {
    const redshiftClient = getUserClientFromRequest(RedshiftClient, request);
    const res = await redshiftClient.send(new DescribeClustersCommand({}));
    return NextResponse.json({ clusters: res.Clusters || [] });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const denied = await requirePermission(request, "POST");
  if (denied) return denied;

  try {
    const redshiftClient = getUserClientFromRequest(RedshiftClient, request);
    const body = await request.json();
    if (body.action === "pauseCluster") {
      await redshiftClient.send(new PauseClusterCommand({ ClusterIdentifier: body.clusterIdentifier }));
      return NextResponse.json({ success: true });
    }
    if (body.action === "resumeCluster") {
      await redshiftClient.send(new ResumeClusterCommand({ ClusterIdentifier: body.clusterIdentifier }));
      return NextResponse.json({ success: true });
    }
    const res = await redshiftClient.send(new CreateClusterCommand({ ClusterIdentifier: body.clusterIdentifier, NodeType: body.nodeType || "dc2.large", MasterUsername: body.masterUsername || "admin", MasterUserPassword: body.masterUserPassword || "Admin1234!", NumberOfNodes: body.numberOfNodes || 1 }));
    return NextResponse.json({ cluster: res.Cluster });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const denied = await requirePermission(request, "DELETE");
  if (denied) return denied;

  try {
    const redshiftClient = getUserClientFromRequest(RedshiftClient, request);
    const { searchParams } = new URL(request.url);
    await redshiftClient.send(new DeleteClusterCommand({ ClusterIdentifier: searchParams.get("identifier")!, SkipFinalClusterSnapshot: true }));
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
