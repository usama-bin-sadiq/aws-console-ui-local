import { NextResponse } from "next/server";
import {
  Route53ResolverClient,
  ListResolverEndpointsCommand,
  CreateResolverEndpointCommand,
  DeleteResolverEndpointCommand,
} from "@aws-sdk/client-route53resolver";
import { getUserClientFromRequest } from "@/lib/aws-clients";
import { requirePermission } from "@/lib/data-isolation";
import { getAdapterStatus, handleAdapterError } from "@/lib/adapter-error-handler";
import { validateIpAddresses } from "./endpoint-ip-validation";

export async function GET(request: Request) {
  const denied = await requirePermission(request, "GET");
  if (denied) return denied;

  try {
    const route53resolverClient = getUserClientFromRequest(Route53ResolverClient, request);
    const res = await route53resolverClient.send(new ListResolverEndpointsCommand({}));
    return NextResponse.json({ endpoints: res.ResolverEndpoints || [] });
  } catch (error: unknown) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}

export async function POST(request: Request) {
  const denied = await requirePermission(request, "POST");
  if (denied) return denied;

  try {
    const route53resolverClient = getUserClientFromRequest(Route53ResolverClient, request);
    const body = await request.json();
    const action = body.action;

    if (action && action !== "createEndpoint" && action !== "createResolverEndpoint") {
      return NextResponse.json(
        { error: `Unknown action: ${action}. Supported: createEndpoint` },
        { status: 400 },
      );
    }

    // CreateResolverEndpointRequest (Route 53 Resolver API reference):
    // CreatorRequestId, Name, Direction, IpAddresses, SecurityGroupIds, Tags.
    // The documented `Name` is accepted alongside the console's `name`.
    const name = body.Name ?? body.name;
    const ipAddresses = body.IpAddresses ?? body.ipAddresses;
    const securityGroupIds = body.SecurityGroupIds ?? body.securityGroupIds;

    // Each entry is an IpAddressRequest. The emulator indexes `SubnetId` and
    // parses `Ip` without guarding either, so a malformed entry escapes as an
    // exception and reaches the caller as a degraded-adapter 5xx that blames the
    // emulator for input the caller got wrong. Settling the shape here keeps that
    // a 400 that names the entry; the rules live beside this route's tests.
    const rejected = validateIpAddresses(ipAddresses);
    if (rejected) {
      return NextResponse.json(rejected, { status: 400 });
    }

    const res = await route53resolverClient.send(
      new CreateResolverEndpointCommand({
        CreatorRequestId: body.CreatorRequestId || body.creatorRequestId || Date.now().toString(),
        Name: name,
        Direction: body.Direction || body.direction || "INBOUND",
        IpAddresses: ipAddresses,
        SecurityGroupIds: securityGroupIds || [],
        Tags: body.Tags || body.tags,
      }),
    );
    return NextResponse.json({ success: true, endpoint: res.ResolverEndpoint });
  } catch (error: unknown) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}

export async function DELETE(request: Request) {
  const denied = await requirePermission(request, "DELETE");
  if (denied) return denied;

  try {
    const route53resolverClient = getUserClientFromRequest(Route53ResolverClient, request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("ResolverEndpointId") || searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "ResolverEndpointId is required" }, { status: 400 });
    }
    await route53resolverClient.send(new DeleteResolverEndpointCommand({ ResolverEndpointId: id }));
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}
