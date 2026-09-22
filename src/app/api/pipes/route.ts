import { NextResponse } from "next/server";
import {
  ListPipesCommand,
  CreatePipeCommand,
  DeletePipeCommand,
  StartPipeCommand,
  StopPipeCommand,
} from "@aws-sdk/client-pipes";
import { PipesClient } from "@aws-sdk/client-pipes";
import { getUserClientFromRequest } from "@/lib/aws-clients";
import { requirePermission } from "@/lib/data-isolation";

export async function GET(request: Request) {
  const denied = await requirePermission(request, "GET");
  if (denied) return denied;

  try {
    const pipesClient = getUserClientFromRequest(PipesClient, request);
    const res = await pipesClient.send(new ListPipesCommand({}));
    return NextResponse.json({ pipes: res.Pipes || [] });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const denied = await requirePermission(request, "POST");
  if (denied) return denied;

  try {
    const pipesClient = getUserClientFromRequest(PipesClient, request);
    const body = await request.json();
    if (body.action === "start") {
      await pipesClient.send(new StartPipeCommand({ Name: body.name }));
      return NextResponse.json({ success: true });
    }
    if (body.action === "stop") {
      await pipesClient.send(new StopPipeCommand({ Name: body.name }));
      return NextResponse.json({ success: true });
    }
    const res = await pipesClient.send(new CreatePipeCommand({
      Name: body.name,
      Source: body.source,
      Target: body.target,
      RoleArn: body.roleArn || "arn:aws:iam::000000000000:role/pipes-role",
    }));
    return NextResponse.json({ pipe: res });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const denied = await requirePermission(request, "DELETE");
  if (denied) return denied;

  try {
    const pipesClient = getUserClientFromRequest(PipesClient, request);
    const { searchParams } = new URL(request.url);
    await pipesClient.send(new DeletePipeCommand({ Name: searchParams.get("name")! }));
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
