import { NextResponse } from "next/server";
import {
  ListClustersV2Command,
  CreateClusterV2Command,
  DeleteClusterCommand,
  KafkaClient,
} from "@aws-sdk/client-kafka";
import { getAdapterStatus, handleAdapterError } from "@/lib/adapter-error-handler";
import { getUserClientFromRequest } from "@/lib/aws-clients";
import { requirePermission } from "@/lib/data-isolation";

export async function GET(request: Request) {
  const denied = await requirePermission(request, "GET");
  if (denied) return denied;

  try {
    const kafkaClient = getUserClientFromRequest(KafkaClient, request);
    const res = await kafkaClient.send(new ListClustersV2Command({}));
    return NextResponse.json({ clusterInfoList: res.ClusterInfoList || [] });
  } catch (error: unknown) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}

export async function POST(request: Request) {
  const denied = await requirePermission(request, "POST");
  if (denied) return denied;

  try {
    const kafkaClient = getUserClientFromRequest(KafkaClient, request);
    const body = await request.json();
    const res = await kafkaClient.send(
      new CreateClusterV2Command({ ClusterName: body.clusterName, Provisioned: body.provisioned }),
    );
    return NextResponse.json({ clusterArn: res.ClusterArn });
  } catch (error: unknown) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}

export async function DELETE(request: Request) {
  const denied = await requirePermission(request, "DELETE");
  if (denied) return denied;

  try {
    const kafkaClient = getUserClientFromRequest(KafkaClient, request);
    const { searchParams } = new URL(request.url);
    await kafkaClient.send(
      new DeleteClusterCommand({ ClusterArn: searchParams.get("clusterArn")! }),
    );
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}
