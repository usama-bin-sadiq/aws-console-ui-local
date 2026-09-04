import { NextResponse } from "next/server";
import {
  ListProjectsCommand,
  BatchGetProjectsCommand,
  CreateProjectCommand,
  DeleteProjectCommand,
  StartBuildCommand,
  StopBuildCommand,
  BatchGetBuildsCommand,
  BatchGetBuildBatchesCommand,
  ListBuildsForProjectCommand,
} from "@aws-sdk/client-codebuild";
import { codebuild } from "@/lib/aws-clients";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const projectName = searchParams.get("projectName");
    const buildId = searchParams.get("buildId");

    if (action === "builds" && projectName) {
      const listRes = await codebuild.send(
        new ListBuildsForProjectCommand({ projectName })
      );
      return NextResponse.json({ builds: listRes.ids || [] });
    }

    if (action === "batchGetBuilds") {
      const idsParam = searchParams.get("ids");
      if (!idsParam) {
        return NextResponse.json({ error: "ids required" }, { status: 400 });
      }
      const ids = idsParam.split(",").map((s) => s.trim()).filter(Boolean);
      const res = await codebuild.send(new BatchGetBuildsCommand({ ids }));
      return NextResponse.json({ builds: res.builds || [] });
    }

    if (action === "batchGetBuildLogs" && buildId) {
      // Build logs are accessed via phases; return a structured note
      return NextResponse.json({
        buildLogs: [{ message: `Logs for build ${buildId}: view via CloudWatch or build phases.` }],
      });
    }

    const listRes = await codebuild.send(new ListProjectsCommand({}));
    const names = listRes.projects || [];
    if (names.length === 0) return NextResponse.json({ projects: [] });
    const detailRes = await codebuild.send(new BatchGetProjectsCommand({ names }));
    return NextResponse.json({ projects: detailRes.projects || [] });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (body.action === "startBuild") {
      const res = await codebuild.send(
        new StartBuildCommand({ projectName: body.projectName })
      );
      return NextResponse.json({ build: res.build });
    }

    if (body.action === "stopBuild") {
      const res = await codebuild.send(
        new StopBuildCommand({ id: body.buildId })
      );
      return NextResponse.json({ build: res.build });
    }

    const res = await codebuild.send(
      new CreateProjectCommand({
        name: body.name,
        source: body.source || { type: "NO_SOURCE" },
        artifacts: body.artifacts || { type: "NO_ARTIFACTS" },
        environment:
          body.environment || {
            type: "LINUX_CONTAINER",
            image: "aws/codebuild/standard:7.0",
            computeType: "BUILD_GENERAL1_SMALL",
          },
        serviceRole:
          body.serviceRole ||
          "arn:aws:iam::000000000000:role/codebuild-role",
      })
    );
    return NextResponse.json({ project: res.project });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    await codebuild.send(
      new DeleteProjectCommand({ name: searchParams.get("name")! })
    );
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
