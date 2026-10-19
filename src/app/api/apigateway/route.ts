import { NextResponse } from "next/server";
import {
  APIGatewayClient,
  GetRestApisCommand,
  CreateRestApiCommand,
  DeleteRestApiCommand,
  CreateResourceCommand,
  PutMethodCommand,
} from "@aws-sdk/client-api-gateway";
import { getUserClientFromRequest } from "@/lib/aws-clients";
import { requirePermission } from "@/lib/data-isolation";
import { getAdapterStatus, handleAdapterError } from "@/lib/adapter-error-handler";

export async function GET(request: Request) {
  const denied = await requirePermission(request, "GET");
  if (denied) return denied;

  try {
    const apigatewayClient = getUserClientFromRequest(APIGatewayClient, request);
    const res = await apigatewayClient.send(new GetRestApisCommand({}));
    return NextResponse.json({ apis: res.items || [] });
  } catch (error) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}

export async function POST(request: Request) {
  const denied = await requirePermission(request, "POST");
  if (denied) return denied;

  try {
    const apigatewayClient = getUserClientFromRequest(APIGatewayClient, request);
    const body = await request.json();
    if (body.action === "createResource") {
      const res = await apigatewayClient.send(
        new CreateResourceCommand({
          restApiId: body.restApiId,
          parentId: body.parentId,
          pathPart: body.pathPart,
        }),
      );
      return NextResponse.json({ resource: res });
    }
    if (body.action === "createMethod") {
      const res = await apigatewayClient.send(
        new PutMethodCommand({
          restApiId: body.restApiId,
          resourceId: body.resourceId,
          httpMethod: body.httpMethod,
          authorizationType: body.authorizationType || "NONE",
        }),
      );
      return NextResponse.json({ method: res });
    }
    // default: createApi
    const res = await apigatewayClient.send(
      new CreateRestApiCommand({ name: body.name, description: body.description }),
    );
    return NextResponse.json({ api: res });
  } catch (error) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}

export async function DELETE(request: Request) {
  const denied = await requirePermission(request, "DELETE");
  if (denied) return denied;

  try {
    const apigatewayClient = getUserClientFromRequest(APIGatewayClient, request);
    const { searchParams } = new URL(request.url);
    const restApiId = searchParams.get("restApiId")!;
    await apigatewayClient.send(new DeleteRestApiCommand({ restApiId }));
    return NextResponse.json({ success: true });
  } catch (error) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}
