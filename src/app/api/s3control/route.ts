import { NextResponse } from "next/server";
import {
  ListAccessPointsCommand,
  CreateAccessPointCommand,
  DeleteAccessPointCommand,
} from "@aws-sdk/client-s3-control";
import { S3ControlClient } from "@aws-sdk/client-s3-control";
import { getUserClientFromRequest } from "@/lib/aws-clients";
import { requirePermission } from "@/lib/data-isolation";

export async function GET(request: Request) {
  const denied = await requirePermission(request, "GET");
  if (denied) return denied;

  try {
    const s3controlClient = getUserClientFromRequest(S3ControlClient, request);
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get("accountId") || "000000000000";
    const res = await s3controlClient.send(new ListAccessPointsCommand({ AccountId: accountId }));
    return NextResponse.json({ accessPoints: res.AccessPointList || [] });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const denied = await requirePermission(request, "POST");
  if (denied) return denied;

  try {
    const s3controlClient = getUserClientFromRequest(S3ControlClient, request);
    const body = await request.json();
    await s3controlClient.send(new CreateAccessPointCommand({
      AccountId: body.accountId || "000000000000",
      Name: body.name,
      Bucket: body.bucket,
    }));
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const denied = await requirePermission(request, "DELETE");
  if (denied) return denied;

  try {
    const s3controlClient = getUserClientFromRequest(S3ControlClient, request);
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get("accountId") || "000000000000";
    const name = searchParams.get("name")!;
    await s3controlClient.send(new DeleteAccessPointCommand({ AccountId: accountId, Name: name }));
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
