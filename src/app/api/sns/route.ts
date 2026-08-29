import { NextResponse } from "next/server";
import { ListTopicsCommand, CreateTopicCommand, DeleteTopicCommand, SubscribeCommand, PublishCommand, ListSubscriptionsByTopicCommand } from "@aws-sdk/client-sns";
import { sns } from "@/lib/aws-clients";

export async function GET() {
  try {
    const res = await sns.send(new ListTopicsCommand({}));
    return NextResponse.json({ topics: res.Topics || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (body.action === "publish") {
      await sns.send(new PublishCommand({
        TopicArn: body.topicArn,
        Message: body.message,
        Subject: body.subject,
      }));
      return NextResponse.json({ success: true });
    }
    if (body.action === "subscribe") {
      const res = await sns.send(new SubscribeCommand({
        TopicArn: body.topicArn,
        Protocol: body.protocol,
        Endpoint: body.endpoint,
      }));
      return NextResponse.json({ subscriptionArn: res.SubscriptionArn });
    }
    await sns.send(new CreateTopicCommand({ Name: body.name }));
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const topicArn = searchParams.get("topicArn");
    await sns.send(new DeleteTopicCommand({ TopicArn: topicArn! }));
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
