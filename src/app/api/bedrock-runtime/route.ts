import { NextResponse } from "next/server";
import { InvokeModelCommand, BedrockRuntimeClient } from "@aws-sdk/client-bedrock-runtime";
import { getUserClientFromRequest } from "@/lib/aws-clients";
import { requirePermission } from "@/lib/data-isolation";

export async function POST(request: Request) {
  const denied = await requirePermission(request, "POST");
  if (denied) return denied;

  try {
    const bedrockRuntimeClient = getUserClientFromRequest(BedrockRuntimeClient, request);
    const body = await request.json();
    const res = await bedrockRuntimeClient.send(new InvokeModelCommand({
      modelId: body.modelId,
      body: Buffer.from(JSON.stringify(body.body || {})),
      contentType: body.contentType || "application/json",
    }));
    const decoded = res.body ? new TextDecoder().decode(res.body) : "";
    return NextResponse.json({ response: decoded });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
