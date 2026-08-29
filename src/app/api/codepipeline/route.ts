import { NextResponse } from "next/server";
import { ListPipelinesCommand, CreatePipelineCommand, DeletePipelineCommand, StartPipelineExecutionCommand, ListPipelineExecutionsCommand } from "@aws-sdk/client-codepipeline";
import { codepipeline } from "@/lib/aws-clients";

export async function GET() {
  try {
    const res = await codepipeline.send(new ListPipelinesCommand({}));
    return NextResponse.json({ pipelines: res.pipelines || [] });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (body.action === "startExecution") {
      const res = await codepipeline.send(new StartPipelineExecutionCommand({ name: body.name }));
      return NextResponse.json({ pipelineExecutionId: res.pipelineExecutionId });
    }
    if (body.action === "listExecutions") {
      const res = await codepipeline.send(new ListPipelineExecutionsCommand({ pipelineName: body.pipelineName }));
      return NextResponse.json({ executions: res.pipelineExecutionSummaries || [] });
    }
    const res = await codepipeline.send(new CreatePipelineCommand({ pipeline: body.pipeline }));
    return NextResponse.json({ pipeline: res.pipeline });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    await codepipeline.send(new DeletePipelineCommand({ name: searchParams.get("name")! }));
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
