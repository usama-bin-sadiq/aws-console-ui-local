import { NextResponse } from "next/server";
import { DescribeDBInstancesCommand, CreateDBInstanceCommand, DeleteDBInstanceCommand } from "@aws-sdk/client-rds";
import { rds } from "@/lib/aws-clients";

export async function GET() {
  try {
    const res = await rds.send(new DescribeDBInstancesCommand({}));
    return NextResponse.json({ instances: res.DBInstances || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    await rds.send(new CreateDBInstanceCommand(body));
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
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
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
