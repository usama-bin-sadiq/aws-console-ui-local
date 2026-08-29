import { NextResponse } from "next/server";
import {
  ListAccessPointsCommand,
  CreateAccessPointCommand,
  DeleteAccessPointCommand,
} from "@aws-sdk/client-s3-control";
import { s3control } from "@/lib/aws-clients";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get("accountId") || "000000000000";
    const res = await s3control.send(new ListAccessPointsCommand({ AccountId: accountId }));
    return NextResponse.json({ accessPoints: res.AccessPointList || [] });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    await s3control.send(new CreateAccessPointCommand({
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
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get("accountId") || "000000000000";
    const name = searchParams.get("name")!;
    await s3control.send(new DeleteAccessPointCommand({ AccountId: accountId, Name: name }));
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
