import { NextResponse } from "next/server";
import {
  ListDomainNamesCommand,
  CreateDomainCommand,
  DeleteDomainCommand,
} from "@aws-sdk/client-opensearch";
import { opensearch } from "@/lib/aws-clients";

export async function GET() {
  try {
    const [domainRes] = await Promise.all([
      opensearch.send(new ListDomainNamesCommand({})).catch(() => ({ DomainNames: [] })),
    ]);
    const domains = (domainRes.DomainNames || []).map((d: any) => ({ DomainName: d.DomainName || "unknown" }));

    return NextResponse.json({
      domains,
      pipelines: [],
      pipelineSupport: "unavailable",
    });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (body.action === "createPipeline") {
      return NextResponse.json({ error: "OpenSearch pipeline management is not supported by the active emulator." }, { status: 501 });
    }
    const res = await opensearch.send(
      new CreateDomainCommand({ DomainName: body.domainName, EngineVersion: body.engineVersion || "OpenSearch_2.11" })
    );
    return NextResponse.json({ domain: res.DomainStatus });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const domainName = searchParams.get("domainName");
    if (domainName) {
      await opensearch.send(new DeleteDomainCommand({ DomainName: domainName }));
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: "OpenSearch pipeline management is not supported by the active emulator." }, { status: 501 });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
