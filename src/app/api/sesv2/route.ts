import { NextResponse } from "next/server";
import {
  ListEmailIdentitiesCommand,
  CreateEmailIdentityCommand,
  DeleteEmailIdentityCommand,
  SendEmailCommand,
} from "@aws-sdk/client-sesv2";
import { SESv2Client } from "@aws-sdk/client-sesv2";
import { getUserClientFromRequest } from "@/lib/aws-clients";
import { requirePermission } from "@/lib/data-isolation";

export async function GET(request: Request) {
  const denied = await requirePermission(request, "GET");
  if (denied) return denied;

  try {
    const sesv2Client = getUserClientFromRequest(SESv2Client, request);
    const res = await sesv2Client.send(new ListEmailIdentitiesCommand({}));
    return NextResponse.json({ identities: res.EmailIdentities || [] });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const denied = await requirePermission(request, "POST");
  if (denied) return denied;

  try {
    const sesv2Client = getUserClientFromRequest(SESv2Client, request);
    const body = await request.json();
    if (body.action === "send") {
      await sesv2Client.send(new SendEmailCommand({ FromEmailAddress: body.from, Destination: body.destination, Content: body.content }));
      return NextResponse.json({ success: true });
    }
    const res = await sesv2Client.send(new CreateEmailIdentityCommand({ EmailIdentity: body.emailIdentity }));
    return NextResponse.json({ identity: res });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const denied = await requirePermission(request, "DELETE");
  if (denied) return denied;

  try {
    const sesv2Client = getUserClientFromRequest(SESv2Client, request);
    const { searchParams } = new URL(request.url);
    const identityName = searchParams.get("identityName")!;
    await sesv2Client.send(new DeleteEmailIdentityCommand({ EmailIdentity: identityName }));
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
