import { NextResponse } from "next/server";
import {
  ListResolverEndpointsCommand,
  CreateResolverEndpointCommand,
  DeleteResolverEndpointCommand,
} from "@aws-sdk/client-route53resolver";
import { route53resolver } from "@/lib/aws-clients";

export async function GET() {
  try {
    const res = await route53resolver.send(new ListResolverEndpointsCommand({}));
    return NextResponse.json({ endpoints: res.ResolverEndpoints || [] });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const res = await route53resolver.send(new CreateResolverEndpointCommand({ CreatorRequestId: Date.now().toString(), Direction: body.direction || "INBOUND", IpAddresses: body.ipAddresses || [], SecurityGroupIds: body.securityGroupIds || [] }));
    return NextResponse.json({ endpoint: res.ResolverEndpoint });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id")!;
    await route53resolver.send(new DeleteResolverEndpointCommand({ ResolverEndpointId: id }));
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
