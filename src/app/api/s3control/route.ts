import { NextResponse } from "next/server";
import {
  ListAccessPointsCommand,
  CreateAccessPointCommand,
  DeleteAccessPointCommand,
  GetPublicAccessBlockCommand,
  PutPublicAccessBlockCommand,
} from "@aws-sdk/client-s3-control";
import { S3ControlClient } from "@aws-sdk/client-s3-control";
import { getUserClientFromRequest } from "@/lib/aws-clients";
import { requirePermission } from "@/lib/data-isolation";
import { getAdapterStatus, handleAdapterError } from "@/lib/adapter-error-handler";

/** Placeholder account id, matching what the emulator expects. */
const DEFAULT_ACCOUNT_ID = "000000000000";

export async function GET(request: Request) {
  const denied = await requirePermission(request, "GET");
  if (denied) return denied;

  try {
    const s3controlClient = getUserClientFromRequest(S3ControlClient, request);
    const { searchParams } = new URL(request.url);
    const accountId =
      searchParams.get("AccountId") || searchParams.get("accountId") || DEFAULT_ACCOUNT_ID;
    const action = searchParams.get("action");

    // GetPublicAccessBlockRequest: AccountId
    if (action === "getPublicAccessBlock") {
      const res = await s3controlClient.send(
        new GetPublicAccessBlockCommand({ AccountId: accountId }),
      );
      return NextResponse.json({
        publicAccessBlockConfiguration: res.PublicAccessBlockConfiguration,
      });
    }

    if (action) {
      return NextResponse.json(
        {
          error: `Unknown GET action: ${action}. Supported: getPublicAccessBlock (or omit it to list access points)`,
        },
        { status: 400 },
      );
    }

    // ListAccessPointsRequest: AccountId, Bucket, MaxResults, NextToken, ...
    const res = await s3controlClient.send(
      new ListAccessPointsCommand({
        AccountId: accountId,
        Bucket: searchParams.get("Bucket") || searchParams.get("bucket") || undefined,
      }),
    );
    return NextResponse.json({ accessPoints: res.AccessPointList || [] });
  } catch (error: unknown) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}

export async function POST(request: Request) {
  const denied = await requirePermission(request, "POST");
  if (denied) return denied;

  try {
    const s3controlClient = getUserClientFromRequest(S3ControlClient, request);
    const body = await request.json();
    const action = body.action;
    const accountId = body.AccountId || body.accountId || DEFAULT_ACCOUNT_ID;

    if (action === "putPublicAccessBlock") {
      const config =
        body.PublicAccessBlockConfiguration || body.publicAccessBlockConfiguration || body.config;
      if (!config) {
        return NextResponse.json(
          { error: "PublicAccessBlockConfiguration is required" },
          { status: 400 },
        );
      }
      await s3controlClient.send(
        new PutPublicAccessBlockCommand({
          AccountId: accountId,
          PublicAccessBlockConfiguration: config,
        }),
      );
      return NextResponse.json({ success: true, publicAccessBlockConfiguration: config });
    }

    if (action && action !== "createAccessPoint") {
      return NextResponse.json(
        { error: `Unknown action: ${action}. Supported: createAccessPoint, putPublicAccessBlock` },
        { status: 400 },
      );
    }

    // CreateAccessPointRequest: AccountId, Name, Bucket, VpcConfiguration,
    // PublicAccessBlockConfiguration, BucketAccountId, Scope, Tags.
    const name = body.Name || body.name;
    const bucket = body.Bucket || body.bucket;
    if (!name || !bucket) {
      return NextResponse.json(
        { error: "Name and Bucket are required to create an access point" },
        { status: 400 },
      );
    }
    const res = await s3controlClient.send(
      new CreateAccessPointCommand({
        AccountId: accountId,
        Name: name,
        Bucket: bucket,
        VpcConfiguration: body.VpcConfiguration || body.vpcConfiguration,
        PublicAccessBlockConfiguration:
          body.PublicAccessBlockConfiguration || body.publicAccessBlockConfiguration,
        BucketAccountId: body.BucketAccountId || body.bucketAccountId,
        Scope: body.Scope || body.scope,
        Tags: body.Tags || body.tags,
      }),
    );
    return NextResponse.json({ success: true, accessPoint: res });
  } catch (error: unknown) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}

export async function DELETE(request: Request) {
  const denied = await requirePermission(request, "DELETE");
  if (denied) return denied;

  try {
    const s3controlClient = getUserClientFromRequest(S3ControlClient, request);
    const { searchParams } = new URL(request.url);
    const accountId =
      searchParams.get("AccountId") || searchParams.get("accountId") || DEFAULT_ACCOUNT_ID;
    const name = searchParams.get("Name") || searchParams.get("name");
    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    await s3controlClient.send(new DeleteAccessPointCommand({ AccountId: accountId, Name: name }));
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}
