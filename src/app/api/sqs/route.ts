/**
 * Phase 10 — SQS + SNS (Complete) Verification Gate
 * See docs/verification-gate-phase10-sqs-sns.md
 * Adapter SDK: sqs from @/lib/aws-clients (SQSClient via adapter layer)
 */
import { NextResponse } from "next/server";
import { getAdapterStatus, handleAdapterError } from "@/lib/adapter-error-handler";
import {
  ListQueuesCommand,
  CreateQueueCommand,
  DeleteQueueCommand,
  SendMessageCommand,
  SendMessageBatchCommand,
  ReceiveMessageCommand,
  PurgeQueueCommand,
  GetQueueAttributesCommand,
  DeleteMessageCommand,
} from "@aws-sdk/client-sqs";
import { sqs } from "@/lib/aws-clients";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const queueUrl = searchParams.get("queueUrl");
    if (action === "getAttributes" && queueUrl) {
      const res = await sqs.send(new GetQueueAttributesCommand({ QueueUrl: queueUrl, AttributeNames: ["All"] }));
      return NextResponse.json({ attributes: res.Attributes || {} });
    }
    const res = await sqs.send(new ListQueuesCommand({}));
    return NextResponse.json({ queues: res.QueueUrls || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (body.action === "sendBatch") {
      const entries = (body.entries || []).map((e: any) => ({
        Id: e.id || `msg-${Date.now()}-${Math.random()}`,
        MessageBody: e.messageBody || e.message || "",
        MessageAttributes: e.messageAttributes ? parseMessageAttributes(e.messageAttributes) : undefined,
      }));
      const res = await sqs.send(new SendMessageBatchCommand({ QueueUrl: body.queueUrl, Entries: entries }));
      return NextResponse.json({ success: true, batchResult: res.Successful || [], failed: res.Failed || [] });
    }
    if (body.action === "send") {
      await sqs.send(new SendMessageCommand({
        QueueUrl: body.queueUrl,
        MessageBody: body.messageBody,
        MessageAttributes: body.messageAttributes ? parseMessageAttributes(body.messageAttributes) : undefined,
      }));
      return NextResponse.json({ success: true });
    }
    if (body.action === "receive") {
      const res = await sqs.send(new ReceiveMessageCommand({
        QueueUrl: body.queueUrl,
        MaxNumberOfMessages: body.maxMessages || 10,
        WaitTimeSeconds: body.waitTime || 5,
        MessageAttributeNames: body.messageAttributeNames || ["All"],
        AttributeNames: body.attributeNames || ["All"],
      }));
      return NextResponse.json({ messages: res.Messages || [] });
    }
    if (body.action === "purge") {
      await sqs.send(new PurgeQueueCommand({ QueueUrl: body.queueUrl }));
      return NextResponse.json({ success: true });
    }
    if (body.action === "deleteMessage") {
      await sqs.send(new DeleteMessageCommand({ QueueUrl: body.queueUrl, ReceiptHandle: body.receiptHandle }));
      return NextResponse.json({ success: true });
    }
    await sqs.send(new CreateQueueCommand({ QueueName: body.queueName }));
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
  try {
    const { searchParams } = new URL(request.url);
    const queueUrl = searchParams.get("queueUrl");
    await sqs.send(new DeleteQueueCommand({ QueueUrl: queueUrl! }));
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
