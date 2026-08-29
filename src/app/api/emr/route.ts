import { NextResponse } from "next/server";
import {
  ListClustersCommand,
  RunJobFlowCommand,
  TerminateJobFlowsCommand,
} from "@aws-sdk/client-emr";
import { emr } from "@/lib/aws-clients";

export async function GET() {
  try {
    const res = await emr.send(new ListClustersCommand({ ClusterStates: ["RUNNING", "WAITING", "BOOTSTRAPPING"] }));
    return NextResponse.json({ clusters: res.Clusters || [] });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const res = await emr.send(new RunJobFlowCommand({
      Name: body.name,
      Instances: body.instances || { MasterInstanceType: "m5.xlarge", SlaveInstanceType: "m5.xlarge", InstanceCount: 1 },
      ReleaseLabel: body.releaseLabel || "emr-6.15.0",
    }));
    return NextResponse.json({ jobFlowId: res.JobFlowId });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const clusterId = searchParams.get("clusterId")!;
    await emr.send(new TerminateJobFlowsCommand({ JobFlowIds: [clusterId] }));
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
