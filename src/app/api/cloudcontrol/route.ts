import { NextResponse } from "next/server";
import { ListResourcesCommand, CreateResourceCommand, DeleteResourceCommand } from "@aws-sdk/client-cloudcontrol";
import { cloudcontrol } from "@/lib/aws-clients";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const typeName = searchParams.get("typeName") || "AWS::S3::Bucket";
    const res = await cloudcontrol.send(new ListResourcesCommand({ TypeName: typeName }));
    return NextResponse.json({ resources: res.ResourceDescriptions || [] });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const res = await cloudcontrol.send(new CreateResourceCommand({ TypeName: body.typeName, DesiredState: JSON.stringify(body.desiredState || {}) }));
    return NextResponse.json({ progressEvent: res.ProgressEvent });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const res = await cloudcontrol.send(new DeleteResourceCommand({ TypeName: searchParams.get("typeName")!, Identifier: searchParams.get("identifier")! }));
    return NextResponse.json({ progressEvent: res.ProgressEvent });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
