import { NextResponse } from "next/server";
import { ListKeysCommand, CreateKeyCommand, EnableKeyCommand, DisableKeyCommand, DescribeKeyCommand, ListAliasesCommand } from "@aws-sdk/client-kms";
import { kms } from "@/lib/aws-clients";

export async function GET() {
  try {
    const [keys, aliases] = await Promise.all([
      kms.send(new ListKeysCommand({})),
      kms.send(new ListAliasesCommand({})),
    ]);
    return NextResponse.json({ keys: keys.Keys || [], aliases: aliases.Aliases || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (body.action === "enable") {
      await kms.send(new EnableKeyCommand({ KeyId: body.keyId }));
      return NextResponse.json({ success: true });
    }
    if (body.action === "disable") {
      await kms.send(new DisableKeyCommand({ KeyId: body.keyId }));
      return NextResponse.json({ success: true });
    }
    const res = await kms.send(new CreateKeyCommand({ Description: body.description }));
    return NextResponse.json({ key: res.KeyMetadata });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
