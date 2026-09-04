import { NextResponse } from "next/server";
import {
  ListOpenIDConnectProvidersCommand,
  CreateOpenIDConnectProviderCommand,
  DeleteOpenIDConnectProviderCommand,
} from "@aws-sdk/client-iam";
import { iam } from "@/lib/aws-clients";

export async function GET() {
  try {
    const res = await iam.send(new ListOpenIDConnectProvidersCommand({}));
    return NextResponse.json({ providers: res.OpenIDConnectProviderList || [] });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const res = await iam.send(
      new CreateOpenIDConnectProviderCommand({
        Url: body.url,
        ClientIDList: [body.clientId || "sts.amazonaws.com"],
        ThumbprintList: [body.thumbprint || "9e99a48a9960b14926bb7f3b02e22da2b0ab7280"],
      })
    );
    return NextResponse.json({ providerArn: res.OpenIDConnectProviderArn });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    await iam.send(
      new DeleteOpenIDConnectProviderCommand({
        OpenIDConnectProviderArn: searchParams.get("arn")!,
      })
    );
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
