import { NextResponse } from "next/server";
import {
  ListGraphqlApisCommand,
  CreateGraphqlApiCommand,
  DeleteGraphqlApiCommand,
} from "@aws-sdk/client-appsync";
import { appsync } from "@/lib/aws-clients";

export async function GET() {
  try {
    const res = await appsync.send(new ListGraphqlApisCommand({}));
    return NextResponse.json({ graphqlApis: res.graphqlApis || [] });
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
    const res = await appsync.send(
      new CreateGraphqlApiCommand({
        name: body.name,
        authenticationType: body.authenticationType || "API_KEY",
      })
    );
    return NextResponse.json({ api: res.graphqlApi });
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
    await appsync.send(
      new DeleteGraphqlApiCommand({ apiId: searchParams.get("apiId")! })
    );
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
