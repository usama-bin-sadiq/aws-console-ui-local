import { NextResponse } from "next/server";
import {
  DescribeComputeEnvironmentsCommand,
  DescribeJobQueuesCommand,
  CreateComputeEnvironmentCommand,
  CreateJobQueueCommand,
  DeleteComputeEnvironmentCommand,
  DeleteJobQueueCommand,
  SubmitJobCommand,
} from "@aws-sdk/client-batch";
import { batch } from "@/lib/aws-clients";

export async function GET() {
  try {
    const [ceRes, jqRes] = await Promise.all([
      batch.send(new DescribeComputeEnvironmentsCommand({})),
      batch.send(new DescribeJobQueuesCommand({})),
    ]);
    return NextResponse.json({
      computeEnvironments: ceRes.computeEnvironments || [],
      jobQueues: jqRes.jobQueues || [],
    });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (body.action === "createJobQueue") {
      const res = await batch.send(new CreateJobQueueCommand({ jobQueueName: body.jobQueueName, priority: body.priority || 1, computeEnvironmentOrder: body.computeEnvironmentOrder || [] }));
      return NextResponse.json({ jobQueue: res.jobQueueName });
    }
    if (body.action === "submitJob") {
      const res = await batch.send(new SubmitJobCommand({ jobName: body.jobName, jobQueue: body.jobQueue, jobDefinition: body.jobDefinition }));
      return NextResponse.json({ jobId: res.jobId });
    }
    // default: createComputeEnv
    const res = await batch.send(new CreateComputeEnvironmentCommand({
      computeEnvironmentName: body.computeEnvironmentName,
      type: body.type || "MANAGED",
      computeResources: body.computeResources,
    }));
    return NextResponse.json({ computeEnvironmentArn: res.computeEnvironmentArn });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get("name")!;
    const type = searchParams.get("type");
    if (type === "queue") {
      await batch.send(new DeleteJobQueueCommand({ jobQueue: name }));
    } else {
      await batch.send(new DeleteComputeEnvironmentCommand({ computeEnvironment: name }));
    }
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
