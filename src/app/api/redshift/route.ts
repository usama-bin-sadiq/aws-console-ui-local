import { NextResponse } from "next/server";
import { DescribeClustersCommand, CreateClusterCommand, DeleteClusterCommand, PauseClusterCommand, ResumeClusterCommand } from "@aws-sdk/client-redshift";
import { redshift } from "@/lib/aws-clients";

export async function GET() {
  try {
    const res = await redshift.send(new DescribeClustersCommand({}));
    return NextResponse.json({ clusters: res.Clusters || [] });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (body.action === "pauseCluster") {
      await redshift.send(new PauseClusterCommand({ ClusterIdentifier: body.clusterIdentifier }));
      return NextResponse.json({ success: true });
    }
    if (body.action === "resumeCluster") {
      await redshift.send(new ResumeClusterCommand({ ClusterIdentifier: body.clusterIdentifier }));
      return NextResponse.json({ success: true });
    }
    const res = await redshift.send(new CreateClusterCommand({ ClusterIdentifier: body.clusterIdentifier, NodeType: body.nodeType || "dc2.large", MasterUsername: body.masterUsername || "admin", MasterUserPassword: body.masterUserPassword || "Admin1234!", NumberOfNodes: body.numberOfNodes || 1 }));
    return NextResponse.json({ cluster: res.Cluster });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    await redshift.send(new DeleteClusterCommand({ ClusterIdentifier: searchParams.get("identifier")!, SkipFinalClusterSnapshot: true }));
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
