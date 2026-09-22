import { NextResponse } from "next/server";
import { ListResourcesCommand, CreateResourceCommand, DeleteResourceCommand, CloudControlClient } from "@aws-sdk/client-cloudcontrol";
import { getUserClientFromRequest } from "@/lib/aws-clients";
import { requirePermission } from "@/lib/data-isolation";

export async function GET(request: Request) {
  const denied = await requirePermission(request, "GET");
  if (denied) return denied;

  try {
    const cloudcontrolClient = getUserClientFromRequest(CloudControlClient, request);
    const { searchParams } = new URL(request.url);
    const typeName = searchParams.get("typeName") || "AWS::S3::Bucket";
    const res = await cloudcontrolClient.send(new ListResourcesCommand({ TypeName: typeName }));
    return NextResponse.json({ resources: res.ResourceDescriptions || [] });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const denied = await requirePermission(request, "POST");
  if (denied) return denied;

  try {
    const cloudcontrolClient = getUserClientFromRequest(CloudControlClient, request);
    const body = await request.json();
    const res = await cloudcontrolClient.send(new CreateResourceCommand({ TypeName: body.typeName, DesiredState: JSON.stringify(body.desiredState || {}) }));
    return NextResponse.json({ progressEvent: res.ProgressEvent });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const denied = await requirePermission(request, "DELETE");
  if (denied) return denied;

  try {
    const cloudcontrolClient = getUserClientFromRequest(CloudControlClient, request);
    const { searchParams } = new URL(request.url);
    const res = await cloudcontrolClient.send(new DeleteResourceCommand({ TypeName: searchParams.get("typeName")!, Identifier: searchParams.get("identifier")! }));
    return NextResponse.json({ progressEvent: res.ProgressEvent });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
