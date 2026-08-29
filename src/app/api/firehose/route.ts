import { NextResponse } from "next/server";
import { ListDeliveryStreamsCommand, CreateDeliveryStreamCommand, DeleteDeliveryStreamCommand } from "@aws-sdk/client-firehose";
import { firehose } from "@/lib/aws-clients";

export async function GET() {
  try {
    const res = await firehose.send(new ListDeliveryStreamsCommand({}));
    return NextResponse.json({ deliveryStreamNames: res.DeliveryStreamNames || [] });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    await firehose.send(new CreateDeliveryStreamCommand({ DeliveryStreamName: body.deliveryStreamName, DeliveryStreamType: body.deliveryStreamType || "DirectPut" }));
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
