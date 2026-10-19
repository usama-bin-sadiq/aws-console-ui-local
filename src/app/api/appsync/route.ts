import { NextResponse } from "next/server";
import {
  ListGraphqlApisCommand,
  CreateGraphqlApiCommand,
  DeleteGraphqlApiCommand,
} from "@aws-sdk/client-appsync";
import { AppSyncClient } from "@aws-sdk/client-appsync";
import { getUserClientFromRequest } from "@/lib/aws-clients";
import { requirePermission } from "@/lib/data-isolation";

export async function GET(request: Request) {
  const denied = await requirePermission(request, "GET");
  if (denied) return denied;

  try {
    const appsyncClient = getUserClientFromRequest(AppSyncClient, request);
    const res = await appsyncClient.send(new ListGraphqlApisCommand({}));
    return NextResponse.json({ graphqlApis: res.graphqlApis || [] });
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
    const appsyncClient = getUserClientFromRequest(AppSyncClient, request);
    const body = await request.json();
    const res = await appsyncClient.send(
      new CreateGraphqlApiCommand({
        name: body.name,
        authenticationType: body.authenticationType || "API_KEY",
      }),
    );
    return NextResponse.json({ api: res.graphqlApi });
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
    const appsyncClient = getUserClientFromRequest(AppSyncClient, request);
    const { searchParams } = new URL(request.url);
    await appsyncClient.send(new DeleteGraphqlApiCommand({ apiId: searchParams.get("apiId")! }));
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
