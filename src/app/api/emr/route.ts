import { NextResponse } from "next/server";
import {
  ListClustersCommand,
  RunJobFlowCommand,
  TerminateJobFlowsCommand,
} from "@aws-sdk/client-emr";
import { EMRClient } from "@aws-sdk/client-emr";
import { getUserClientFromRequest } from "@/lib/aws-clients";
import { requirePermission } from "@/lib/data-isolation";
import { getAdapterStatus, handleAdapterError } from "@/lib/adapter-error-handler";

export async function GET(request: Request) {
  const denied = await requirePermission(request, "GET");
  if (denied) return denied;

  try {
    const emrClient = getUserClientFromRequest(EMRClient, request);
    const res = await emrClient.send(
      new ListClustersCommand({ ClusterStates: ["RUNNING", "WAITING", "BOOTSTRAPPING"] }),
    );
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
    const emrClient = getUserClientFromRequest(EMRClient, request);
    const body = await request.json();
    const res = await emrClient.send(
      new RunJobFlowCommand({
        Name: body.name,
        Instances: body.instances || {
          MasterInstanceType: "m5.xlarge",
          SlaveInstanceType: "m5.xlarge",
          InstanceCount: 1,
        },
        ReleaseLabel: body.releaseLabel || "emr-6.15.0",
      }),
    );
    return NextResponse.json({ jobFlowId: res.JobFlowId });
  } catch (error: unknown) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}

export async function DELETE(request: Request) {
  const denied = await requirePermission(request, "DELETE");
  if (denied) return denied;

  try {
    const emrClient = getUserClientFromRequest(EMRClient, request);
    const { searchParams } = new URL(request.url);
    const clusterId = searchParams.get("clusterId")!;
    await emrClient.send(new TerminateJobFlowsCommand({ JobFlowIds: [clusterId] }));
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}
