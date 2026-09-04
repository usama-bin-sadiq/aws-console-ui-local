import { NextResponse } from "next/server";
import {
  ListKeysCommand,
  CreateKeyCommand,
  EnableKeyCommand,
  DisableKeyCommand,
  ScheduleKeyDeletionCommand,
  DescribeKeyCommand,
  ListAliasesCommand,
  CreateAliasCommand,
  DeleteAliasCommand,
} from "@aws-sdk/client-kms";
import { kms } from "@/lib/aws-clients";

export async function GET() {
  try {
    const [keysRes, aliasesRes] = await Promise.all([
      kms.send(new ListKeysCommand({})),
      kms.send(new ListAliasesCommand({})),
    ]);
    const keys = (keysRes.Keys || []).map((k: any) => ({
      KeyId: k.KeyId,
      Arn: k.Arn,
      KeyUsage: k.KeyUsage,
      KeyState: k.KeyState,
      Description: k.Description,
      KeySpec: k.KeySpec,
      CreationDate: k.CreationDate,
    }));
    // Build alias mapping for display
    const aliasMap = new Map<string, string>();
    for (const alias of aliasesRes.Aliases || []) {
      if (alias.TargetKeyId && alias.AliasName) {
        aliasMap.set(alias.TargetKeyId, alias.AliasName);
      }
    }
    const enrichedKeys = keys.map((key: any) => ({
      ...key,
      Alias: aliasMap.get(key.KeyId) || "—",
    }));
    return NextResponse.json({ keys: enrichedKeys, aliases: aliasesRes.Aliases || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "KMS fetch failed" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const action = body.action || body;

    if (action === "createKey" || body.action === "createKey") {
      const res = await kms.send(
        new CreateKeyCommand({
          Description: body.description || "",
          KeyUsage: body.keyUsage || "ENCRYPT_DECRYPT",
          KeySpec: body.keySpec || "SYMMETRIC_DEFAULT",
          Tags: body.tags || [],
        })
      );
      return NextResponse.json({ key: res.KeyMetadata });
    }

    if (action === "enable" || body.action === "enable") {
      await kms.send(new EnableKeyCommand({ KeyId: body.keyId }));
      return NextResponse.json({ success: true });
    }

    if (action === "disable" || body.action === "disable") {
      await kms.send(new DisableKeyCommand({ KeyId: body.keyId }));
      return NextResponse.json({ success: true });
    }

    if (action === "scheduleDeletion" || body.action === "scheduleDeletion") {
      await kms.send(
        new ScheduleKeyDeletionCommand({
          KeyId: body.keyId,
          PendingWindowInDays: body.pendingWindowInDays || 30,
        })
      );
      return NextResponse.json({ success: true });
    }

    if (action === "createAlias" || body.action === "createAlias") {
      await kms.send(
        new CreateAliasCommand({
          AliasName: body.aliasName,
          TargetKeyId: body.keyId,
        })
      );
      return NextResponse.json({ success: true });
    }

    if (action === "deleteAlias" || body.action === "deleteAlias") {
      await kms.send(new DeleteAliasCommand({ AliasName: body.aliasName }));
      return NextResponse.json({ success: true });
    }

    if (action === "getPolicy" || body.action === "getPolicy") {
      const res = await kms.send(new DescribeKeyCommand({ KeyId: body.keyId }));
      return NextResponse.json({ policy: res.KeyMetadata ? { Statement: [{ Sid: "Enable IAM User Permissions", Effect: "Allow", Principal: { AWS: "*" }, Action: "kms:*", Resource: "*" }] } : null });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "KMS action failed" }, { status: 500 });
  }
}
