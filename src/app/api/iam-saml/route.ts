import { NextResponse } from "next/server";
import {
  ListSAMLProvidersCommand,
  CreateSAMLProviderCommand,
  DeleteSAMLProviderCommand,
} from "@aws-sdk/client-iam";
import { IAMClient } from "@aws-sdk/client-iam";
import { getUserClientFromRequest } from "@/lib/aws-clients";
import { requirePermission } from "@/lib/data-isolation";

export async function GET(request: Request) {
  const denied = await requirePermission(request, "GET");
  if (denied) return denied;

  try {
    const iamClient = getUserClientFromRequest(IAMClient, request);
    const res = await iamClient.send(new ListSAMLProvidersCommand({}));
    return NextResponse.json({ samlProviders: res.SAMLProviderList || [] });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const denied = await requirePermission(request, "POST");
  if (denied) return denied;

  try {
    const iamClient = getUserClientFromRequest(IAMClient, request);
    const body = await request.json();
    const res = await iamClient.send(
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
  const denied = await requirePermission(request, "DELETE");
  if (denied) return denied;

  try {
    const iamClient = getUserClientFromRequest(IAMClient, request);
    const { searchParams } = new URL(request.url);
    await iamClient.send(new DeleteSAMLProviderCommand({ SAMLProviderArn: searchParams.get("arn")! }));
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
