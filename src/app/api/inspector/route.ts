import { NextResponse } from "next/server";
import { inspector2 } from "@/lib/aws-clients";
import { ListFindingsCommand } from "@aws-sdk/client-inspector2";

export async function GET() {
  try {
    const res = await inspector2.send(new ListFindingsCommand({}));
    return NextResponse.json({ findings: res.findings || [] });
  } catch (error: unknown) {
    return NextResponse.json({ findings: [], message: error instanceof Error ? error.message : "Inspector not enabled" });
  }
}
