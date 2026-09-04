import { NextResponse } from "next/server";
import {
  ListSAMLProvidersCommand,
  CreateSAMLProviderCommand,
  DeleteSAMLProviderCommand,
} from "@aws-sdk/client-iam";
import { iam } from "@/lib/aws-clients";

export async function GET() {
  try {
    const res = await iam.send(new ListSAMLProvidersCommand({}));
    return NextResponse.json({ samlProviders: res.SAMLProviderList || [] });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const res = await iam.send(
      new CreateSAMLProviderCommand({
        Name: body.name,
        SAMLMetadataDocument:
          body.samlDoc ||
          '<md:EntityDescriptor xmlns:md="urn:oasis:names:tc:SAML:2.0:metadata"/>',
      })
    );
    return NextResponse.json({ samlProviderArn: res.SAMLProviderArn });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    await iam.send(new DeleteSAMLProviderCommand({ SAMLProviderArn: searchParams.get("arn")! }));
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
