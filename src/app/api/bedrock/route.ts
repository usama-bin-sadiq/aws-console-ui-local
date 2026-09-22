import { NextResponse } from "next/server";
import { ListFoundationModelsCommand, ListCustomModelsCommand, BedrockClient } from "@aws-sdk/client-bedrock";
import { getUserClientFromRequest } from "@/lib/aws-clients";
import { requirePermission } from "@/lib/data-isolation";

export async function GET(request: Request) {
  const denied = await requirePermission(request, "GET");
  if (denied) return denied;

  try {
    const bedrockClient = getUserClientFromRequest(BedrockClient, request);
    const res = await bedrockClient.send(new ListFoundationModelsCommand({}));
    return NextResponse.json({ modelSummaries: res.modelSummaries || [] });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const denied = await requirePermission(request, "POST");
  if (denied) return denied;

  try {
    const bedrockClient = getUserClientFromRequest(BedrockClient, request);
    const res = await bedrockClient.send(new ListCustomModelsCommand({}));
    return NextResponse.json({ customModels: res.modelSummaries || [] });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
