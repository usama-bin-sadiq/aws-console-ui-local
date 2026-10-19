import { NextResponse } from "next/server";
import {
  GetApisCommand,
  CreateApiCommand,
  DeleteApiCommand,
  CreateStageCommand,
} from "@aws-sdk/client-apigatewayv2";
import { ApiGatewayV2Client } from "@aws-sdk/client-apigatewayv2";
import { getUserClientFromRequest } from "@/lib/aws-clients";
import { requirePermission } from "@/lib/data-isolation";
import { getAdapterStatus, handleAdapterError } from "@/lib/adapter-error-handler";

export async function GET(request: Request) {
  const denied = await requirePermission(request, "GET");
  if (denied) return denied;

  try {
    const apigatewayv2Client = getUserClientFromRequest(ApiGatewayV2Client, request);
    const res = await apigatewayv2Client.send(new GetApisCommand({}));
    return NextResponse.json({ apis: res.Items || [] });
  } catch (error: unknown) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}

export async function POST(request: Request) {
  const denied = await requirePermission(request, "POST");
  if (denied) return denied;

  try {
    const apigatewayv2Client = getUserClientFromRequest(ApiGatewayV2Client, request);
    const body = await request.json();
    if (body.action === "createStage") {
      const res = await apigatewayv2Client.send(
        new CreateStageCommand({ ApiId: body.apiId, StageName: body.stageName }),
      );
      return NextResponse.json({ stage: res });
    }
    const res = await apigatewayv2Client.send(
      new CreateApiCommand({ Name: body.name, ProtocolType: body.protocolType || "HTTP" }),
    );
    return NextResponse.json({ api: res });
  } catch (error: unknown) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}

export async function DELETE(request: Request) {
  const denied = await requirePermission(request, "DELETE");
  if (denied) return denied;

  try {
    const apigatewayv2Client = getUserClientFromRequest(ApiGatewayV2Client, request);
    const { searchParams } = new URL(request.url);
    const apiId = searchParams.get("apiId")!;
    await apigatewayv2Client.send(new DeleteApiCommand({ ApiId: apiId }));
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}
