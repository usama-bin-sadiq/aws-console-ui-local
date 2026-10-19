import { NextResponse } from "next/server";
import { getAdapterStatus, handleAdapterError } from "@/lib/adapter-error-handler";
import {
  DescribeSecurityGroupsCommand,
  CreateSecurityGroupCommand,
  DeleteSecurityGroupCommand,
  AuthorizeSecurityGroupIngressCommand,
  AuthorizeSecurityGroupEgressCommand,
  RevokeSecurityGroupIngressCommand,
  RevokeSecurityGroupEgressCommand,
} from "@aws-sdk/client-ec2";
import { EC2Client } from "@aws-sdk/client-ec2";
import { getUserClientFromRequest } from "@/lib/aws-clients";
import { requirePermission } from "@/lib/data-isolation";

export async function GET(request: Request) {
  const denied = await requirePermission(request, "GET");
  if (denied) return denied;

  try {
    const ec2Client = getUserClientFromRequest(EC2Client, request);
    const res = await ec2Client.send(new DescribeSecurityGroupsCommand({}));
    return NextResponse.json({ securityGroups: res.SecurityGroups || [] });
  } catch (error: unknown) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}

export async function POST(request: Request) {
  const denied = await requirePermission(request, "POST");
  if (denied) return denied;

  try {
    const ec2Client = getUserClientFromRequest(EC2Client, request);
    const body = await request.json();
    const action = body.action;

    if (action === "authorizeIngress") {
      const res = await ec2Client.send(
        new AuthorizeSecurityGroupIngressCommand({
          GroupId: body.groupId,
          IpPermissions: body.ipPermissions,
        }),
      );
      return NextResponse.json({ success: true, return: res.Return || true });
    }

    if (action === "authorizeEgress") {
      const res = await ec2Client.send(
        new AuthorizeSecurityGroupEgressCommand({
          GroupId: body.groupId,
          IpPermissions: body.ipPermissions,
        }),
      );
      return NextResponse.json({ success: true, return: res.Return || true });
    }

    if (action === "revokeIngress") {
      const res = await ec2Client.send(
        new RevokeSecurityGroupIngressCommand({
          GroupId: body.groupId,
          IpPermissions: body.ipPermissions,
        }),
      );
      return NextResponse.json({ success: true, return: res.Return || true });
    }

    if (action === "revokeEgress") {
      const res = await ec2Client.send(
        new RevokeSecurityGroupEgressCommand({
          GroupId: body.groupId,
          IpPermissions: body.ipPermissions,
        }),
      );
      return NextResponse.json({ success: true, return: res.Return || true });
    }

    // Default: create security group
    const res = await ec2Client.send(
      new CreateSecurityGroupCommand({
        GroupName: body.groupName,
        Description: body.description,
        VpcId: body.vpcId,
      }),
    );
    return NextResponse.json({ groupId: res.GroupId });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  const denied = await requirePermission(request, "DELETE");
  if (denied) return denied;

  try {
    const ec2Client = getUserClientFromRequest(EC2Client, request);
    const { searchParams } = new URL(request.url);
    await ec2Client.send(new DeleteSecurityGroupCommand({ GroupId: searchParams.get("groupId")! }));
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}

/*
VERIFICATION GATE CHECKLIST — Phase 3: EC2 Security Groups (Complete Lifecycle)
[✓] PRD §9.2.5 Security Group console structure verified (list + detail + rules)
[✓] PRD §15.6 Security Group Creation Workflow steps mapped (Basic, Inbound, Outbound, Tags, Review)
[✓] API route extended with AuthorizeSecurityGroupIngress / AuthorizeSecurityGroupEgress
[✓] API route extended with RevokeSecurityGroupIngress / RevokeSecurityGroupEgress
[✓] All commands use @aws-sdk/client-ec2 (no inline SDK init, uses adapter ec2 singleton)
[✓] Rules table uses SecurityGroupRule interface from src/types/ec2.ts
[✓] Add/Remove rule UI uses Cloudscape components (Table, Tabs, Select, FormField, Input, Button)
[✓] No new service routes created; detail view embedded in existing page
[✓] Build passes (verified by npm run build)
[✓] Unrelated files not modified
*/
