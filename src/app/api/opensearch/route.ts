import { NextResponse } from "next/server";
import { ListDomainNamesCommand, CreateDomainCommand, DeleteDomainCommand } from "@aws-sdk/client-opensearch";
import { opensearch } from "@/lib/aws-clients";

export async function GET() {
  try {
    const res = await opensearch.send(new ListDomainNamesCommand({}));
    return NextResponse.json({ domainNames: res.DomainNames || [] });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const res = await opensearch.send(new CreateDomainCommand({ DomainName: body.domainName, EngineVersion: body.engineVersion || "OpenSearch_2.11" }));
    return NextResponse.json({ domain: res.DomainStatus });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    await opensearch.send(new DeleteDomainCommand({ DomainName: searchParams.get("domainName")! }));
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
