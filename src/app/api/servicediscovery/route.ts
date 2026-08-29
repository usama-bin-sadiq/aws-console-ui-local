import { NextResponse } from "next/server";
import {
  ListNamespacesCommand,
  CreateHttpNamespaceCommand,
  DeleteNamespaceCommand,
  CreateServiceCommand,
} from "@aws-sdk/client-servicediscovery";
import { servicediscovery } from "@/lib/aws-clients";

export async function GET() {
  try {
    const res = await servicediscovery.send(new ListNamespacesCommand({}));
    return NextResponse.json({ namespaces: res.Namespaces || [] });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (body.action === "createService") {
      const res = await servicediscovery.send(new CreateServiceCommand({ Name: body.name, NamespaceId: body.namespaceId }));
      return NextResponse.json({ service: res.Service });
    }
    const res = await servicediscovery.send(new CreateHttpNamespaceCommand({ Name: body.name }));
    return NextResponse.json({ namespace: res });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id")!;
    await servicediscovery.send(new DeleteNamespaceCommand({ Id: id }));
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
