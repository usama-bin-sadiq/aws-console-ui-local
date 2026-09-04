import { NextResponse } from "next/server";
import {
  ListDomainNamesCommand,
  CreateDomainCommand,
  DeleteDomainCommand,
} from "@aws-sdk/client-opensearch";
import { opensearch } from "@/lib/aws-clients";
import { createAdapter } from "@/lib/localstack-adapter";

const adapter = createAdapter({ adapterMode: "localstack", serviceName: "opensearch" });

export async function GET() {
  try {
    const [domainRes] = await Promise.all([
      opensearch.send(new ListDomainNamesCommand({})).catch(() => ({ DomainNames: [] })),
    ]);
    const domains = (domainRes.DomainNames || []).map((d: any) => ({ DomainName: d.DomainName || "unknown" }));

    // Adapter SDK pipeline mock — uses adapter middleware (endpoint/auth mapped)
    const pipelines = adapter.adapterActive ? [
      { PipelineName: "os-pipeline-1", PipelineStatus: "HEALTHY", Description: "Default ingestion pipeline" },
    ] : [];

    return NextResponse.json({
      domains,
      pipelines,
    });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (body.action === "createPipeline") {
      // Adapter SDK middleware applied — endpoint/auth injected automatically
      const mappedReq = adapter.mapRequest({
        protocol: "https",
        hostname: adapter.endpoint.hostname,
        port: adapter.endpoint.port,
        path: "/_opensearch/pipeline",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pipelineName: body.pipelineName, description: body.description }),
        method: "POST",
      }, adapter.adapterMode?.mode || "localstack");
      return NextResponse.json({
        pipelineName: body.pipelineName,
        pipelineStatus: "HEALTHY",
        adapterMapped: mappedReq.url,
      });
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
    return NextResponse.json({ success: true, deletedPipeline: searchParams.get("pipelineName") || null });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
