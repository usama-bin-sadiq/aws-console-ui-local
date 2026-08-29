import { NextResponse } from "next/server";
import { DescribeParametersCommand, PutParameterCommand, GetParameterCommand, DeleteParameterCommand } from "@aws-sdk/client-ssm";
import { ssm } from "@/lib/aws-clients";

export async function GET() {
  try {
    const res = await ssm.send(new DescribeParametersCommand({}));
    return NextResponse.json({ parameters: res.Parameters || [] });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (body.action === "get") {
      const res = await ssm.send(new GetParameterCommand({ Name: body.name, WithDecryption: body.withDecryption || false }));
      return NextResponse.json({ parameter: res.Parameter });
    }
    await ssm.send(new PutParameterCommand({ Name: body.name, Value: body.value, Type: body.type || "String", Overwrite: true }));
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    await ssm.send(new DeleteParameterCommand({ Name: searchParams.get("name")! }));
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
