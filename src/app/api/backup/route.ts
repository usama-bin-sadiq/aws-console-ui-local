import { NextResponse } from "next/server";
import {
  ListBackupVaultsCommand,
  CreateBackupVaultCommand,
  DeleteBackupVaultCommand,
  StartBackupJobCommand,
} from "@aws-sdk/client-backup";
import { BackupClient } from "@aws-sdk/client-backup";
import { getUserClientFromRequest } from "@/lib/aws-clients";
import { requirePermission } from "@/lib/data-isolation";

export async function GET(request: Request) {
  const denied = await requirePermission(request, "GET");
  if (denied) return denied;

  try {
    const backupClient = getUserClientFromRequest(BackupClient, request);
    const res = await backupClient.send(new ListBackupVaultsCommand({}));
    return NextResponse.json({ backupVaults: res.BackupVaultList || [] });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const denied = await requirePermission(request, "POST");
  if (denied) return denied;

  try {
    const backupClient = getUserClientFromRequest(BackupClient, request);
    const body = await request.json();
    if (body.action === "startBackupJob") {
      const res = await backupClient.send(new StartBackupJobCommand({
        BackupVaultName: body.backupVaultName,
        ResourceArn: body.resourceArn,
        IamRoleArn: body.iamRoleArn || "arn:aws:iam::000000000000:role/backup-role",
      }));
      return NextResponse.json({ jobId: res.BackupJobId });
    }
    const res = await backupClient.send(new CreateBackupVaultCommand({ BackupVaultName: body.backupVaultName }));
    return NextResponse.json({ vault: res });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const denied = await requirePermission(request, "DELETE");
  if (denied) return denied;

  try {
    const backupClient = getUserClientFromRequest(BackupClient, request);
    const { searchParams } = new URL(request.url);
    const vaultName = searchParams.get("vaultName")!;
    await backupClient.send(new DeleteBackupVaultCommand({ BackupVaultName: vaultName }));
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
