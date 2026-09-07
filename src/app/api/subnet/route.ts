// VERIFICATION GATE: Phase 4 VPC Full — Subnet CRUD + ModifySubnetAttribute
// Commands: @aws-sdk/client-ec2 (DescribeSubnets, CreateSubnet, DeleteSubnet, ModifySubnetAttribute)
import { NextResponse } from "next/server";
import {
  DescribeSubnetsCommand,
  CreateSubnetCommand,
  DeleteSubnetCommand,
  ModifySubnetAttributeCommand,
} from "@aws-sdk/client-ec2";
import { ec2 } from "@/lib/aws-clients";

export async function GET() {
  try {
    const res = await ec2.send(new DescribeSubnetsCommand({}));
    return NextResponse.json({ subnets: res.Subnets || [] });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const res = await ec2.send(new CreateSubnetCommand({
      VpcId: body.vpcId,
      CidrBlock: body.cidrBlock,
      AvailabilityZone: body.availabilityZone || undefined,
    }));
    return NextResponse.json({ subnet: res.Subnet });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const params: { SubnetId?: string; MapPublicIpOnLaunch?: { Value: boolean }; AssignIpv6AddressOnCreation?: { Value: boolean } } = {};
    if (body.subnetId) params.SubnetId = body.subnetId;
    if (body.mapPublicIpOnLaunch !== undefined) params.MapPublicIpOnLaunch = { Value: body.mapPublicIpOnLaunch };
    if (body.assignIpv6AddressOnCreation !== undefined) params.AssignIpv6AddressOnCreation = { Value: body.assignIpv6AddressOnCreation };
    await ec2.send(new ModifySubnetAttributeCommand(params as any));
    return NextResponse.json({ success: true, action: "modify-subnet-attribute", params });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    await ec2.send(new DeleteSubnetCommand({ SubnetId: searchParams.get("subnetId")! }));
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
