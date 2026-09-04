import { NextResponse } from "next/server";
import {
  ListEventBusesCommand,
  CreateEventBusCommand,
  DeleteEventBusCommand,
  ListRulesCommand,
} from "@aws-sdk/client-eventbridge";
import { eventbridge } from "@/lib/aws-clients";

export async function GET() {
  try {
    const [busRes, rulesRes] = await Promise.all([
      eventbridge.send(new ListEventBusesCommand({})),
      eventbridge
        .send(new ListRulesCommand({ EventBusName: "default" }))
        .catch(() => ({ Rules: [] })),
    ]);
    return NextResponse.json({
      eventBuses: busRes.EventBuses || [],
      rules: rulesRes.Rules || [],
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const res = await eventbridge.send(
      new CreateEventBusCommand({ Name: body.name })
    );
    return NextResponse.json({ eventBusArn: res.EventBusArn });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    await eventbridge.send(
      new DeleteEventBusCommand({ Name: searchParams.get("busName")! })
    );
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
