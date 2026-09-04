import { NextResponse } from "next/server";
import {
  ListDistributionsCommand,
  CreateDistributionCommand,
  UpdateDistributionCommand,
  DeleteDistributionCommand,
  CreateInvalidationCommand,
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
    if (body.action === "create") {
      const res = await cloudfront.send(
        new CreateDistributionCommand({ DistributionConfig: body.distributionConfig || { CallerReference: String(Date.now()), Origins: { Quantity: 1, Items: [{ Id: "origin1", DomainName: "example.com", CustomOriginConfig: { HTTPPort: 80, HTTPSPort: 443, OriginProtocolPolicy: "https-only" } }] }, DefaultCacheBehavior: { TargetOriginId: "origin1", ViewerProtocolPolicy: "redirect-to-https" }, Enabled: true, Comment: body.comment || "" } })
      );
      return NextResponse.json({ distribution: res.Distribution, action: "create" });
    }
    if (body.action === "update") {
      const res = await cloudfront.send(
        new UpdateDistributionCommand({
          DistributionConfig: body.distributionConfig,
          Id: body.id,
          IfMatch: body.etag || body.ifMatch,
        })
      );
      return NextResponse.json({ distribution: res.Distribution, action: "update" });
    }
    if (body.action === "invalidation") {
      const res = await cloudfront.send(
        new CreateInvalidationCommand({
          DistributionId: body.distributionId,
          InvalidationBatch: {
            CallerReference: body.callerReference || String(Date.now()),
            Paths: {
              Quantity: body.paths ? body.paths.length : 1,
              Items: body.paths || ["/*"],
            },
          },
        })
      );
      return NextResponse.json({ invalidation: res.Invalidation, action: "invalidation" });
    }
    return NextResponse.json({ error: "Unknown action. Supported: create, update, invalidation" }, { status: 400 });
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
    return NextResponse.json({ success: true, action: "delete" });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
