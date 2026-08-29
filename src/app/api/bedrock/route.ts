import { NextResponse } from "next/server";
import { ListFoundationModelsCommand, ListCustomModelsCommand } from "@aws-sdk/client-bedrock";
import { bedrock } from "@/lib/aws-clients";

export async function GET() {
  try {
    const res = await bedrock.send(new ListFoundationModelsCommand({}));
    return NextResponse.json({ modelSummaries: res.modelSummaries || [] });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function POST() {
  try {
    const res = await bedrock.send(new ListCustomModelsCommand({}));
    return NextResponse.json({ customModels: res.modelSummaries || [] });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
