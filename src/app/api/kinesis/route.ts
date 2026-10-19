import { NextResponse } from "next/server";
import {
  ListStreamsCommand,
  CreateStreamCommand,
  DeleteStreamCommand,
  PutRecordCommand,
  DescribeStreamCommand,
  UpdateShardCountCommand,
  IncreaseStreamRetentionPeriodCommand,
} from "@aws-sdk/client-kinesis";
import { KinesisClient } from "@aws-sdk/client-kinesis";
import { getUserClientFromRequest } from "@/lib/aws-clients";
import { requirePermission } from "@/lib/data-isolation";
import { getAdapterStatus, handleAdapterError } from "@/lib/adapter-error-handler";

export async function GET(request: Request) {
  const denied = await requirePermission(request, "GET");
  if (denied) return denied;

  try {
    const kinesisClient = getUserClientFromRequest(KinesisClient, request);
    const [listRes, describePromises] = [
      kinesisClient.send(new ListStreamsCommand({})).catch(() => ({ StreamNames: [] })),
      Promise.resolve({} as any),
    ];
    const res = await listRes;
    const streamNames: string[] = res.StreamNames || [];

    const details: Record<string, any> = {};
    await Promise.all(
      streamNames.map(async (name) => {
        try {
          const d = await kinesisClient.send(new DescribeStreamCommand({ StreamName: name }));
          details[name] = d.StreamDescription || {};
        } catch {
          details[name] = { StreamStatus: "ACTIVE", Shards: [] };
        }
      }),
    );
    return NextResponse.json({ streams: streamNames, streamDetails: details });
  } catch (error) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}

export async function POST(request: Request) {
  const denied = await requirePermission(request, "POST");
  if (denied) return denied;

  try {
    const kinesisClient = getUserClientFromRequest(KinesisClient, request);
    const body = await request.json();
    if (body.action === "putRecord") {
      await kinesisClient.send(
        new PutRecordCommand({
          StreamName: body.streamName,
          Data: Buffer.from(body.data || ""),
          PartitionKey: body.partitionKey || "default",
        }),
      );
      return NextResponse.json({ success: true });
    }
    if (body.action === "updateRetention") {
      await kinesisClient.send(
        new IncreaseStreamRetentionPeriodCommand({
          StreamName: body.streamName,
          RetentionPeriodHours: body.retentionHours || 24,
        }),
      );
      return NextResponse.json({ success: true });
    }
    const streamName = body.streamName || body.StreamName;
    await kinesisClient.send(
      new CreateStreamCommand({ StreamName: streamName, ShardCount: body.shardCount || 1 }),
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
    const kinesisClient = getUserClientFromRequest(KinesisClient, request);
    const { searchParams } = new URL(request.url);
    await kinesisClient.send(
      new DeleteStreamCommand({ StreamName: searchParams.get("streamName")! }),
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}
