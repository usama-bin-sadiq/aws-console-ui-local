import { NextResponse } from "next/server";
import { GenerateCredentialReportCommand, GetCredentialReportCommand } from "@aws-sdk/client-iam";
import { iam } from "@/lib/aws-clients";
import { requirePermission } from "@/lib/data-isolation";
import { getAdapterStatus, handleAdapterError } from "@/lib/adapter-error-handler";

export async function POST(request: Request) {
  const denied = await requirePermission(request, "POST");
  if (denied) return denied;

  try {
    await iam.send(new GenerateCredentialReportCommand({}));
    await new Promise((r) => setTimeout(r, 1000));
    const res = await iam.send(new GetCredentialReportCommand({}));
    const report = res.Content
      ? Buffer.from(res.Content).toString("utf-8")
      : "Report generating...";
    return NextResponse.json({ report });
  } catch (error) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}
