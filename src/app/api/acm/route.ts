import { NextResponse } from "next/server";
import { ACMClient, ListCertificatesCommand, RequestCertificateCommand, DeleteCertificateCommand } from "@aws-sdk/client-acm";
import { getUserClientFromRequest } from "@/lib/aws-clients";
import { requirePermission } from "@/lib/data-isolation";

export async function GET(request: Request) {
  const denied = await requirePermission(request, "GET");
  if (denied) return denied;

  try {
    const acmClient = getUserClientFromRequest(ACMClient, request);
    const res = await acmClient.send(new ListCertificatesCommand({}));
    return NextResponse.json({ certificates: res.CertificateSummaryList || [] });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const denied = await requirePermission(request, "POST");
  if (denied) return denied;

  try {
    const acmClient = getUserClientFromRequest(ACMClient, request);
    const body = await request.json();
    const res = await acmClient.send(new RequestCertificateCommand({ DomainName: body.domainName, ValidationMethod: "DNS" }));
    return NextResponse.json({ certificateArn: res.CertificateArn });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const denied = await requirePermission(request, "DELETE");
  if (denied) return denied;

  try {
    const acmClient = getUserClientFromRequest(ACMClient, request);
    const { searchParams } = new URL(request.url);
    await acmClient.send(new DeleteCertificateCommand({ CertificateArn: searchParams.get("arn")! }));
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
