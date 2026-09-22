import { NextResponse } from "next/server";
import { ListPipelinesCommand, CreatePipelineCommand, DeletePipelineCommand, StartPipelineExecutionCommand, ListPipelineExecutionsCommand, CodePipelineClient } from "@aws-sdk/client-codepipeline";
import { getUserClientFromRequest } from "@/lib/aws-clients";
import { requirePermission } from "@/lib/data-isolation";

export async function GET(request: Request) {
  const denied = await requirePermission(request, "GET");
  if (denied) return denied;

  try {
    const codepipelineClient = getUserClientFromRequest(CodePipelineClient, request);
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const pipelineName = searchParams.get("pipelineName");

    if (action === "listExecutions" && pipelineName) {
      const res = await codepipelineClient.send(
        new ListPipelineExecutionsCommand({ pipelineName })
      );
      return NextResponse.json({ executions: res.pipelineExecutionSummaries || [] });
    }

    const res = await codepipelineClient.send(new ListPipelinesCommand({}));
    return NextResponse.json({ pipelines: res.pipelines || [] });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const denied = await requirePermission(request, "POST");
  if (denied) return denied;

  try {
    const codepipelineClient = getUserClientFromRequest(CodePipelineClient, request);
    const body = await request.json();
    if (body.action === "startExecution") {
      const res = await codepipelineClient.send(new StartPipelineExecutionCommand({ name: body.name }));
      return NextResponse.json({ pipelineExecutionId: res.pipelineExecutionId });
    }
    if (body.action === "listExecutions") {
      const res = await codepipelineClient.send(new ListPipelineExecutionsCommand({ pipelineName: body.pipelineName }));
      return NextResponse.json({ executions: res.pipelineExecutionSummaries || [] });
    }
    const res = await codepipelineClient.send(new CreatePipelineCommand({ pipeline: body.pipeline }));
    return NextResponse.json({ pipeline: res.pipeline });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const denied = await requirePermission(request, "DELETE");
  if (denied) return denied;

  try {
    const codepipelineClient = getUserClientFromRequest(CodePipelineClient, request);
    const { searchParams } = new URL(request.url);
    await codepipelineClient.send(new DeletePipelineCommand({ name: searchParams.get("name")! }));
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
