import { NextResponse } from "next/server";
import { ListSecretsCommand, CreateSecretCommand, DeleteSecretCommand, GetSecretValueCommand, DescribeSecretCommand } from "@aws-sdk/client-secrets-manager";
import { secretsManager } from "@/lib/aws-clients";

export async function GET() {
  try {
    const res = await secretsManager.send(new ListSecretsCommand({}));
    return NextResponse.json({ secrets: res.SecretList || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (body.action === "getValue") {
      const res = await secretsManager.send(new GetSecretValueCommand({ SecretId: body.secretId }));
      return NextResponse.json({ secret: res });
    }
    await secretsManager.send(new CreateSecretCommand({
      Name: body.name,
      SecretString: body.secretString,
    }));
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const secretId = searchParams.get("secretId");
    await secretsManager.send(new DeleteSecretCommand({
      SecretId: secretId!,
      ForceDeleteWithoutRecovery: true,
    }));
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
