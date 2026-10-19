import { NextResponse } from "next/server";
import {
  ListDomainNamesCommand,
  CreateDomainCommand,
  DeleteDomainCommand,
} from "@aws-sdk/client-opensearch";
import { OpenSearchClient } from "@aws-sdk/client-opensearch";
import { getUserClientFromRequest } from "@/lib/aws-clients";
import { requirePermission } from "@/lib/data-isolation";
import { getAdapterStatus, handleAdapterError } from "@/lib/adapter-error-handler";

export async function GET(request: Request) {
  const denied = await requirePermission(request, "GET");
  if (denied) return denied;

  try {
    const opensearchClient = getUserClientFromRequest(OpenSearchClient, request);
    const [domainRes] = await Promise.all([
      opensearchClient.send(new ListDomainNamesCommand({})).catch(() => ({ DomainNames: [] })),
    ]);
    const domains = (domainRes.DomainNames || []).map((d: any) => ({
      DomainName: d.DomainName || "unknown",
    }));

    return NextResponse.json({
      domains,
      pipelines: [],
      pipelineSupport: "unavailable",
    });
  } catch (error) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}

export async function POST(request: Request) {
  const denied = await requirePermission(request, "POST");
  if (denied) return denied;

  try {
    const opensearchClient = getUserClientFromRequest(OpenSearchClient, request);
    const body = await request.json();
    if (body.action === "createPipeline") {
      return NextResponse.json(
        { error: "OpenSearch pipeline management is not supported by the active emulator." },
        { status: 501 },
      );
    }
    const res = await opensearchClient.send(
      new CreateDomainCommand({
        DomainName: body.domainName,
        EngineVersion: body.engineVersion || "OpenSearch_2.11",
      }),
    );
    return NextResponse.json({ domain: res.DomainStatus });
  } catch (error) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}

export async function DELETE(request: Request) {
  const denied = await requirePermission(request, "DELETE");
  if (denied) return denied;

  try {
    const opensearchClient = getUserClientFromRequest(OpenSearchClient, request);
    const { searchParams } = new URL(request.url);
    const domainName = searchParams.get("domainName");
    if (domainName) {
      await opensearchClient.send(new DeleteDomainCommand({ DomainName: domainName }));
      return NextResponse.json({ success: true });
    }
    return NextResponse.json(
      { error: "OpenSearch pipeline management is not supported by the active emulator." },
      { status: 501 },
    );
  } catch (error) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}
