/**
 * Phase 10 — SQS + SNS (Complete) Verification Gate
 * See docs/verification-gate-phase10-sqs-sns.md
 * Adapter SDK: sns from @/lib/aws-clients (SNSClient via adapter layer)
 */
import { NextResponse } from "next/server";
import { getAdapterStatus, handleAdapterError } from "@/lib/adapter-error-handler";
import {
  ListTopicsCommand,
  CreateTopicCommand,
  DeleteTopicCommand,
  SubscribeCommand,
  UnsubscribeCommand,
  PublishCommand,
  ListSubscriptionsByTopicCommand,
  GetTopicAttributesCommand,
} from "@aws-sdk/client-sns";
import { SNSClient } from "@aws-sdk/client-sns";
import { getUserClientFromRequest } from "@/lib/aws-clients";
import { requirePermission } from "@/lib/data-isolation";

export async function GET(request: Request) {
  const denied = await requirePermission(request, "GET");
  if (denied) return denied;

  try {
    const snsClient = getUserClientFromRequest(SNSClient, request);
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const topicArn = searchParams.get("topicArn");
    if (action === "listSubscriptions" && topicArn) {
      const res = await snsClient.send(new ListSubscriptionsByTopicCommand({ TopicArn: topicArn }));
      return NextResponse.json({ subscriptions: res.Subscriptions || [] });
    }
    if (action === "getAttributes" && topicArn) {
      const res = await snsClient.send(new GetTopicAttributesCommand({ TopicArn: topicArn }));
      return NextResponse.json({ attributes: res.Attributes || {} });
    }
    const res = await snsClient.send(new ListTopicsCommand({}));
    return NextResponse.json({ topics: res.Topics || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const denied = await requirePermission(request, "POST");
  if (denied) return denied;

  try {
    const snsClient = getUserClientFromRequest(SNSClient, request);
    const body = await request.json();
    if (body.action === "publish") {
      await snsClient.send(new PublishCommand({
        TopicArn: body.topicArn,
        Message: body.message,
        Subject: body.subject,
        MessageAttributes: body.messageAttributes ? parseMessageAttributes(body.messageAttributes) : undefined,
      }));
      return NextResponse.json({ success: true });
    }
    if (body.action === "subscribe") {
      const res = await snsClient.send(new SubscribeCommand({
        TopicArn: body.topicArn,
        Protocol: body.protocol,
        Endpoint: body.endpoint,
      }));
      return NextResponse.json({ subscriptionArn: res.SubscriptionArn || "pending" });
    }
    if (body.action === "unsubscribe") {
      await snsClient.send(new UnsubscribeCommand({ SubscriptionArn: body.subscriptionArn }));
      return NextResponse.json({ success: true });
    }
    if (body.action === "getAttributes") {
      const res = await snsClient.send(new GetTopicAttributesCommand({ TopicArn: body.topicArn }));
      return NextResponse.json({ attributes: res.Attributes || {} });
    }
    await snsClient.send(new CreateTopicCommand({ Name: body.name }));
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function parseMessageAttributes(raw: Record<string, any>): Record<string, any> {
  const attrs: Record<string, any> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (v && typeof v === "object" && v.DataType && v.StringValue !== undefined) {
      attrs[k] = v;
    } else if (v && typeof v === "object" && v.DataType) {
      attrs[k] = v;
    } else {
      attrs[k] = { DataType: "String", StringValue: String(v) };
    }
  }
  return attrs;
}

export async function DELETE(request: Request) {
  const denied = await requirePermission(request, "DELETE");
  if (denied) return denied;

  try {
    const snsClient = getUserClientFromRequest(SNSClient, request);
    const { searchParams } = new URL(request.url);
    const topicArn = searchParams.get("topicArn");
    const subscriptionArn = searchParams.get("subscriptionArn");
    if (subscriptionArn) {
      await snsClient.send(new UnsubscribeCommand({ SubscriptionArn: subscriptionArn }));
      return NextResponse.json({ success: true });
    }
    await snsClient.send(new DeleteTopicCommand({ TopicArn: topicArn! }));
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
