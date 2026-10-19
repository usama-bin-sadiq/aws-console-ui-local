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
import { SQSClient } from "@aws-sdk/client-sqs";
import { getUserClientFromRequest } from "@/lib/aws-clients";
import { requirePermission } from "@/lib/data-isolation";

export async function GET(request: Request) {
  const denied = await requirePermission(request, "GET");
  if (denied) return denied;

  try {
    const sqsClient = getUserClientFromRequest(SQSClient, request);
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const queueUrl = searchParams.get("QueueUrl") || searchParams.get("queueUrl");
    if (action === "getAttributes" && queueUrl) {
      const res = await sqsClient.send(
        new GetQueueAttributesCommand({ QueueUrl: queueUrl, AttributeNames: ["All"] }),
      );
      return NextResponse.json({ attributes: res.Attributes || {} });
    }
    const res = await sqsClient.send(new ListQueuesCommand({}));
    return NextResponse.json({ queues: res.QueueUrls || [] });
  } catch (error: any) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}

export async function POST(request: Request) {
  const denied = await requirePermission(request, "POST");
  if (denied) return denied;

  try {
    const sqsClient = getUserClientFromRequest(SQSClient, request);
    const body = await request.json();
    if (body.action === "sendBatch") {
      const entries = (body.Entries || body.entries || []).map((e: any) => ({
        Id: e.Id || e.id || `msg-${Date.now()}-${Math.random()}`,
        MessageBody: e.MessageBody || e.messageBody || e.message || "",
        MessageAttributes:
          e.MessageAttributes || e.messageAttributes
            ? parseMessageAttributes(e.MessageAttributes || e.messageAttributes)
            : undefined,
        MessageDeduplicationId: e.MessageDeduplicationId,
        MessageGroupId: e.MessageGroupId,
      }));
      const res = await sqsClient.send(
        new SendMessageBatchCommand({ QueueUrl: body.QueueUrl || body.queueUrl, Entries: entries }),
      );
      return NextResponse.json({
        success: true,
        batchResult: res.Successful || [],
        failed: res.Failed || [],
      });
    }
    if (body.action === "send") {
      await sqsClient.send(
        new SendMessageCommand({
          QueueUrl: body.QueueUrl || body.queueUrl,
          MessageBody: body.MessageBody ?? body.messageBody,
          DelaySeconds: body.DelaySeconds,
          MessageAttributes:
            body.MessageAttributes || body.messageAttributes
              ? parseMessageAttributes(body.MessageAttributes || body.messageAttributes)
              : undefined,
          MessageDeduplicationId: body.MessageDeduplicationId,
          MessageGroupId: body.MessageGroupId,
        }),
      );
      return NextResponse.json({ success: true });
    }
    if (body.action === "receive") {
      const res = await sqsClient.send(
        new ReceiveMessageCommand({
          QueueUrl: body.QueueUrl || body.queueUrl,
          MaxNumberOfMessages: body.MaxNumberOfMessages || body.maxMessages || 10,
          WaitTimeSeconds: body.WaitTimeSeconds ?? body.waitTime ?? 5,
          MessageAttributeNames: body.MessageAttributeNames ||
            body.messageAttributeNames || ["All"],
          AttributeNames: body.AttributeNames || body.attributeNames || ["All"],
        }),
      );
      return NextResponse.json({ messages: res.Messages || [] });
    }
    if (body.action === "purge") {
      await sqsClient.send(new PurgeQueueCommand({ QueueUrl: body.QueueUrl || body.queueUrl }));
      return NextResponse.json({ success: true });
    }
    if (body.action === "deleteMessage") {
      await sqsClient.send(
        new DeleteMessageCommand({
          QueueUrl: body.QueueUrl || body.queueUrl,
          ReceiptHandle: body.ReceiptHandle || body.receiptHandle,
        }),
      );
      return NextResponse.json({ success: true });
    }

    // ─── CreateQueue ───────────────────────────────────────────────────────────
    // CreateQueueRequest (SQS API reference): QueueName, Attributes, tags.
    // The documented `QueueName` is accepted alongside the console's
    // `queueName`; Attributes/tags are forwarded rather than dropped.
    const queueName = body.QueueName ?? body.queueName;
    if (!queueName) {
      return NextResponse.json(
        { error: "QueueName is required to create a queue" },
        { status: 400 },
      );
    }
    const res = await sqsClient.send(
      new CreateQueueCommand({
        QueueName: queueName,
        Attributes: body.Attributes || body.attributes,
        tags: body.tags,
      }),
    );
    return NextResponse.json({
      success: true,
      queueUrl: res.QueueUrl,
      queue: { QueueUrl: res.QueueUrl },
    });
  } catch (error: any) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
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
    const sqsClient = getUserClientFromRequest(SQSClient, request);
    const { searchParams } = new URL(request.url);
    const queueUrl = searchParams.get("QueueUrl") || searchParams.get("queueUrl");
    await sqsClient.send(new DeleteQueueCommand({ QueueUrl: queueUrl! }));
    return NextResponse.json({ success: true });
  } catch (error: any) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}
