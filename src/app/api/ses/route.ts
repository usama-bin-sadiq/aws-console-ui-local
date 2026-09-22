import { NextResponse } from "next/server";
import {
  ListIdentitiesCommand,
  VerifyEmailIdentityCommand,
  SendEmailCommand,
  DeleteIdentityCommand,
} from "@aws-sdk/client-ses";
import { SESClient } from "@aws-sdk/client-ses";
import { getUserClientFromRequest } from "@/lib/aws-clients";
import { requirePermission } from "@/lib/data-isolation";

export async function GET(request: Request) {
  const denied = await requirePermission(request, "GET");
  if (denied) return denied;

  try {
    const sesClient = getUserClientFromRequest(SESClient, request);
    const res = await sesClient.send(new ListIdentitiesCommand({ IdentityType: "EmailAddress" }));
    return NextResponse.json({ identities: res.Identities || [] });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const denied = await requirePermission(request, "POST");
  if (denied) return denied;

  try {
    const sesClient = getUserClientFromRequest(SESClient, request);
    const body = await request.json();
    if (body.action === "send") {
      await sesClient.send(new SendEmailCommand({ Source: body.source, Destination: body.destination, Message: body.message }));
      return NextResponse.json({ success: true });
    }
    // default: verify
    await sesClient.send(new VerifyEmailIdentityCommand({ EmailAddress: body.emailAddress }));
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const denied = await requirePermission(request, "DELETE");
  if (denied) return denied;

  try {
    const sesClient = getUserClientFromRequest(SESClient, request);
    const { searchParams } = new URL(request.url);
    const identity = searchParams.get("identity")!;
    await sesClient.send(new DeleteIdentityCommand({ Identity: identity }));
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
