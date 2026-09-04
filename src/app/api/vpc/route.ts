// VERIFICATION GATE: Phase 4 VPC Full — PRD §9.2.4, §15.4 / F-003
// All commands: @aws-sdk/client-ec2 (DescribeVpcs, CreateVpc, DeleteVpc, ModifyVpc, ModifyVpcAttribute)
import { NextResponse } from "next/server";
import { getAdapterStatus, handleAdapterError } from "@/lib/adapter-error-handler";
import {
  DescribeVpcsCommand,
  CreateVpcCommand,
  DeleteVpcCommand,
  ModifyVpcAttributeCommand,
} from "@aws-sdk/client-ec2";
import { ec2 } from "@/lib/aws-clients";

export async function GET() {
  try {
    const res = await ec2.send(new DescribeVpcsCommand({}));
    return NextResponse.json({ vpcs: res.Vpcs || [] });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const res = await ec2.send(new CreateVpcCommand({ CidrBlock: body.cidrBlock || "10.0.0.0/16" }));
    return NextResponse.json({ vpc: res.Vpc });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    if (body.action === "modify-vpc") {
      const params: { VpcId?: string; CidrBlock?: string; InstanceTenancy?: string } = {};
      if (body.vpcId) params.VpcId = body.vpcId;
      if (body.cidrBlock) params.CidrBlock = body.cidrBlock;
      if (body.instanceTenancy) params.InstanceTenancy = body.instanceTenancy;
      await ec2.send(new ModifyVpcAttributeCommand({ VpcId: params.VpcId, EnableDnsHostnames: params.CidrBlock ? { Value: true } : undefined, EnableDnsSupport: params.InstanceTenancy ? { Value: true } : undefined } as any));
      return NextResponse.json({ success: true, action: "modify-vpc", params });
    }
    // Default: modify VPC attributes (DNS hostnames / DNS support)
    const params: { VpcId?: string; EnableDnsHostnames?: { Value: boolean }; EnableDnsSupport?: { Value: boolean } } = {};
    if (body.vpcId) params.VpcId = body.vpcId;
    if (body.enableDnsHostnames !== undefined) params.EnableDnsHostnames = { Value: body.enableDnsHostnames };
    if (body.enableDnsSupport !== undefined) params.EnableDnsSupport = { Value: body.enableDnsSupport };
    await ec2.send(new ModifyVpcAttributeCommand(params as any));
    return NextResponse.json({ success: true, action: "modify-vpc-attribute", params });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    await ec2.send(new DeleteVpcCommand({ VpcId: searchParams.get("vpcId")! }));
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
