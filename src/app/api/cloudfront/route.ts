import { NextResponse } from "next/server";
import {
  ListDistributionsCommand,
  CreateDistributionCommand,
  UpdateDistributionCommand,
  DeleteDistributionCommand,
  CreateInvalidationCommand,
} from "@aws-sdk/client-cloudfront";
import { CloudFrontClient } from "@aws-sdk/client-cloudfront";
import { getUserClientFromRequest } from "@/lib/aws-clients";
import { requirePermission } from "@/lib/data-isolation";
import { getAdapterStatus, handleAdapterError } from "@/lib/adapter-error-handler";

export async function GET(request: Request) {
  const denied = await requirePermission(request, "GET");
  if (denied) return denied;

  try {
    const cloudfrontClient = getUserClientFromRequest(CloudFrontClient, request);
    const res = await cloudfrontClient.send(new ListDistributionsCommand({}));
    const distributions = res.DistributionList?.Items || [];
    return NextResponse.json({ distributions });
  } catch (error: unknown) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}

export async function POST(request: Request) {
  const denied = await requirePermission(request, "POST");
  if (denied) return denied;

  try {
    const cloudfrontClient = getUserClientFromRequest(CloudFrontClient, request);
    const body = await request.json();
    if (body.action === "create") {
      const res = await cloudfrontClient.send(
        new CreateDistributionCommand({
          DistributionConfig: body.distributionConfig || {
            CallerReference: String(Date.now()),
            Origins: {
              Quantity: 1,
              Items: [
                {
                  Id: "origin1",
                  DomainName: "example.com",
                  CustomOriginConfig: {
                    HTTPPort: 80,
                    HTTPSPort: 443,
                    OriginProtocolPolicy: "https-only",
                  },
                },
              ],
            },
            DefaultCacheBehavior: {
              TargetOriginId: "origin1",
              ViewerProtocolPolicy: "redirect-to-https",
            },
            Enabled: true,
            Comment: body.comment || "",
          },
        }),
      );
      return NextResponse.json({ distribution: res.Distribution, action: "create" });
    }
    if (body.action === "update") {
      const res = await cloudfrontClient.send(
        new UpdateDistributionCommand({
          DistributionConfig: body.distributionConfig,
          Id: body.id,
          IfMatch: body.etag || body.ifMatch,
        }),
      );
      return NextResponse.json({ distribution: res.Distribution, action: "update" });
    }
    if (body.action === "invalidation") {
      const res = await cloudfrontClient.send(
        new CreateInvalidationCommand({
          DistributionId: body.distributionId,
          InvalidationBatch: {
            CallerReference: body.callerReference || String(Date.now()),
            Paths: {
              Quantity: body.paths ? body.paths.length : 1,
              Items: body.paths || ["/*"],
            },
          },
        }),
      );
      return NextResponse.json({ invalidation: res.Invalidation, action: "invalidation" });
    }
    return NextResponse.json(
      { error: "Unknown action. Supported: create, update, invalidation" },
      { status: 400 },
    );
  } catch (error: unknown) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}

export async function DELETE(request: Request) {
  const denied = await requirePermission(request, "DELETE");
  if (denied) return denied;

  try {
    const cloudfrontClient = getUserClientFromRequest(CloudFrontClient, request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id")!;
    const etag = searchParams.get("etag")!;
    await cloudfrontClient.send(new DeleteDistributionCommand({ Id: id, IfMatch: etag }));
    return NextResponse.json({ success: true, action: "delete" });
  } catch (error: unknown) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}
