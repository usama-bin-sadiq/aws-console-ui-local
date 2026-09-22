import { NextResponse } from "next/server";
import {
  Route53ResolverClient,
  ListResolverEndpointsCommand,
  CreateResolverEndpointCommand,
  DeleteResolverEndpointCommand,
} from "@aws-sdk/client-route53resolver";
import { getUserClientFromRequest } from "@/lib/aws-clients";
import { requirePermission } from "@/lib/data-isolation";

export async function GET(request: Request) {
  const denied = await requirePermission(request, "GET");
  if (denied) return denied;

  try {
    const route53resolverClient = getUserClientFromRequest(Route53ResolverClient, request);
    const res = await route53resolverClient.send(new ListResolverEndpointsCommand({}));
    return NextResponse.json({ endpoints: res.ResolverEndpoints || [] });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const denied = await requirePermission(request, "POST");
  if (denied) return denied;

  try {
    const route53resolverClient = getUserClientFromRequest(Route53ResolverClient, request);
    const body = await request.json();
    const res = await route53resolverClient.send(new CreateResolverEndpointCommand({ CreatorRequestId: Date.now().toString(), Direction: body.direction || "INBOUND", IpAddresses: body.ipAddresses || [], SecurityGroupIds: body.securityGroupIds || [] }));
    return NextResponse.json({ endpoint: res.ResolverEndpoint });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const denied = await requirePermission(request, "DELETE");
  if (denied) return denied;

  try {
    const route53resolverClient = getUserClientFromRequest(Route53ResolverClient, request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id")!;
    await route53resolverClient.send(new DeleteResolverEndpointCommand({ ResolverEndpointId: id }));
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
