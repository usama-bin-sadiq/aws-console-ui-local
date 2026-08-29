import { NextResponse } from "next/server";
import {
  ListThingsCommand,
  CreateThingCommand,
  DeleteThingCommand,
  ListTopicRulesCommand,
  CreateTopicRuleCommand,
  DeleteTopicRuleCommand,
} from "@aws-sdk/client-iot";
import { iot, iotData } from "@/lib/aws-clients";
import { PublishCommand } from "@aws-sdk/client-iot-data-plane";

export async function GET() {
  try {
    const [thingsRes, rulesRes] = await Promise.all([
      iot.send(new ListThingsCommand({})),
      iot.send(new ListTopicRulesCommand({})),
    ]);
    return NextResponse.json({
      things: thingsRes.things || [],
      rules: rulesRes.rules || [],
    });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (body.action === "createTopicRule") {
      await iot.send(new CreateTopicRuleCommand({
        ruleName: body.ruleName,
        topicRulePayload: body.topicRulePayload,
      }));
      return NextResponse.json({ success: true });
    }
    if (body.action === "publish") {
      await iotData.send(new PublishCommand({
        topic: body.topic,
        payload: Buffer.from(body.payload || ""),
      }));
      return NextResponse.json({ success: true });
    }
    const res = await iot.send(new CreateThingCommand({ thingName: body.thingName }));
    return NextResponse.json({ thing: res });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const name = searchParams.get("name")!;
    if (type === "rule") {
      await iot.send(new DeleteTopicRuleCommand({ ruleName: name }));
    } else {
      await iot.send(new DeleteThingCommand({ thingName: name }));
    }
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
