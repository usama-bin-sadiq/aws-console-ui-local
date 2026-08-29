import { NextResponse } from "next/server";
import {
  GetApisCommand,
  CreateApiCommand,
  DeleteApiCommand,
  CreateStageCommand,
} from "@aws-sdk/client-apigatewayv2";
import { apigatewayv2 } from "@/lib/aws-clients";

export async function GET() {
  try {
    const res = await apigatewayv2.send(new GetApisCommand({}));
    return NextResponse.json({ apis: res.Items || [] });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (body.action === "createStage") {
      const res = await apigatewayv2.send(new CreateStageCommand({ ApiId: body.apiId, StageName: body.stageName }));
      return NextResponse.json({ stage: res });
    }
    const res = await apigatewayv2.send(new CreateApiCommand({ Name: body.name, ProtocolType: body.protocolType || "HTTP" }));
    return NextResponse.json({ api: res });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const apiId = searchParams.get("apiId")!;
    await apigatewayv2.send(new DeleteApiCommand({ ApiId: apiId }));
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
