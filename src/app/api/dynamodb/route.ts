import { NextResponse } from "next/server";
import { ListTablesCommand, CreateTableCommand, DeleteTableCommand, DescribeTableCommand } from "@aws-sdk/client-dynamodb";
import { dynamodb } from "@/lib/aws-clients";

export async function GET() {
  try {
    const res = await dynamodb.send(new ListTablesCommand({}));
    const tables = [];
    for (const name of res.TableNames || []) {
      const desc = await dynamodb.send(new DescribeTableCommand({ TableName: name }));
      tables.push(desc.Table);
    }
    return NextResponse.json({ tables });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    await dynamodb.send(new CreateTableCommand(body));
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tableName = searchParams.get("tableName");
    await dynamodb.send(new DeleteTableCommand({ TableName: tableName! }));
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
