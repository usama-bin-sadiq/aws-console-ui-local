import { NextResponse } from "next/server";
import {
  EFSClient,
  DescribeFileSystemsCommand,
  CreateFileSystemCommand,
  DeleteFileSystemCommand,
} from "@aws-sdk/client-efs";
import { getUserClientFromRequest } from "@/lib/aws-clients";
import { requirePermission } from "@/lib/data-isolation";

export async function GET(request: Request) {
  const denied = await requirePermission(request, "GET");
  if (denied) return denied;

  try {
    const efsClient = getUserClientFromRequest(EFSClient, request);
    const res = await efsClient.send(new DescribeFileSystemsCommand({}));
    return NextResponse.json({ fileSystems: res.FileSystems || [] });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const denied = await requirePermission(request, "POST");
  if (denied) return denied;

  try {
    const efsClient = getUserClientFromRequest(EFSClient, request);
    const body = await request.json();
    const res = await efsClient.send(new CreateFileSystemCommand({
      CreationToken: body.creationToken || Date.now().toString(),
      PerformanceMode: body.performanceMode || "generalPurpose",
    }));
    return NextResponse.json({ fileSystem: res });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const denied = await requirePermission(request, "DELETE");
  if (denied) return denied;

  try {
    const efsClient = getUserClientFromRequest(EFSClient, request);
    const { searchParams } = new URL(request.url);
    const fileSystemId = searchParams.get("fileSystemId")!;
    await efsClient.send(new DeleteFileSystemCommand({ FileSystemId: fileSystemId }));
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
