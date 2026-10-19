import { NextResponse } from "next/server";
import {
  ListResourcesCommand,
  CreateResourceCommand,
  DeleteResourceCommand,
  CloudControlClient,
} from "@aws-sdk/client-cloudcontrol";
import { getUserClientFromRequest } from "@/lib/aws-clients";
import { requirePermission } from "@/lib/data-isolation";
import { getAdapterStatus, handleAdapterError } from "@/lib/adapter-error-handler";

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
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}

export async function POST(request: Request) {
  const denied = await requirePermission(request, "POST");
  if (denied) return denied;

  try {
    const cloudcontrolClient = getUserClientFromRequest(CloudControlClient, request);
    const body = await request.json();
    const res = await cloudcontrolClient.send(
      new CreateResourceCommand({
        TypeName: body.typeName,
        DesiredState: JSON.stringify(body.desiredState || {}),
      }),
    );
    return NextResponse.json({ progressEvent: res.ProgressEvent });
  } catch (error: unknown) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}

export async function DELETE(request: Request) {
  const denied = await requirePermission(request, "DELETE");
  if (denied) return denied;

  try {
    const cloudcontrolClient = getUserClientFromRequest(CloudControlClient, request);
    const { searchParams } = new URL(request.url);
    const res = await cloudcontrolClient.send(
      new DeleteResourceCommand({
        TypeName: searchParams.get("typeName")!,
        Identifier: searchParams.get("identifier")!,
      }),
    );
    return NextResponse.json({ progressEvent: res.ProgressEvent });
  } catch (error: unknown) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}
