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
import { BatchClient } from "@aws-sdk/client-batch";
import { getUserClientFromRequest } from "@/lib/aws-clients";
import { requirePermission } from "@/lib/data-isolation";

export async function GET(request: Request) {
  const denied = await requirePermission(request, "GET");
  if (denied) return denied;

  try {
    const batchClient = getUserClientFromRequest(BatchClient, request);
    const [ceRes, jqRes] = await Promise.all([
      batchClient.send(new DescribeComputeEnvironmentsCommand({})),
      batchClient.send(new DescribeJobQueuesCommand({})),
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
  const denied = await requirePermission(request, "POST");
  if (denied) return denied;

  try {
    const batchClient = getUserClientFromRequest(BatchClient, request);
    const body = await request.json();
    if (body.action === "createJobQueue") {
      const res = await batchClient.send(new CreateJobQueueCommand({ jobQueueName: body.jobQueueName, priority: body.priority || 1, computeEnvironmentOrder: body.computeEnvironmentOrder || [] }));
      return NextResponse.json({ jobQueue: res.jobQueueName });
    }
    if (body.action === "submitJob") {
      const res = await batchClient.send(new SubmitJobCommand({ jobName: body.jobName, jobQueue: body.jobQueue, jobDefinition: body.jobDefinition }));
      return NextResponse.json({ jobId: res.jobId });
    }
    // default: createComputeEnv
    const res = await batchClient.send(new CreateComputeEnvironmentCommand({
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
  const denied = await requirePermission(request, "DELETE");
  if (denied) return denied;

  try {
    const batchClient = getUserClientFromRequest(BatchClient, request);
    const { searchParams } = new URL(request.url);
    const name = searchParams.get("name")!;
    const type = searchParams.get("type");
    if (type === "queue") {
      await batchClient.send(new DeleteJobQueueCommand({ jobQueue: name }));
    } else {
      await batchClient.send(new DeleteComputeEnvironmentCommand({ computeEnvironment: name }));
    }
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
