import { NextResponse } from "next/server";
import {
  ListIdentitiesCommand,
  VerifyEmailIdentityCommand,
  SendEmailCommand,
  DeleteIdentityCommand,
} from "@aws-sdk/client-ses";
import { ses } from "@/lib/aws-clients";

export async function GET() {
  try {
    const res = await ses.send(new ListIdentitiesCommand({ IdentityType: "EmailAddress" }));
    return NextResponse.json({ identities: res.Identities || [] });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (body.action === "send") {
      await ses.send(new SendEmailCommand({ Source: body.source, Destination: body.destination, Message: body.message }));
      return NextResponse.json({ success: true });
    }
    // default: verify
    await ses.send(new VerifyEmailIdentityCommand({ EmailAddress: body.emailAddress }));
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const identity = searchParams.get("identity")!;
    await ses.send(new DeleteIdentityCommand({ Identity: identity }));
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
