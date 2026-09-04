import { NextResponse } from "next/server";
import {
  ListSecretsCommand,
  CreateSecretCommand,
  DeleteSecretCommand,
  GetSecretValueCommand,
  DescribeSecretCommand,
  PutSecretValueCommand,
  RotateSecretCommand,
} from "@aws-sdk/client-secrets-manager";
import { secretsManager } from "@/lib/aws-clients";

export async function GET() {
  try {
    const res = await secretsManager.send(new ListSecretsCommand({}));
    return NextResponse.json({ secrets: res.SecretList || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Secrets Manager fetch failed" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (body.action === "getValue") {
      const res = await secretsManager.send(new GetSecretValueCommand({ SecretId: body.secretId }));
      return NextResponse.json({ secret: res });
    }
    if (body.action === "putValue") {
      await secretsManager.send(new PutSecretValueCommand({
        SecretId: body.secretId,
        SecretString: body.secretString,
      }));
      return NextResponse.json({ success: true });
    }
    if (body.action === "rotateSecret") {
      await secretsManager.send(new RotateSecretCommand({ SecretId: body.secretId }));
      return NextResponse.json({ success: true });
    }
    if (body.action === "createSecret") {
      await secretsManager.send(new CreateSecretCommand({
        Name: body.name,
        SecretString: body.secretString,
        KmsKeyId: body.kmsKeyId || undefined,
        Description: body.description || undefined,
      }));
      return NextResponse.json({ success: true });
    }
    await secretsManager.send(new CreateSecretCommand({
      Name: body.name,
      SecretString: body.secretString,
    }));
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Secrets Manager action failed" }, { status: 500 });
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
    return NextResponse.json({ error: error.message || "Secrets Manager delete failed" }, { status: 500 });
  }
}
