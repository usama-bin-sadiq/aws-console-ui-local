import { NextResponse } from "next/server";
import {
  ListClustersCommand,
  DescribeClustersCommand,
  CreateClusterCommand,
  DeleteClusterCommand,
  CreateServiceCommand,
  ListServicesCommand,
} from "@aws-sdk/client-ecs";
import { ecs } from "@/lib/aws-clients";

export async function GET() {
  try {
    const listRes = await ecs.send(new ListClustersCommand({}));
    const clusterArns = listRes.clusterArns || [];
    if (clusterArns.length === 0) {
      return NextResponse.json({ clusters: [] });
    }
    const descRes = await ecs.send(new DescribeClustersCommand({ clusters: clusterArns }));
    return NextResponse.json({ clusters: descRes.clusters || [] });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (body.action === "createService") {
      const res = await ecs.send(new CreateServiceCommand({
        cluster: body.cluster,
        serviceName: body.serviceName,
        taskDefinition: body.taskDefinition,
        desiredCount: body.desiredCount || 1,
      }));
      return NextResponse.json({ service: res.service });
    }
    if (body.action === "listServices") {
      const res = await ecs.send(new ListServicesCommand({ cluster: body.cluster }));
      return NextResponse.json({ serviceArns: res.serviceArns || [] });
    }
    // default: createCluster
    const res = await ecs.send(new CreateClusterCommand({ clusterName: body.clusterName }));
    return NextResponse.json({ cluster: res.cluster });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const cluster = searchParams.get("cluster")!;
    await ecs.send(new DeleteClusterCommand({ cluster }));
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
