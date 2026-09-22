import { NextResponse } from "next/server";
import {
  CognitoIdentityProviderClient,
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
import { getUserClientFromRequest } from "@/lib/aws-clients";
import { requirePermission } from "@/lib/data-isolation";

export async function GET(request: Request) {
  const denied = await requirePermission(request, "GET");
  if (denied) return denied;

  try {
    const cognitoIdpClient = getUserClientFromRequest(CognitoIdentityProviderClient, request);
    const res = await cognitoIdpClient.send(new ListUserPoolsCommand({ MaxResults: 60 }));
    return NextResponse.json({ userPools: res.UserPools || [] });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const denied = await requirePermission(request, "POST");
  if (denied) return denied;

  try {
    const cognitoIdpClient = getUserClientFromRequest(CognitoIdentityProviderClient, request);
    const body = await request.json();
    if (body.action === "createUser") {
      const res = await cognitoIdpClient.send(new AdminCreateUserCommand({ UserPoolId: body.userPoolId, Username: body.username, TemporaryPassword: body.temporaryPassword }));
      return NextResponse.json({ user: res.User });
    }
    if (body.action === "listUsers") {
      const res = await cognitoIdpClient.send(new ListUsersCommand({ UserPoolId: body.userPoolId }));
      return NextResponse.json({ users: res.Users || [] });
    }
    // Client actions
    if (body.action === "listClients") {
      const res = await cognitoIdpClient.send(new ListUserPoolClientsCommand({ UserPoolId: body.poolId, MaxResults: 60 }));
      return NextResponse.json({ clients: res.UserPoolClients || [] });
    }
    if (body.action === "createClient") {
      const res = await cognitoIdpClient.send(new CreateUserPoolClientCommand({
        UserPoolId: body.poolId,
        ClientName: body.clientName,
        GenerateSecret: body.generateSecret || false,
        ExplicitAuthFlows: body.explicitAuthFlows || ["ALLOW_CUSTOM_AUTH", "ALLOW_USER_PASSWORD_AUTH", "ALLOW_REFRESH_TOKEN_AUTH", "ALLOW_USER_SRP_AUTH"],
      }));
      return NextResponse.json({ client: res.UserPoolClient });
    }
    if (body.action === "updateClient") {
      const res = await cognitoIdpClient.send(new UpdateUserPoolClientCommand({
        UserPoolId: body.poolId,
        ClientId: body.clientId,
        ClientName: body.clientName,
        ExplicitAuthFlows: body.explicitAuthFlows,
      }));
      return NextResponse.json({ client: res.UserPoolClient });
    }
    if (body.action === "deleteClient") {
      await cognitoIdpClient.send(new DeleteUserPoolClientCommand({ UserPoolId: body.poolId, ClientId: body.clientId }));
      return NextResponse.json({ success: true });
    }
    if (body.action === "describeClient") {
      const res = await cognitoIdpClient.send(new DescribeUserPoolClientCommand({ UserPoolId: body.poolId, ClientId: body.clientId }));
      return NextResponse.json({ client: res.UserPoolClient });
    }
    const res = await cognitoIdpClient.send(new CreateUserPoolCommand({ PoolName: body.poolName }));
    return NextResponse.json({ userPool: res.UserPool });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const denied = await requirePermission(request, "DELETE");
  if (denied) return denied;

  try {
    const cognitoIdpClient = getUserClientFromRequest(CognitoIdentityProviderClient, request);
    const { searchParams } = new URL(request.url);
    await cognitoIdpClient.send(new DeleteUserPoolCommand({ UserPoolId: searchParams.get("poolId")! }));
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
