import { NextResponse } from "next/server";
import {
  DescribeVpcsCommand,
  CreateVpcCommand,
  DeleteVpcCommand,
  ModifyVpcAttributeCommand,
  CreateTagsCommand,
} from "@aws-sdk/client-ec2";
import { EC2Client } from "@aws-sdk/client-ec2";
import { getUserClientFromRequest } from "@/lib/aws-clients";
import { requirePermission } from "@/lib/data-isolation";

export async function GET(request: Request) {
  const denied = await requirePermission(request, "GET");
  if (denied) return denied;

  try {
    const ec2Client = getUserClientFromRequest(EC2Client, request);
    const res = await ec2Client.send(new DescribeVpcsCommand({}));
    return NextResponse.json({ vpcs: res.Vpcs || [] });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const denied = await requirePermission(request, "POST");
  if (denied) return denied;

  try {
    const ec2Client = getUserClientFromRequest(EC2Client, request);
    const body = await request.json();
    const res = await ec2Client.send(new CreateVpcCommand({
      CidrBlock: body.cidrBlock || "10.0.0.0/16",
      InstanceTenancy: body.instanceTenancy,
    }));
    if (res.Vpc?.VpcId && Array.isArray(body.tags) && body.tags.length > 0) {
      await ec2Client.send(new CreateTagsCommand({ Resources: [res.Vpc.VpcId], Tags: body.tags }));
    }
    return NextResponse.json({ vpc: res.Vpc });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const denied = await requirePermission(request, "PUT");
  if (denied) return denied;

  try {
    const ec2Client = getUserClientFromRequest(EC2Client, request);
    const body = await request.json();
    const params: { VpcId?: string; EnableDnsHostnames?: { Value: boolean }; EnableDnsSupport?: { Value: boolean } } = {};
    if (body.vpcId) params.VpcId = body.vpcId;
    if (body.enableDnsHostnames !== undefined) params.EnableDnsHostnames = { Value: body.enableDnsHostnames };
    if (body.enableDnsSupport !== undefined) params.EnableDnsSupport = { Value: body.enableDnsSupport };
    await ec2Client.send(new ModifyVpcAttributeCommand(params as any));
    return NextResponse.json({ success: true, action: "modify-vpc-attribute", params });
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
    await ec2Client.send(new DeleteVpcCommand({ VpcId: searchParams.get("vpcId")! }));
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
