import { NextResponse } from "next/server";
import {
  ListDeliveryStreamsCommand,
  CreateDeliveryStreamCommand,
  DeleteDeliveryStreamCommand,
  DescribeDeliveryStreamCommand,
} from "@aws-sdk/client-firehose";
import { firehose } from "@/lib/aws-clients";

export async function GET() {
  try {
    const [listRes] = await Promise.all([
      firehose.send(new ListDeliveryStreamsCommand({})).catch(() => ({ DeliveryStreamNames: [] })),
    ]);
    const names: string[] = listRes.DeliveryStreamNames || [];
    const details: Record<string, any> = {};
    await Promise.all(
      names.map(async (name) => {
        try {
          const d = await firehose.send(new DescribeDeliveryStreamCommand({ DeliveryStreamName: name }));
          details[name] = d.DeliveryStreamDescription || {};
        } catch {
          details[name] = { DeliveryStreamStatus: "ACTIVE", DeliveryStreamType: "DirectPut" };
        }
      })
    );
    return NextResponse.json({ deliveryStreamNames: names, streamDetails: details });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    await firehose.send(
      new CreateDeliveryStreamCommand({
        DeliveryStreamName: body.deliveryStreamName,
        DeliveryStreamType: body.deliveryStreamType || "DirectPut",
      })
    );
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    await firehose.send(new DeleteDeliveryStreamCommand({ DeliveryStreamName: searchParams.get("streamName")! }));
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
