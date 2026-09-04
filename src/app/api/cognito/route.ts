import { NextResponse } from "next/server";
import {
  ListUserPoolsCommand,
  CreateUserPoolCommand,
  DeleteUserPoolCommand,
  AdminCreateUserCommand,
  ListUsersCommand,
  ListUserPoolClientsCommand,
  CreateUserPoolClientCommand,
  UpdateUserPoolClientCommand,
  DeleteUserPoolClientCommand,
  DescribeUserPoolClientCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { cognitoIdp } from "@/lib/aws-clients";

export async function GET() {
  try {
    const res = await cognitoIdp.send(new ListUserPoolsCommand({ MaxResults: 60 }));
    return NextResponse.json({ userPools: res.UserPools || [] });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (body.action === "createUser") {
      const res = await cognitoIdp.send(new AdminCreateUserCommand({ UserPoolId: body.userPoolId, Username: body.username, TemporaryPassword: body.temporaryPassword }));
      return NextResponse.json({ user: res.User });
    }
    if (body.action === "listUsers") {
      const res = await cognitoIdp.send(new ListUsersCommand({ UserPoolId: body.userPoolId }));
      return NextResponse.json({ users: res.Users || [] });
    }
    // Client actions
    if (body.action === "listClients") {
      const res = await cognitoIdp.send(new ListUserPoolClientsCommand({ UserPoolId: body.poolId, MaxResults: 60 }));
      return NextResponse.json({ clients: res.UserPoolClients || [] });
    }
    if (body.action === "createClient") {
      const res = await cognitoIdp.send(new CreateUserPoolClientCommand({
        UserPoolId: body.poolId,
        ClientName: body.clientName,
        GenerateSecret: body.generateSecret || false,
        ExplicitAuthFlows: body.explicitAuthFlows || ["ALLOW_CUSTOM_AUTH", "ALLOW_USER_PASSWORD_AUTH", "ALLOW_REFRESH_TOKEN_AUTH", "ALLOW_USER_SRP_AUTH"],
      }));
      return NextResponse.json({ client: res.UserPoolClient });
    }
    if (body.action === "updateClient") {
      const res = await cognitoIdp.send(new UpdateUserPoolClientCommand({
        UserPoolId: body.poolId,
        ClientId: body.clientId,
        ClientName: body.clientName,
        ExplicitAuthFlows: body.explicitAuthFlows,
      }));
      return NextResponse.json({ client: res.UserPoolClient });
    }
    if (body.action === "deleteClient") {
      await cognitoIdp.send(new DeleteUserPoolClientCommand({ UserPoolId: body.poolId, ClientId: body.clientId }));
      return NextResponse.json({ success: true });
    }
    if (body.action === "describeClient") {
      const res = await cognitoIdp.send(new DescribeUserPoolClientCommand({ UserPoolId: body.poolId, ClientId: body.clientId }));
      return NextResponse.json({ client: res.UserPoolClient });
    }
    const res = await cognitoIdp.send(new CreateUserPoolCommand({ PoolName: body.poolName }));
    return NextResponse.json({ userPool: res.UserPool });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    await cognitoIdp.send(new DeleteUserPoolCommand({ UserPoolId: searchParams.get("poolId")! }));
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
