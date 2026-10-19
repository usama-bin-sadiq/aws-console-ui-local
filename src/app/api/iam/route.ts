import { NextResponse } from "next/server";
import { getAdapterStatus, handleAdapterError } from "@/lib/adapter-error-handler";
import {
  ListUsersCommand,
  ListRolesCommand,
  ListPoliciesCommand,
  ListGroupsCommand,
  CreateUserCommand,
  CreateRoleCommand,
  CreateGroupCommand,
  DeleteUserCommand,
  DeleteRoleCommand,
  DeleteGroupCommand,
  GetUserCommand,
  GetRoleCommand,
  GetGroupCommand,
  UpdateUserCommand,
  UpdateRoleCommand,
  AttachUserPolicyCommand,
  DetachUserPolicyCommand,
  AttachRolePolicyCommand,
  DetachRolePolicyCommand,
  AttachGroupPolicyCommand,
  DetachGroupPolicyCommand,
  AddUserToGroupCommand,
  RemoveUserFromGroupCommand,
  ListGroupsForUserCommand,
  ListAttachedUserPoliciesCommand,
  ListAttachedRolePoliciesCommand,
  ListAttachedGroupPoliciesCommand,
  GetPolicyCommand,
  GetPolicyVersionCommand,
  CreatePolicyCommand,
  CreatePolicyVersionCommand,
  SimulatePrincipalPolicyCommand,
  DeletePolicyCommand,
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

    // Default list
    if (!action) {
      const [users, roles, policies, groups] = await Promise.all([
        iamClient.send(new ListUsersCommand({})),
        iamClient.send(new ListRolesCommand({})),
        iamClient.send(new ListPoliciesCommand({ Scope: "Local" })),
        iamClient.send(new ListGroupsCommand({})),
      ]);
      return NextResponse.json({
        users: users.Users || [],
        roles: roles.Roles || [],
        policies: policies.Policies || [],
        groups: groups.Groups || [],
      });
    }

    // GetUser
    if (action === "getUser") {
      const userName = searchParams.get("userName")!;
      const userRes = await iamClient.send(new GetUserCommand({ UserName: userName }));
      const groupsRes = await iamClient.send(new ListGroupsForUserCommand({ UserName: userName }));
      const policiesRes = await iamClient.send(
        new ListAttachedUserPoliciesCommand({ UserName: userName }),
      );
      return NextResponse.json({
        user: userRes.User,
        groups: groupsRes.Groups || [],
        attachedPolicies: policiesRes.AttachedPolicies || [],
      });
    }

    // GetRole
    if (action === "getRole") {
      const roleName = searchParams.get("roleName")!;
      const roleRes = await iamClient.send(new GetRoleCommand({ RoleName: roleName }));
      const policiesRes = await iamClient.send(
        new ListAttachedRolePoliciesCommand({ RoleName: roleName }),
      );
      return NextResponse.json({
        role: roleRes.Role,
        attachedPolicies: policiesRes.AttachedPolicies || [],
      });
    }

    // ListGroupsForUser
    if (action === "listGroupsForUser") {
      const userName = searchParams.get("userName")!;
      const res = await iamClient.send(new ListGroupsForUserCommand({ UserName: userName }));
      return NextResponse.json({ groups: res.Groups || [] });
    }

    // GetGroup
    if (action === "getGroup") {
      const groupName = searchParams.get("groupName")!;
      const groupRes = await iamClient.send(new GetGroupCommand({ GroupName: groupName }));
      const policiesRes = await iamClient.send(
        new ListAttachedGroupPoliciesCommand({ GroupName: groupName }),
      );
      return NextResponse.json({
        group: {
          GroupName: groupRes.Group?.GroupName,
          GroupId: groupRes.Group?.GroupId,
          Arn: groupRes.Group?.Arn,
          Path: groupRes.Group?.Path,
          CreateDate: groupRes.Group?.CreateDate,
        },
        users: groupRes.Users || [],
        attachedPolicies: policiesRes.AttachedPolicies || [],
      });
    }

    // ListAttachedGroupPolicies
    if (action === "listAttachedGroupPolicies") {
      const groupName = searchParams.get("groupName")!;
      const res = await iamClient.send(
        new ListAttachedGroupPoliciesCommand({ GroupName: groupName }),
      );
      return NextResponse.json({ attachedPolicies: res.AttachedPolicies || [] });
    }

    // GetPolicy (versioned document)
    if (action === "getPolicy") {
      const arn = searchParams.get("policyArn")!;
      const res = await iamClient.send(new GetPolicyCommand({ PolicyArn: arn }));
      const defaultVersionId = res.Policy?.DefaultVersionId;
      const version = defaultVersionId
        ? await iamClient.send(
            new GetPolicyVersionCommand({ PolicyArn: arn, VersionId: defaultVersionId }),
          )
        : undefined;
      return NextResponse.json({ policy: res.Policy, document: version?.PolicyVersion?.Document });
    }

    return NextResponse.json({ error: "Unknown GET action" }, { status: 400 });
  } catch (error: any) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}

