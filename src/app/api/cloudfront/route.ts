import { NextResponse } from "next/server";
import {
  ListDistributionsCommand,
  CreateDistributionCommand,
  DeleteDistributionCommand,
} from "@aws-sdk/client-cloudfront";
import { cloudfront } from "@/lib/aws-clients";

export async function GET() {
  try {
    const res = await cloudfront.send(new ListDistributionsCommand({}));
    const distributions = res.DistributionList?.Items || [];
    return NextResponse.json({ distributions });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const res = await cloudfront.send(new CreateDistributionCommand({ DistributionConfig: body.distributionConfig }));
    return NextResponse.json({ distribution: res.Distribution });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id")!;
    const etag = searchParams.get("etag")!;
    await cloudfront.send(new DeleteDistributionCommand({ Id: id, IfMatch: etag }));
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
