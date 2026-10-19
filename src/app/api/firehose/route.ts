import { NextResponse } from "next/server";
import {
  ListDeliveryStreamsCommand,
  CreateDeliveryStreamCommand,
  DeleteDeliveryStreamCommand,
  DescribeDeliveryStreamCommand,
} from "@aws-sdk/client-firehose";
import { FirehoseClient } from "@aws-sdk/client-firehose";
import { getUserClientFromRequest } from "@/lib/aws-clients";
import { requirePermission } from "@/lib/data-isolation";
import { getAdapterStatus, handleAdapterError } from "@/lib/adapter-error-handler";

export async function GET(request: Request) {
  const denied = await requirePermission(request, "GET");
  if (denied) return denied;

  try {
    const firehoseClient = getUserClientFromRequest(FirehoseClient, request);
    const [listRes] = await Promise.all([
      firehoseClient
        .send(new ListDeliveryStreamsCommand({}))
        .catch(() => ({ DeliveryStreamNames: [] })),
    ]);
    const names: string[] = listRes.DeliveryStreamNames || [];
    const details: Record<string, any> = {};
    await Promise.all(
      names.map(async (name) => {
        try {
          const d = await firehoseClient.send(
            new DescribeDeliveryStreamCommand({ DeliveryStreamName: name }),
          );
          details[name] = d.DeliveryStreamDescription || {};
        } catch {
          details[name] = { DeliveryStreamStatus: "ACTIVE", DeliveryStreamType: "DirectPut" };
        }
      }),
    );
    return NextResponse.json({ deliveryStreamNames: names, streamDetails: details });
  } catch (error) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}

export async function POST(request: Request) {
  const denied = await requirePermission(request, "POST");
  if (denied) return denied;

  try {
    const firehoseClient = getUserClientFromRequest(FirehoseClient, request);
    const body = await request.json();
    await firehoseClient.send(
      new CreateDeliveryStreamCommand({
        DeliveryStreamName: body.deliveryStreamName,
        DeliveryStreamType: body.deliveryStreamType || "DirectPut",
      }),
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}

export async function DELETE(request: Request) {
  const denied = await requirePermission(request, "DELETE");
  if (denied) return denied;

  try {
    const firehoseClient = getUserClientFromRequest(FirehoseClient, request);
    const { searchParams } = new URL(request.url);
    await firehoseClient.send(
      new DeleteDeliveryStreamCommand({ DeliveryStreamName: searchParams.get("streamName")! }),
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}
