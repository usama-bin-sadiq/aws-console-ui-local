import { NextResponse } from "next/server";
import { DescribeClustersCommand, CreateClusterCommand, DeleteClusterCommand } from "@aws-sdk/client-memorydb";
import { memorydb } from "@/lib/aws-clients";

export async function GET() {
  try {
    const res = await memorydb.send(new DescribeClustersCommand({}));
    return NextResponse.json({ clusters: res.Clusters || [] });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const res = await memorydb.send(new CreateClusterCommand({ ClusterName: body.clusterName, NodeType: body.nodeType || "db.r6g.large", ACLName: body.aclName || "open-access" }));
    return NextResponse.json({ cluster: res.Cluster });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    await memorydb.send(new DeleteClusterCommand({ ClusterName: searchParams.get("name")! }));
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
