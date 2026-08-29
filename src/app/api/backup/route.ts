import { NextResponse } from "next/server";
import {
  ListBackupVaultsCommand,
  CreateBackupVaultCommand,
  DeleteBackupVaultCommand,
  StartBackupJobCommand,
} from "@aws-sdk/client-backup";
import { backup } from "@/lib/aws-clients";

export async function GET() {
  try {
    const res = await backup.send(new ListBackupVaultsCommand({}));
    return NextResponse.json({ backupVaults: res.BackupVaultList || [] });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (body.action === "startBackupJob") {
      const res = await backup.send(new StartBackupJobCommand({
        BackupVaultName: body.backupVaultName,
        ResourceArn: body.resourceArn,
        IamRoleArn: body.iamRoleArn || "arn:aws:iam::000000000000:role/backup-role",
      }));
      return NextResponse.json({ jobId: res.BackupJobId });
    }
    const res = await backup.send(new CreateBackupVaultCommand({ BackupVaultName: body.backupVaultName }));
    return NextResponse.json({ vault: res });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const vaultName = searchParams.get("vaultName")!;
    await backup.send(new DeleteBackupVaultCommand({ BackupVaultName: vaultName }));
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
