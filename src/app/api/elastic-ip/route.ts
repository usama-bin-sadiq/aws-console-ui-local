import { NextResponse } from "next/server";
import {
  DescribeAddressesCommand,
  AllocateAddressCommand,
  ReleaseAddressCommand,
  AssociateAddressCommand,
  DisassociateAddressCommand,
} from "@aws-sdk/client-ec2";
import { EC2Client } from "@aws-sdk/client-ec2";
import { getUserClientFromRequest } from "@/lib/aws-clients";
import { requirePermission } from "@/lib/data-isolation";

export async function GET(request: Request) {
  const denied = await requirePermission(request, "GET");
  if (denied) return denied;

  try {
    const ec2Client = getUserClientFromRequest(EC2Client, request);
    const res = await ec2Client.send(new DescribeAddressesCommand({}));
    return NextResponse.json({ addresses: res.Addresses || [] });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const denied = await requirePermission(request, "POST");
  if (denied) return denied;

  try {
    const ec2Client = getUserClientFromRequest(EC2Client, request);
    const body = await request.json().catch(() => ({}));
    if (body.action === "associate") {
      const res = await ec2Client.send(new AssociateAddressCommand({
        AllocationId: body.allocationId,
        InstanceId: body.instanceId,
      }));
      return NextResponse.json({ associationId: res.AssociationId });
    }
    if (body.action === "disassociate") {
      await ec2Client.send(new DisassociateAddressCommand({
        AssociationId: body.associationId,
      }));
      return NextResponse.json({ success: true });
    }
    const res = await ec2Client.send(new AllocateAddressCommand({ Domain: "vpc" }));
    return NextResponse.json({ allocationId: res.AllocationId, publicIp: res.PublicIp });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const denied = await requirePermission(request, "DELETE");
  if (denied) return denied;

  try {
    const ec2Client = getUserClientFromRequest(EC2Client, request);
    const { searchParams } = new URL(request.url);
    await ec2Client.send(new ReleaseAddressCommand({ AllocationId: searchParams.get("allocationId")! }));
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