export async function POST(request: Request) {
  const denied = await requirePermission(request, "POST");
  if (denied) return denied;

  try {
    const iamClient = getUserClientFromRequest(IAMClient, request);
    const body = await request.json();
    const action = body.action;

    if (action === "createUser") {
      await iamClient.send(
        new CreateUserCommand({ UserName: body.userName, Path: body.path || "/" }),
      );
      return NextResponse.json({ success: true });
    }

    if (action === "createRole") {
      const defaultTrustPolicy = JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Principal: { Service: "ec2.amazonaws.com" },
            Action: "sts:AssumeRole",
          },
        ],
      });
      await iamClient.send(
        new CreateRoleCommand({
          RoleName: body.roleName,
          Path: body.path || "/",
          AssumeRolePolicyDocument: body.assumeRolePolicyDocument || defaultTrustPolicy,
          Description: body.description || "",
        }),
      );
      return NextResponse.json({ success: true });
    }

    if (action === "updateUser") {
      await iamClient.send(
        new UpdateUserCommand({ UserName: body.userName, NewPath: body.newPath }),
      );
      return NextResponse.json({ success: true });
    }

    if (action === "updateRole") {
      await iamClient.send(
        new UpdateRoleCommand({
          RoleName: body.roleName,
          Description: body.description,
          MaxSessionDuration: body.maxSessionDuration,
        }),
      );
      return NextResponse.json({ success: true });
    }

    if (action === "attachUserPolicy") {
      await iamClient.send(
        new AttachUserPolicyCommand({ UserName: body.userName, PolicyArn: body.policyArn }),
      );
      return NextResponse.json({ success: true });
    }

    if (action === "detachUserPolicy") {
      await iamClient.send(
        new DetachUserPolicyCommand({ UserName: body.userName, PolicyArn: body.policyArn }),
      );
      return NextResponse.json({ success: true });
    }

    if (action === "attachRolePolicy") {
      await iamClient.send(
        new AttachRolePolicyCommand({ RoleName: body.roleName, PolicyArn: body.policyArn }),
      );
      return NextResponse.json({ success: true });
    }

    if (action === "detachRolePolicy") {
      await iamClient.send(
        new DetachRolePolicyCommand({ RoleName: body.roleName, PolicyArn: body.policyArn }),
      );
      return NextResponse.json({ success: true });
    }

    if (action === "addUserToGroup") {
      await iamClient.send(
        new AddUserToGroupCommand({ GroupName: body.groupName, UserName: body.userName }),
      );
      return NextResponse.json({ success: true });
    }

    if (action === "removeUserFromGroup") {
      await iamClient.send(
        new RemoveUserFromGroupCommand({ GroupName: body.groupName, UserName: body.userName }),
      );
      return NextResponse.json({ success: true });
    }

    if (action === "createGroup") {
      await iamClient.send(
        new CreateGroupCommand({ GroupName: body.groupName, Path: body.path || "/" }),
      );
      return NextResponse.json({ success: true });
    }

    if (action === "attachGroupPolicy") {
      await iamClient.send(
        new AttachGroupPolicyCommand({ GroupName: body.groupName, PolicyArn: body.policyArn }),
      );
      return NextResponse.json({ success: true });
    }

    if (action === "detachGroupPolicy") {
      await iamClient.send(
        new DetachGroupPolicyCommand({ GroupName: body.groupName, PolicyArn: body.policyArn }),
      );
      return NextResponse.json({ success: true });
    }

    if (action === "createPolicy") {
      await iamClient.send(
        new CreatePolicyCommand({
          PolicyName: body.policyName,
          PolicyDocument: body.policyDocument || "{}",
          Path: body.path || "/",
          Description: body.description || "",
        }),
      );
      return NextResponse.json({ success: true });
    }

    if (action === "uploadPolicyVersion") {
      if (!body.policyArn) {
        return NextResponse.json({ error: "policyArn is required" }, { status: 400 });
      }
      const res = await iamClient.send(
        new CreatePolicyVersionCommand({
          PolicyArn: body.policyArn,
          PolicyDocument: body.policyDocument || "{}",
          SetAsDefault: true,
        }),
      );
      return NextResponse.json({ success: true, versionId: res.PolicyVersion?.VersionId });
    }

    if (action === "simulatePolicy") {
      if (!body.policySourceArn) {
        return NextResponse.json({ error: "policySourceArn is required" }, { status: 400 });
      }
      if (!body.actionName) {
        return NextResponse.json({ error: "actionName is required" }, { status: 400 });
      }
      const res = await iamClient.send(
        new SimulatePrincipalPolicyCommand({
          PolicySourceArn: body.policySourceArn,
          ActionNames: [body.actionName],
          ResourceArns: body.resource ? [body.resource] : undefined,
        }),
      );
      return NextResponse.json({ success: true, evaluationResults: res.EvaluationResults || [] });
    }

    return NextResponse.json({ error: "Unknown POST action" }, { status: 400 });
  } catch (error: any) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}

export async function DELETE(request: Request) {
  const denied = await requirePermission(request, "DELETE");
  if (denied) return denied;

  try {
    const iamClient = getUserClientFromRequest(IAMClient, request);
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const name = searchParams.get("name");

    if (type === "user") {
      await iamClient.send(new DeleteUserCommand({ UserName: name! }));
    } else if (type === "role") {
      await iamClient.send(new DeleteRoleCommand({ RoleName: name! }));
    } else if (type === "policy") {
      await iamClient.send(new DeletePolicyCommand({ PolicyArn: name! }));
    } else if (type === "group") {
      await iamClient.send(new DeleteGroupCommand({ GroupName: name! }));
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}
