import { NextResponse } from "next/server";
import { InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { bedrockRuntime } from "@/lib/aws-clients";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const res = await bedrockRuntime.send(new InvokeModelCommand({
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
