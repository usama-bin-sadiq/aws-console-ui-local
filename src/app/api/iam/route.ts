import { NextResponse } from "next/server";
import { ListUsersCommand, ListRolesCommand, ListPoliciesCommand, CreateUserCommand, CreateRoleCommand, DeleteUserCommand, DeleteRoleCommand } from "@aws-sdk/client-iam";
import { iam } from "@/lib/aws-clients";

export async function GET() {
  try {
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
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (body.action === "createUser") {
      await iam.send(new CreateUserCommand({ UserName: body.userName }));
      return NextResponse.json({ success: true });
    }
    if (body.action === "createRole") {
      await iam.send(new CreateRoleCommand({
        RoleName: body.roleName,
        AssumeRolePolicyDocument: body.assumeRolePolicyDocument || "{}",
      }));
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
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
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
