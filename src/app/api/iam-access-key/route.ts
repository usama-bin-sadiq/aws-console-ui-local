import { NextResponse } from "next/server";
import {
  ListAccessKeysCommand,
  CreateAccessKeyCommand,
  DeleteAccessKeyCommand,
  UpdateAccessKeyCommand,
} from "@aws-sdk/client-iam";
import { iam } from "@/lib/aws-clients";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userName = searchParams.get("userName");
    if (!userName) {
      return NextResponse.json({ accessKeys: [], message: "Provide ?userName= to list keys" });
    }
    const res = await iam.send(new ListAccessKeysCommand({ UserName: userName }));
    return NextResponse.json({ accessKeys: res.AccessKeyMetadata || [] });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (body.action === "deactivate") {
      await iam.send(
        new UpdateAccessKeyCommand({
          UserName: body.userName,
          AccessKeyId: body.accessKeyId,
          Status: "Inactive",
        })
      );
      return NextResponse.json({ success: true });
    }
    const res = await iam.send(new CreateAccessKeyCommand({ UserName: body.userName }));
    return NextResponse.json({ accessKey: res.AccessKey });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    await iam.send(
      new DeleteAccessKeyCommand({
        UserName: searchParams.get("userName")!,
        AccessKeyId: searchParams.get("accessKeyId")!,
      })
    );
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
