import { NextResponse } from "next/server";
import {
  ListProjectsCommand,
  BatchGetProjectsCommand,
  CreateProjectCommand,
  DeleteProjectCommand,
  StartBuildCommand,
  StopBuildCommand,
  BatchGetBuildsCommand,
  ListBuildsForProjectCommand,
} from "@aws-sdk/client-codebuild";
import { CodeBuildClient } from "@aws-sdk/client-codebuild";
import { getUserClientFromRequest } from "@/lib/aws-clients";
import { requirePermission } from "@/lib/data-isolation";

export async function GET(request: Request) {
  const denied = await requirePermission(request, "GET");
  if (denied) return denied;

  try {
    const codebuildClient = getUserClientFromRequest(CodeBuildClient, request);
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const projectName = searchParams.get("projectName");
    const buildId = searchParams.get("buildId");

    if (action === "builds" && projectName) {
      const listRes = await codebuildClient.send(new ListBuildsForProjectCommand({ projectName }));
      return NextResponse.json({ builds: listRes.ids || [] });
    }

    if (action === "batchGetBuilds") {
      const idsParam = searchParams.get("ids");
      if (!idsParam) {
        return NextResponse.json({ error: "ids required" }, { status: 400 });
      }
      const ids = idsParam
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const res = await codebuildClient.send(new BatchGetBuildsCommand({ ids }));
      return NextResponse.json({ builds: res.builds || [] });
    }

    if (action === "batchGetBuildLogs" && buildId) {
      // Build logs are accessed via phases; return a structured note
      return NextResponse.json({
        buildLogs: [{ message: `Logs for build ${buildId}: view via CloudWatch or build phases.` }],
      });
    }

    const listRes = await codebuildClient.send(new ListProjectsCommand({}));
    const names = listRes.projects || [];
    if (names.length === 0) return NextResponse.json({ projects: [] });
    const detailRes = await codebuildClient.send(new BatchGetProjectsCommand({ names }));
    return NextResponse.json({ projects: detailRes.projects || [] });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const denied = await requirePermission(request, "POST");
  if (denied) return denied;

  try {
    const codebuildClient = getUserClientFromRequest(CodeBuildClient, request);
    const body = await request.json();

    if (body.action === "startBuild") {
      const res = await codebuildClient.send(
        new StartBuildCommand({ projectName: body.projectName }),
      );
      return NextResponse.json({ build: res.build });
    }

    if (body.action === "stopBuild") {
      const res = await codebuildClient.send(new StopBuildCommand({ id: body.buildId }));
      return NextResponse.json({ build: res.build });
    }

    const res = await codebuildClient.send(
      new CreateProjectCommand({
        name: body.name,
        source: body.source || { type: "NO_SOURCE" },
        artifacts: body.artifacts || { type: "NO_ARTIFACTS" },
        environment: body.environment || {
          type: "LINUX_CONTAINER",
          image: "aws/codebuild/standard:7.0",
          computeType: "BUILD_GENERAL1_SMALL",
        },
        serviceRole: body.serviceRole || "arn:aws:iam::000000000000:role/codebuild-role",
      }),
    );
    return NextResponse.json({ project: res.project });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  const denied = await requirePermission(request, "DELETE");
  if (denied) return denied;

  try {
    const codebuildClient = getUserClientFromRequest(CodeBuildClient, request);
    const { searchParams } = new URL(request.url);
    await codebuildClient.send(new DeleteProjectCommand({ name: searchParams.get("name")! }));
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
