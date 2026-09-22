import { NextResponse } from "next/server";
import {
  GetAccountPasswordPolicyCommand,
  UpdateAccountPasswordPolicyCommand,
} from "@aws-sdk/client-iam";
import { IAMClient } from "@aws-sdk/client-iam";
import { getUserClientFromRequest } from "@/lib/aws-clients";
import { requirePermission } from "@/lib/data-isolation";

export async function GET(request: Request) {
  const denied = await requirePermission(request, "GET");
  if (denied) return denied;

  try {
    const iamClient = getUserClientFromRequest(IAMClient, request);
    const res = await iamClient.send(new GetAccountPasswordPolicyCommand({}));
    return NextResponse.json({ passwordPolicy: res.PasswordPolicy });
  } catch {
    // If no policy exists, return defaults
    return NextResponse.json({
      passwordPolicy: {
        MinimumPasswordLength: 8,
        RequireUppercaseCharacters: false,
        RequireLowercaseCharacters: false,
        RequireNumbers: false,
        RequireSymbols: false,
      },
    });
  }
}

export async function POST(request: Request) {
  const denied = await requirePermission(request, "POST");
  if (denied) return denied;

  try {
    const iamClient = getUserClientFromRequest(IAMClient, request);
    const body = await request.json();
    await iamClient.send(
      new UpdateAccountPasswordPolicyCommand({
        MinimumPasswordLength: body.minLength || 8,
        RequireUppercaseCharacters: body.requireUppercase || false,
        RequireLowercaseCharacters: body.requireLowercase || false,
        RequireNumbers: body.requireNumbers || false,
        RequireSymbols: body.requireSymbols || false,
      })
    );
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
