import { NextResponse } from "next/server";
import {
  ListKeysCommand,
  CreateKeyCommand,
  EnableKeyCommand,
  DisableKeyCommand,
  EnableKeyRotationCommand,
  DisableKeyRotationCommand,
  GetKeyRotationStatusCommand,
  GetKeyPolicyCommand,
  ScheduleKeyDeletionCommand,
  DescribeKeyCommand,
  ListAliasesCommand,
  ListResourceTagsCommand,
  CreateAliasCommand,
  DeleteAliasCommand,
} from "@aws-sdk/client-kms";
import { KMSClient } from "@aws-sdk/client-kms";
import { getUserClientFromRequest } from "@/lib/aws-clients";
import { requirePermission } from "@/lib/data-isolation";
import { getAdapterStatus, handleAdapterError } from "@/lib/adapter-error-handler";

export async function GET(request: Request) {
  const denied = await requirePermission(request, "GET");
  if (denied) return denied;

  try {
    const kmsClient = getUserClientFromRequest(KMSClient, request);
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const keyId = searchParams.get("KeyId") || searchParams.get("keyId");

    // Rotation status and key policy are reads, so they are reachable by GET
    // with `action`, mirroring the POST verbs of the same name.
    if (action === "getRotationStatus" && keyId) {
      const res = await kmsClient.send(new GetKeyRotationStatusCommand({ KeyId: keyId }));
      return NextResponse.json({ rotationStatus: res });
    }

    if (action === "getPolicy" && keyId) {
      const res = await kmsClient.send(
        new GetKeyPolicyCommand({
          KeyId: keyId,
          PolicyName: searchParams.get("PolicyName") || searchParams.get("policyName") || "default",
        }),
      );
      return NextResponse.json({
        policy: res.Policy ?? null,
        policyName: searchParams.get("PolicyName") || "default",
      });
    }

    if (action === "getTags" && keyId) {
      const res = await kmsClient.send(new ListResourceTagsCommand({ KeyId: keyId }));
      return NextResponse.json({ tags: res.Tags || [] });
    }

    if (action) {
      return NextResponse.json(
        {
          error: `Unknown GET action: ${action}. Supported: getRotationStatus, getPolicy, getTags`,
        },
        { status: 400 },
      );
    }

    const [keysRes, aliasesRes] = await Promise.all([
      kmsClient.send(new ListKeysCommand({})),
      kmsClient.send(new ListAliasesCommand({})),
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
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}

export async function POST(request: Request) {
  const denied = await requirePermission(request, "POST");
  if (denied) return denied;

  try {
    const kmsClient = getUserClientFromRequest(KMSClient, request);
    const body = await request.json();
    const action = body.action;
    const keyId = body.KeyId || body.keyId;
    const aliasName = body.AliasName || body.aliasName;

    // CreateKeyRequest: Description, KeyUsage, KeySpec, KeyPolicy, Origin,
    // Tags, MultiRegion, BypassPolicyLockoutSafetyCheck, ...
    if (action === "createKey") {
      const res = await kmsClient.send(
        new CreateKeyCommand({
          Description: body.Description ?? body.description ?? "",
          KeyUsage: body.KeyUsage || body.keyUsage || "ENCRYPT_DECRYPT",
          KeySpec: body.KeySpec || body.keySpec || "SYMMETRIC_DEFAULT",
          Policy: body.Policy || body.policy,
          Origin: body.Origin || body.origin,
          Tags: body.Tags || body.tags || [],
        }),
      );
      return NextResponse.json({ success: true, key: res.KeyMetadata });
    }

    if (action === "enable") {
      await kmsClient.send(new EnableKeyCommand({ KeyId: keyId }));
      return NextResponse.json({ success: true });
    }

    if (action === "disable") {
      await kmsClient.send(new DisableKeyCommand({ KeyId: keyId }));
      return NextResponse.json({ success: true });
    }

    if (action === "enableRotation") {
      await kmsClient.send(new EnableKeyRotationCommand({ KeyId: keyId }));
      return NextResponse.json({ success: true });
    }

    if (action === "disableRotation") {
      await kmsClient.send(new DisableKeyRotationCommand({ KeyId: keyId }));
      return NextResponse.json({ success: true });
    }

    if (action === "getRotationStatus") {
      const res = await kmsClient.send(new GetKeyRotationStatusCommand({ KeyId: keyId }));
      return NextResponse.json({ rotationStatus: res, success: true });
    }

    if (action === "scheduleDeletion") {
      await kmsClient.send(
        new ScheduleKeyDeletionCommand({
          KeyId: keyId,
          PendingWindowInDays: body.PendingWindowInDays || body.pendingWindowInDays || 30,
        }),
      );
      return NextResponse.json({ success: true });
    }

    if (action === "describeKey") {
      const res = await kmsClient.send(new DescribeKeyCommand({ KeyId: keyId }));
      return NextResponse.json({ key: res.KeyMetadata, keyMetadata: res.KeyMetadata });
    }

    if (action === "createAlias") {
      await kmsClient.send(
        new CreateAliasCommand({
          AliasName: aliasName,
          // CreateAliasRequest names the target `TargetKeyId`; the console
          // sends `keyId`, so both are accepted.
          TargetKeyId: body.TargetKeyId || body.targetKeyId || keyId,
        }),
      );
      return NextResponse.json({ success: true });
    }

    if (action === "deleteAlias") {
      await kmsClient.send(new DeleteAliasCommand({ AliasName: aliasName }));
      return NextResponse.json({ success: true });
    }

    // GetKeyPolicyRequest: KeyId, PolicyName. Returns the key's real policy
    // document rather than a synthesised one.
    if (action === "getKeyPolicy" || action === "getPolicy") {
      const res = await kmsClient.send(
        new GetKeyPolicyCommand({
          KeyId: keyId,
          PolicyName: body.PolicyName || body.policyName || "default",
        }),
      );
      return NextResponse.json({ success: true, policy: res.Policy ?? null });
    }

    if (action === "getTags") {
      const res = await kmsClient.send(new ListResourceTagsCommand({ KeyId: keyId }));
      return NextResponse.json({ tags: res.Tags || [] });
    }

    return NextResponse.json(
      {
        error: `Unknown action: ${action ?? "(none)"}. Supported: createKey, enable, disable, enableRotation, disableRotation, getRotationStatus, scheduleDeletion, describeKey, createAlias, deleteAlias, getKeyPolicy, getTags`,
      },
      { status: 400 },
    );
  } catch (error: any) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}
