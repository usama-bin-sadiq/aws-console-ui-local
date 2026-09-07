import { NextResponse } from "next/server";
import {
  DescribeAddressesCommand,
  AllocateAddressCommand,
  ReleaseAddressCommand,
  AssociateAddressCommand,
  DisassociateAddressCommand,
} from "@aws-sdk/client-ec2";
import { ec2 } from "@/lib/aws-clients";

export async function GET() {
  try {
    const res = await ec2.send(new DescribeAddressesCommand({}));
    return NextResponse.json({ addresses: res.Addresses || [] });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    if (body.action === "associate") {
      const res = await ec2.send(new AssociateAddressCommand({
        AllocationId: body.allocationId,
        InstanceId: body.instanceId,
      }));
      return NextResponse.json({ associationId: res.AssociationId });
    }
    if (body.action === "disassociate") {
      await ec2.send(new DisassociateAddressCommand({
        AssociationId: body.associationId,
      }));
      return NextResponse.json({ success: true });
    }
    const res = await ec2.send(new AllocateAddressCommand({ Domain: "vpc" }));
    return NextResponse.json({ allocationId: res.AllocationId, publicIp: res.PublicIp });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    await ec2.send(new ReleaseAddressCommand({ AllocationId: searchParams.get("allocationId")! }));
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
