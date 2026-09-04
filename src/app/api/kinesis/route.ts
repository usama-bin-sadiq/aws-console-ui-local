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
import { kinesis } from "@/lib/aws-clients";

export async function GET() {
  try {
    const [listRes, describePromises] = [
      kinesis.send(new ListStreamsCommand({})).catch(() => ({ StreamNames: [] })),
      Promise.resolve({} as any),
    ];
    const res = await listRes;
    const streamNames: string[] = res.StreamNames || [];

    const details: Record<string, any> = {};
    await Promise.all(
      streamNames.map(async (name) => {
        try {
          const d = await kinesis.send(new DescribeStreamCommand({ StreamName: name }));
          details[name] = d.StreamDescription || {};
        } catch {
          details[name] = { StreamStatus: "ACTIVE", Shards: [] };
        }
      })
    );
    return NextResponse.json({ streams: streamNames, streamDetails: details });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (body.action === "putRecord") {
      await kinesis.send(
        new PutRecordCommand({
          StreamName: body.streamName,
          Data: Buffer.from(body.data || ""),
          PartitionKey: body.partitionKey || "default",
        })
      );
      return NextResponse.json({ success: true });
    }
    if (body.action === "updateRetention") {
      await kinesis.send(
        new IncreaseStreamRetentionPeriodCommand({
          StreamName: body.streamName,
          RetentionPeriodHours: body.retentionHours || 24,
        })
      );
      return NextResponse.json({ success: true });
    }
    const streamName = body.streamName || body.StreamName;
    await kinesis.send(new CreateStreamCommand({ StreamName: streamName, ShardCount: body.shardCount || 1 }));
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    await kinesis.send(new DeleteStreamCommand({ StreamName: searchParams.get("streamName")! }));
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
