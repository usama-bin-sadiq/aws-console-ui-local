import { NextResponse } from "next/server";
import {
  ListEmailIdentitiesCommand,
  CreateEmailIdentityCommand,
  DeleteEmailIdentityCommand,
  SendEmailCommand,
} from "@aws-sdk/client-sesv2";
import { sesv2 } from "@/lib/aws-clients";

export async function GET() {
  try {
    const res = await sesv2.send(new ListEmailIdentitiesCommand({}));
    return NextResponse.json({ identities: res.EmailIdentities || [] });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (body.action === "send") {
      await sesv2.send(new SendEmailCommand({ FromEmailAddress: body.from, Destination: body.destination, Content: body.content }));
      return NextResponse.json({ success: true });
    }
    const res = await sesv2.send(new CreateEmailIdentityCommand({ EmailIdentity: body.emailIdentity }));
    return NextResponse.json({ identity: res });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const identityName = searchParams.get("identityName")!;
    await sesv2.send(new DeleteEmailIdentityCommand({ EmailIdentity: identityName }));
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
