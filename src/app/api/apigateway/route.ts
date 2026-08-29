import { NextResponse } from "next/server";
import {
  GetRestApisCommand,
  CreateRestApiCommand,
  DeleteRestApiCommand,
  CreateResourceCommand,
  PutMethodCommand,
} from "@aws-sdk/client-api-gateway";
import { apigateway } from "@/lib/aws-clients";

export async function GET() {
  try {
    const res = await apigateway.send(new GetRestApisCommand({}));
    return NextResponse.json({ apis: res.items || [] });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (body.action === "createResource") {
      const res = await apigateway.send(new CreateResourceCommand({ restApiId: body.restApiId, parentId: body.parentId, pathPart: body.pathPart }));
      return NextResponse.json({ resource: res });
    }
    if (body.action === "createMethod") {
      const res = await apigateway.send(new PutMethodCommand({ restApiId: body.restApiId, resourceId: body.resourceId, httpMethod: body.httpMethod, authorizationType: body.authorizationType || "NONE" }));
      return NextResponse.json({ method: res });
    }
    // default: createApi
    const res = await apigateway.send(new CreateRestApiCommand({ name: body.name, description: body.description }));
    return NextResponse.json({ api: res });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const restApiId = searchParams.get("restApiId")!;
    await apigateway.send(new DeleteRestApiCommand({ restApiId }));
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
