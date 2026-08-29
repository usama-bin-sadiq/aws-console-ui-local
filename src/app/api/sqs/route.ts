import { NextResponse } from "next/server";
import { ListQueuesCommand, CreateQueueCommand, DeleteQueueCommand, SendMessageCommand, ReceiveMessageCommand, PurgeQueueCommand } from "@aws-sdk/client-sqs";
import { sqs } from "@/lib/aws-clients";

export async function GET() {
  try {
    const res = await sqs.send(new ListQueuesCommand({}));
    return NextResponse.json({ queues: res.QueueUrls || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (body.action === "send") {
      await sqs.send(new SendMessageCommand({
        QueueUrl: body.queueUrl,
        MessageBody: body.messageBody,
      }));
      return NextResponse.json({ success: true });
    }
    if (body.action === "receive") {
      const res = await sqs.send(new ReceiveMessageCommand({
        QueueUrl: body.queueUrl,
        MaxNumberOfMessages: body.maxMessages || 10,
        WaitTimeSeconds: body.waitTime || 5,
      }));
      return NextResponse.json({ messages: res.Messages || [] });
    }
    if (body.action === "purge") {
      await sqs.send(new PurgeQueueCommand({ QueueUrl: body.queueUrl }));
      return NextResponse.json({ success: true });
    }
    await sqs.send(new CreateQueueCommand({ QueueName: body.queueName }));
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
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
