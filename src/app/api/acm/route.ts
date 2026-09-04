import { NextResponse } from "next/server";
import { ListCertificatesCommand, RequestCertificateCommand, DeleteCertificateCommand } from "@aws-sdk/client-acm";
import { acm } from "@/lib/aws-clients";

export async function GET() {
  try {
    const res = await acm.send(new ListCertificatesCommand({}));
    return NextResponse.json({ certificates: res.CertificateSummaryList || [] });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const res = await acm.send(new RequestCertificateCommand({ DomainName: body.domainName, ValidationMethod: "DNS" }));
    return NextResponse.json({ certificateArn: res.CertificateArn });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    await acm.send(new DeleteCertificateCommand({ CertificateArn: searchParams.get("arn")! }));
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
