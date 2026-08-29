import { NextResponse } from "next/server";
import {
  ListPipesCommand,
  CreatePipeCommand,
  DeletePipeCommand,
  StartPipeCommand,
  StopPipeCommand,
} from "@aws-sdk/client-pipes";
import { pipes } from "@/lib/aws-clients";

export async function GET() {
  try {
    const res = await pipes.send(new ListPipesCommand({}));
    return NextResponse.json({ pipes: res.Pipes || [] });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (body.action === "start") {
      await pipes.send(new StartPipeCommand({ Name: body.name }));
      return NextResponse.json({ success: true });
    }
    if (body.action === "stop") {
      await pipes.send(new StopPipeCommand({ Name: body.name }));
      return NextResponse.json({ success: true });
    }
    const res = await pipes.send(new CreatePipeCommand({
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
  try {
    const { searchParams } = new URL(request.url);
    await pipes.send(new DeletePipeCommand({ Name: searchParams.get("name")! }));
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
