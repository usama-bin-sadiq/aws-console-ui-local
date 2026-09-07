import { NextResponse } from "next/server";
import {
  DescribeVpcsCommand,
  CreateVpcCommand,
  DeleteVpcCommand,
  ModifyVpcAttributeCommand,
  CreateTagsCommand,
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
    const res = await ec2.send(new CreateVpcCommand({
      CidrBlock: body.cidrBlock || "10.0.0.0/16",
      InstanceTenancy: body.instanceTenancy,
    }));
    if (res.Vpc?.VpcId && Array.isArray(body.tags) && body.tags.length > 0) {
      await ec2.send(new CreateTagsCommand({ Resources: [res.Vpc.VpcId], Tags: body.tags }));
    }
    return NextResponse.json({ vpc: res.Vpc });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
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
