import { NextResponse } from "next/server";
import { GenerateCredentialReportCommand, GetCredentialReportCommand } from "@aws-sdk/client-iam";
import { iam } from "@/lib/aws-clients";

export async function POST() {
  try {
    await iam.send(new GenerateCredentialReportCommand({}));
    await new Promise((r) => setTimeout(r, 1000));
    const res = await iam.send(new GetCredentialReportCommand({}));
    const report = res.Content
      ? Buffer.from(res.Content).toString("utf-8")
      : "Report generating...";
    return NextResponse.json({ report });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
