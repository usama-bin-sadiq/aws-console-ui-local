import { NextResponse } from "next/server";
import {
  ListGroupsCommand,
  CreateGroupCommand,
  DeleteGroupCommand,
  GetGroupCommand,
  ListAttachedGroupPoliciesCommand,
  AttachGroupPolicyCommand,
  DetachGroupPolicyCommand,
  ListUsersCommand,
} from "@aws-sdk/client-iam";
import { IAMClient } from "@aws-sdk/client-iam";
import { getUserClientFromRequest } from "@/lib/aws-clients";
import { requirePermission } from "@/lib/data-isolation";

export async function GET(request: Request) {
  const denied = await requirePermission(request, "GET");
  if (denied) return denied;

  try {
    const iamClient = getUserClientFromRequest(IAMClient, request);
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const groupName = searchParams.get("groupName");

    if (action === "getGroup" && groupName) {
      const groupRes = await iamClient.send(new GetGroupCommand({ GroupName: groupName }));
      const policiesRes = await iamClient.send(new ListAttachedGroupPoliciesCommand({ GroupName: groupName }));
      // Fetch members
      let members: any[] = [];
      try {
        const usersRes = await iamClient.send(new ListUsersCommand({}));
        const allUsers = usersRes.Users || [];
        // Filter users whose group membership includes this group (if SDK includes Groups)
        members = allUsers.filter((u: any) => {
          const userGroups = u?.Groups || [];
          return userGroups.some((g: any) => g.GroupName === groupName);
        }).map((u: any) => ({ UserName: u.UserName, UserId: u.UserId, Arn: u.Arn }));
      } catch {}
      return NextResponse.json({
        group: {
          ...groupRes.Group,
          AttachedPolicies: policiesRes.AttachedPolicies || [],
          Users: members,
        },
      });
    }

    const res = await iamClient.send(new ListGroupsCommand({}));
    return NextResponse.json({ groups: res.Groups || [] });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const denied = await requirePermission(request, "POST");
  if (denied) return denied;

  try {
    const iamClient = getUserClientFromRequest(IAMClient, request);
    const body = await request.json();
    const action = body.action;

    if (action === "attachPolicy") {
      await iamClient.send(new AttachGroupPolicyCommand({ GroupName: body.groupName, PolicyArn: body.policyArn }));
      return NextResponse.json({ success: true });
    }

    if (action === "detachPolicy") {
      await iamClient.send(new DetachGroupPolicyCommand({ GroupName: body.groupName, PolicyArn: body.policyArn }));
      return NextResponse.json({ success: true });
    }

    // Default: create group
    const res = await iamClient.send(new CreateGroupCommand({ GroupName: body.groupName, Path: body.path || "/" }));
    return NextResponse.json({ group: res.Group });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const denied = await requirePermission(request, "DELETE");
  if (denied) return denied;

  try {
    const iamClient = getUserClientFromRequest(IAMClient, request);
    const { searchParams } = new URL(request.url);
    await iamClient.send(new DeleteGroupCommand({ GroupName: searchParams.get("groupName")! }));
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
