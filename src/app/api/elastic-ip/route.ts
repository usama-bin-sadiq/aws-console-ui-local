import { NextResponse } from "next/server";
import { DescribeAddressesCommand, AllocateAddressCommand, ReleaseAddressCommand } from "@aws-sdk/client-ec2";
import { ec2 } from "@/lib/aws-clients";

export async function GET() {
  try {
    const res = await ec2.send(new DescribeAddressesCommand({}));
    return NextResponse.json({ addresses: res.Addresses || [] });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function POST() {
  try {
    const res = await ec2.send(new AllocateAddressCommand({ Domain: "vpc" }));
    return NextResponse.json({ allocationId: res.AllocationId });
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
