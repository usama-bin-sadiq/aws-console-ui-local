import { NextResponse } from "next/server";
import { ListClustersV2Command, CreateClusterV2Command, DeleteClusterCommand } from "@aws-sdk/client-kafka";
import { kafka } from "@/lib/aws-clients";

export async function GET() {
  try {
    const res = await kafka.send(new ListClustersV2Command({}));
    return NextResponse.json({ clusterInfoList: res.ClusterInfoList || [] });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const res = await kafka.send(new CreateClusterV2Command({ ClusterName: body.clusterName, Provisioned: body.provisioned }));
    return NextResponse.json({ clusterArn: res.ClusterArn });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    await kafka.send(new DeleteClusterCommand({ ClusterArn: searchParams.get("clusterArn")! }));
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
