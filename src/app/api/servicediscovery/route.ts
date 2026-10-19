import { NextResponse } from "next/server";
import {
  ServiceDiscoveryClient,
  ListNamespacesCommand,
  CreateHttpNamespaceCommand,
  DeleteNamespaceCommand,
  CreateServiceCommand,
} from "@aws-sdk/client-servicediscovery";
import { getUserClientFromRequest } from "@/lib/aws-clients";
import { requirePermission } from "@/lib/data-isolation";
import { getAdapterStatus, handleAdapterError } from "@/lib/adapter-error-handler";

export async function GET(request: Request) {
  const denied = await requirePermission(request, "GET");
  if (denied) return denied;

  try {
    const servicediscoveryClient = getUserClientFromRequest(ServiceDiscoveryClient, request);
    const res = await servicediscoveryClient.send(new ListNamespacesCommand({}));
    return NextResponse.json({ namespaces: res.Namespaces || [] });
  } catch (error: unknown) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}

export async function POST(request: Request) {
  const denied = await requirePermission(request, "POST");
  if (denied) return denied;

  try {
    const servicediscoveryClient = getUserClientFromRequest(ServiceDiscoveryClient, request);
    const body = await request.json();
    if (body.action === "createService") {
      const res = await servicediscoveryClient.send(
        new CreateServiceCommand({ Name: body.name, NamespaceId: body.namespaceId }),
      );
      return NextResponse.json({ service: res.Service });
    }
    const res = await servicediscoveryClient.send(
      new CreateHttpNamespaceCommand({ Name: body.name }),
    );
    return NextResponse.json({ namespace: res });
  } catch (error: unknown) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}

export async function DELETE(request: Request) {
  const denied = await requirePermission(request, "DELETE");
  if (denied) return denied;

  try {
    const servicediscoveryClient = getUserClientFromRequest(ServiceDiscoveryClient, request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id")!;
    await servicediscoveryClient.send(new DeleteNamespaceCommand({ Id: id }));
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}
