import { NextResponse } from "next/server";
import { ListStreamsCommand, CreateStreamCommand, DeleteStreamCommand, PutRecordCommand } from "@aws-sdk/client-kinesis";
import { kinesis } from "@/lib/aws-clients";

export async function GET() {
  try {
    const res = await kinesis.send(new ListStreamsCommand({}));
    return NextResponse.json({ streams: res.StreamNames || [] });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (body.action === "putRecord") {
      await kinesis.send(new PutRecordCommand({ StreamName: body.streamName, Data: Buffer.from(body.data || ""), PartitionKey: body.partitionKey || "default" }));
      return NextResponse.json({ success: true });
    }
    await kinesis.send(new CreateStreamCommand({ StreamName: body.streamName || body.StreamName, ShardCount: body.shardCount || 1 }));
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
