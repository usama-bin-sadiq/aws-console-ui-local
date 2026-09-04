import { NextResponse } from "next/server";
import {
  DescribeDBInstancesCommand,
  CreateDBInstanceCommand,
  DeleteDBInstanceCommand,
  StartDBInstanceCommand,
  StopDBInstanceCommand,
  RebootDBInstanceCommand,
  ModifyDBInstanceCommand,
  CreateDBSnapshotCommand,
  DescribeDBSnapshotsCommand,
} from "@aws-sdk/client-rds";
import { rds } from "@/lib/aws-clients";
import { getAdapterStatus, handleAdapterError } from "@/lib/adapter-error-handler";

export async function GET() {
  try {
    const res = await rds.send(new DescribeDBInstancesCommand({}));
    return NextResponse.json({ instances: res.DBInstances || [] });
  } catch (error: unknown) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (body.action === "createInstance") {
      const res = await rds.send(new CreateDBInstanceCommand({ ...body.params }));
      return NextResponse.json({ success: true, DBInstance: res.DBInstance });
    }

    if (body.action === "startInstance") {
      const res = await rds.send(new StartDBInstanceCommand({ DBInstanceIdentifier: body.dbInstanceIdentifier }));
      return NextResponse.json({ success: true, DBInstance: res.DBInstance });
    }

    if (body.action === "stopInstance") {
      const res = await rds.send(new StopDBInstanceCommand({ DBInstanceIdentifier: body.dbInstanceIdentifier }));
      return NextResponse.json({ success: true, DBInstance: res.DBInstance });
    }

    if (body.action === "rebootInstance") {
      const res = await rds.send(new RebootDBInstanceCommand({ DBInstanceIdentifier: body.dbInstanceIdentifier }));
      return NextResponse.json({ success: true, DBInstance: res.DBInstance });
    }

    if (body.action === "modifyInstance") {
      const res = await rds.send(new ModifyDBInstanceCommand({ DBInstanceIdentifier: body.dbInstanceIdentifier, ...body.params }));
      return NextResponse.json({ success: true, DBInstance: res.DBInstance });
    }

    if (body.action === "createSnapshot") {
      const res = await rds.send(new CreateDBSnapshotCommand({
        DBInstanceIdentifier: body.dbInstanceIdentifier,
        DBSnapshotIdentifier: body.snapshotIdentifier,
        Tags: body.tags,
      }));
      return NextResponse.json({ success: true, DBSnapshot: res.DBSnapshot });
    }

    if (body.action === "describeSnapshots") {
      const res = await rds.send(new DescribeDBSnapshotsCommand({
        DBInstanceIdentifier: body.dbInstanceIdentifier,
        DBSnapshotIdentifier: body.snapshotIdentifier,
      }));
      return NextResponse.json({ snapshots: res.DBSnapshots || [] });
    }

    if (body.action === "deleteInstance") {
      await rds.send(new DeleteDBInstanceCommand({
        DBInstanceIdentifier: body.dbInstanceIdentifier,
        SkipFinalSnapshot: body.skipFinalSnapshot ?? true,
        FinalDBSnapshotIdentifier: body.finalDBSnapshotIdentifier,
        DeleteAutomatedBackups: body.deleteAutomatedBackups ?? true,
      }));
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error: unknown) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dbInstanceIdentifier = searchParams.get("dbInstanceIdentifier");
    await rds.send(new DeleteDBInstanceCommand({
      DBInstanceIdentifier: dbInstanceIdentifier!,
      SkipFinalSnapshot: true,
    }));
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}
