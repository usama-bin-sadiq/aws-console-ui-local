import { NextResponse } from "next/server";
import {
  DescribeFileSystemsCommand,
  CreateFileSystemCommand,
  DeleteFileSystemCommand,
} from "@aws-sdk/client-efs";
import { efs } from "@/lib/aws-clients";

export async function GET() {
  try {
    const res = await efs.send(new DescribeFileSystemsCommand({}));
    return NextResponse.json({ fileSystems: res.FileSystems || [] });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const res = await efs.send(new CreateFileSystemCommand({
      CreationToken: body.creationToken || Date.now().toString(),
      PerformanceMode: body.performanceMode || "generalPurpose",
    }));
    return NextResponse.json({ fileSystem: res });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fileSystemId = searchParams.get("fileSystemId")!;
    await efs.send(new DeleteFileSystemCommand({ FileSystemId: fileSystemId }));
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
