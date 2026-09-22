import { NextResponse } from "next/server";
import {
  DescribeNetworkAclsCommand,
  CreateNetworkAclCommand,
  DeleteNetworkAclCommand,
  CreateNetworkAclEntryCommand,
  DeleteNetworkAclEntryCommand,
  ReplaceNetworkAclAssociationCommand,
} from "@aws-sdk/client-ec2";
import { EC2Client } from "@aws-sdk/client-ec2";
import { getUserClientFromRequest } from "@/lib/aws-clients";
import { requirePermission } from "@/lib/data-isolation";

export async function GET(request: Request) {
  const denied = await requirePermission(request, "GET");
  if (denied) return denied;

  try {
    const ec2Client = getUserClientFromRequest(EC2Client, request);
    const res = await ec2Client.send(new DescribeNetworkAclsCommand({}));
    return NextResponse.json({ networkAcls: res.NetworkAcls || [] });
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
    if (body.action === "createEntry") {
      await ec2Client.send(new CreateNetworkAclEntryCommand({
        NetworkAclId: body.networkAclId,
        RuleNumber: body.ruleNumber,
        Protocol: body.protocol ?? -1,
        RuleAction: body.ruleAction || "allow",
        Egress: body.egress ?? false,
        CidrBlock: body.cidrBlock || "0.0.0.0/0",
        PortRange: body.fromPort !== undefined && body.toPort !== undefined
          ? { From: body.fromPort, To: body.toPort }
          : undefined,
      }));
      return NextResponse.json({ success: true });
    }
    if (body.action === "deleteEntry") {
      await ec2Client.send(new DeleteNetworkAclEntryCommand({
        NetworkAclId: body.networkAclId,
        RuleNumber: body.ruleNumber,
        Egress: body.egress ?? false,
      }));
      return NextResponse.json({ success: true });
    }
    if (body.action === "replaceAssociation") {
      const res = await ec2Client.send(new ReplaceNetworkAclAssociationCommand({
        AssociationId: body.associationId,
        NetworkAclId: body.networkAclId,
      }));
      return NextResponse.json({ newAssociationId: res.NewAssociationId });
    }
    const res = await ec2Client.send(new CreateNetworkAclCommand({ VpcId: body.vpcId }));
    return NextResponse.json({ networkAcl: res.NetworkAcl });
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
    await ec2Client.send(new DeleteNetworkAclCommand({ NetworkAclId: searchParams.get("networkAclId")! }));
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
