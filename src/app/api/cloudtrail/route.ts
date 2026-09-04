import { NextResponse } from "next/server";
import { DescribeTrailsCommand, CreateTrailCommand, DeleteTrailCommand } from "@aws-sdk/client-cloudtrail";
import { cloudtrail } from "@/lib/aws-clients";

export async function GET() {
  try {
    const res = await cloudtrail.send(new DescribeTrailsCommand({}));
    return NextResponse.json({ trails: res.trailList || [] });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    await cloudtrail.send(new CreateTrailCommand({ Name: body.name, S3BucketName: body.s3BucketName || "cloudtrail-logs" }));
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    await cloudtrail.send(new DeleteTrailCommand({ Name: searchParams.get("name")! }));
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
