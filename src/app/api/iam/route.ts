import { NextResponse } from "next/server";
import { getAdapterStatus, handleAdapterError } from "@/lib/adapter-error-handler";
import {
  ListUsersCommand,
  ListRolesCommand,
  ListPoliciesCommand,
  CreateUserCommand,
  CreateRoleCommand,
  DeleteUserCommand,
  DeleteRoleCommand,
  GetUserCommand,
  GetRoleCommand,
  UpdateUserCommand,
  UpdateRoleCommand,
  AttachUserPolicyCommand,
  DetachUserPolicyCommand,
  AttachRolePolicyCommand,
  DetachRolePolicyCommand,
  AddUserToGroupCommand,
  RemoveUserFromGroupCommand,
  ListGroupsForUserCommand,
  ListAttachedUserPoliciesCommand,
  ListAttachedRolePoliciesCommand,
  GetPolicyCommand,
  CreatePolicyCommand,
  DeletePolicyCommand,
  ListUserPoliciesCommand,
  GetGroupCommand,
  ListGroupsCommand,
} from "@aws-sdk/client-iam";
import { iam } from "@/lib/aws-clients";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    // Default list
    if (!action) {
      const [users, roles, policies] = await Promise.all([
        iam.send(new ListUsersCommand({})),
        iam.send(new ListRolesCommand({})),
        iam.send(new ListPoliciesCommand({ Scope: "Local" })),
      ]);
      return NextResponse.json({
        users: users.Users || [],
        roles: roles.Roles || [],
        policies: policies.Policies || [],
      });
    }

    // GetUser
    if (action === "getUser") {
      const userName = searchParams.get("userName")!;
      const userRes = await iam.send(new GetUserCommand({ UserName: userName }));
      const groupsRes = await iam.send(new ListGroupsForUserCommand({ UserName: userName }));
      const policiesRes = await iam.send(new ListAttachedUserPoliciesCommand({ UserName: userName }));
      return NextResponse.json({
        user: userRes.User,
        groups: groupsRes.Groups || [],
        attachedPolicies: policiesRes.AttachedPolicies || [],
      });
    }

    // GetRole
    if (action === "getRole") {
      const roleName = searchParams.get("roleName")!;
      const roleRes = await iam.send(new GetRoleCommand({ RoleName: roleName }));
      const policiesRes = await iam.send(new ListAttachedRolePoliciesCommand({ RoleName: roleName }));
      return NextResponse.json({
        role: roleRes.Role,
        attachedPolicies: policiesRes.AttachedPolicies || [],
      });
    }

    // ListGroupsForUser
    if (action === "listGroupsForUser") {
      const userName = searchParams.get("userName")!;
      const res = await iam.send(new ListGroupsForUserCommand({ UserName: userName }));
      return NextResponse.json({ groups: res.Groups || [] });
    }

    // Get policy
    if (action === "getPolicy") {
      const arn = searchParams.get("policyArn")!;
      const res = await iam.send(new GetPolicyCommand({ PolicyArn: arn }));
      return NextResponse.json({ policy: res.Policy });
    }

    return NextResponse.json({ error: "Unknown GET action" }, { status: 400 });
  } catch (error: any) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const action = body.action;

    if (action === "createUser") {
      await iam.send(new CreateUserCommand({ UserName: body.userName, Path: body.path || "/" }));
      return NextResponse.json({ success: true });
    }

    if (action === "createRole") {
      await iam.send(new CreateRoleCommand({
        RoleName: body.roleName,
        Path: body.path || "/",
        AssumeRolePolicyDocument: body.assumeRolePolicyDocument || "{}",
        Description: body.description || "",
      }));
      return NextResponse.json({ success: true });
    }

    if (action === "updateUser") {
      await iam.send(new UpdateUserCommand({ UserName: body.userName, NewPath: body.newPath }));
      return NextResponse.json({ success: true });
    }

    if (action === "updateRole") {
      await iam.send(new UpdateRoleCommand({
        RoleName: body.roleName,
        Description: body.description,
        MaxSessionDuration: body.maxSessionDuration,
      }));
      return NextResponse.json({ success: true });
    }

    if (action === "attachUserPolicy") {
      await iam.send(new AttachUserPolicyCommand({ UserName: body.userName, PolicyArn: body.policyArn }));
      return NextResponse.json({ success: true });
    }

    if (action === "detachUserPolicy") {
      await iam.send(new DetachUserPolicyCommand({ UserName: body.userName, PolicyArn: body.policyArn }));
      return NextResponse.json({ success: true });
    }

    if (action === "attachRolePolicy") {
      await iam.send(new AttachRolePolicyCommand({ RoleName: body.roleName, PolicyArn: body.policyArn }));
      return NextResponse.json({ success: true });
    }

    if (action === "detachRolePolicy") {
      await iam.send(new DetachRolePolicyCommand({ RoleName: body.roleName, PolicyArn: body.policyArn }));
      return NextResponse.json({ success: true });
    }

    if (action === "addUserToGroup") {
      await iam.send(new AddUserToGroupCommand({ GroupName: body.groupName, UserName: body.userName }));
      return NextResponse.json({ success: true });
    }

    if (action === "removeUserFromGroup") {
      await iam.send(new RemoveUserFromGroupCommand({ GroupName: body.groupName, UserName: body.userName }));
      return NextResponse.json({ success: true });
    }

    if (action === "createPolicy") {
      await iam.send(new CreatePolicyCommand({
        PolicyName: body.policyName,
        PolicyDocument: body.policyDocument || "{}",
        Path: body.path || "/",
        Description: body.description || "",
      }));
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Unknown POST action" }, { status: 400 });
  } catch (error: any) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const name = searchParams.get("name");

    if (type === "user") {
      await iam.send(new DeleteUserCommand({ UserName: name! }));
    } else if (type === "role") {
      await iam.send(new DeleteRoleCommand({ RoleName: name! }));
    } else if (type === "policy") {
      await iam.send(new DeletePolicyCommand({ PolicyArn: name! }));
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}
