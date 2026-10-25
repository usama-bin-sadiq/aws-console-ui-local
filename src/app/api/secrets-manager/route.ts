import { NextResponse } from "next/server";
import {
  ListSecretsCommand,
  CreateSecretCommand,
  DeleteSecretCommand,
  GetSecretValueCommand,
  PutSecretValueCommand,
  RotateSecretCommand,
} from "@aws-sdk/client-secrets-manager";
import { SecretsManagerClient } from "@aws-sdk/client-secrets-manager";
import { getUserClientFromRequest } from "@/lib/aws-clients";
import { requirePermission } from "@/lib/data-isolation";
import { getAdapterStatus, handleAdapterError } from "@/lib/adapter-error-handler";

export async function GET(request: Request) {
  const denied = await requirePermission(request, "GET");
  if (denied) return denied;

  try {
    const secretsManagerClient = getUserClientFromRequest(SecretsManagerClient, request);
    const res = await secretsManagerClient.send(new ListSecretsCommand({}));
    return NextResponse.json({ secrets: res.SecretList || [] });
  } catch (error: unknown) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}

export async function POST(request: Request) {
  const denied = await requirePermission(request, "POST");
  if (denied) return denied;

  try {
    const secretsManagerClient = getUserClientFromRequest(SecretsManagerClient, request);
    const body = await request.json();
    if (body.action === "getValue") {
      const res = await secretsManagerClient.send(
        new GetSecretValueCommand({ SecretId: body.secretId }),
      );
      return NextResponse.json({ secret: res });
    }
    if (body.action === "putValue") {
      await secretsManagerClient.send(
        new PutSecretValueCommand({
          SecretId: body.secretId,
          SecretString: body.secretString,
        }),
      );
      return NextResponse.json({ success: true });
    }
    if (body.action === "rotateSecret") {
      await secretsManagerClient.send(new RotateSecretCommand({ SecretId: body.secretId }));
      return NextResponse.json({ success: true });
    }
    if (body.action === "createSecret") {
      await secretsManagerClient.send(
        new CreateSecretCommand({
          Name: body.name,
          SecretString: body.secretString,
          KmsKeyId: body.kmsKeyId || undefined,
          Description: body.description || undefined,
        }),
      );
      return NextResponse.json({ success: true });
    }
    await secretsManagerClient.send(
      new CreateSecretCommand({
        Name: body.name,
        SecretString: body.secretString,
      }),
    );
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}

export async function DELETE(request: Request) {
  const denied = await requirePermission(request, "DELETE");
  if (denied) return denied;

  try {
    const secretsManagerClient = getUserClientFromRequest(SecretsManagerClient, request);
    const { searchParams } = new URL(request.url);
    const secretId = searchParams.get("secretId");
    await secretsManagerClient.send(
      new DeleteSecretCommand({
        SecretId: secretId!,
        ForceDeleteWithoutRecovery: true,
      }),
    );
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}
