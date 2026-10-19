import { NextResponse } from "next/server";
import {
  S3Client,
  ListObjectsV2Command,
  PutObjectCommand,
  CopyObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getUserClientFromRequest } from "@/lib/aws-clients";
import { requirePermission } from "@/lib/data-isolation";
import { getAdapterStatus, handleAdapterError } from "@/lib/adapter-error-handler";

// ─── Helper ─────────────────────────────────────────────────────────────────────
/**
 * CopyObject's `CopySource` header must be URL-encoded, and the SDK also
 * expects the value without a leading slash.
 */
function buildCopySource(sourceBucket: string, sourceKey: string): string {
  return `${sourceBucket}/${sourceKey}`
    .split("/")
    .map((part, i) => (i === 0 ? part : encodeURIComponent(part)))
    .join("/");
}

export async function GET(request: Request) {
  const denied = await requirePermission(request, "GET");
  if (denied) return denied;

  try {
    const s3Client = getUserClientFromRequest(S3Client, request);
    const { searchParams } = new URL(request.url);
    const bucket = (searchParams.get("Bucket") || searchParams.get("bucket"))?.trim();
    if (!bucket) {
      return NextResponse.json({ error: "bucket is required" }, { status: 400 });
    }
    const prefix = searchParams.get("Prefix") || searchParams.get("prefix") || "";
    const res = await s3Client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
        Delimiter: "/",
      }),
    );
    return NextResponse.json({
      objects: res.Contents || [],
      prefixes: res.CommonPrefixes || [],
    });
  } catch (error: unknown) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}

export async function POST(request: Request) {
  const denied = await requirePermission(request, "POST");
  if (denied) return denied;

  try {
    const s3Client = getUserClientFromRequest(S3Client, request);
    const body = await request.json();
    if (body.action === "copy") {
      // Documented CopyObject names, with the console's camelCase spellings.
      const sourceBucket = body.SourceBucket || body.sourceBucket;
      const sourceKey = body.SourceKey || body.sourceKey;
      const destinationBucket = body.DestinationBucket || body.destinationBucket;
      const destinationKey = body.DestinationKey || body.destinationKey;
      if (!sourceBucket || !sourceKey || !destinationBucket || !destinationKey) {
        return NextResponse.json(
          { error: "sourceBucket, sourceKey, destinationBucket, and destinationKey are required" },
          { status: 400 },
        );
      }
      await s3Client.send(
        new CopyObjectCommand({
          Bucket: destinationBucket,
          Key: destinationKey,
          CopySource: buildCopySource(sourceBucket, sourceKey),
          MetadataDirective: body.MetadataDirective || body.metadataDirective,
          StorageClass: body.StorageClass || body.storageClass,
        }),
      );
      return NextResponse.json({ success: true });
    }
    // default: upload (PutObjectRequest Bucket, Key, Body, ContentType, ...)
    const bucket = body.Bucket || body.bucket;
    const key = body.Key || body.key;
    const content = body.Content ?? body.content;
    if (!bucket || !key || typeof content !== "string") {
      return NextResponse.json(
        { error: "bucket, key, and string content are required" },
        { status: 400 },
      );
    }
    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: content,
        ContentType: body.ContentType || body.contentType,
        StorageClass: body.StorageClass || body.storageClass,
        Metadata: body.Metadata || body.metadata,
      }),
    );
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}

export async function DELETE(request: Request) {
  const denied = await requirePermission(request, "DELETE");
  if (denied) return denied;

  try {
    const s3Client = getUserClientFromRequest(S3Client, request);
    const { searchParams } = new URL(request.url);
    const bucket = (searchParams.get("Bucket") || searchParams.get("bucket"))?.trim();
    const key = (searchParams.get("Key") || searchParams.get("key"))?.trim();
    if (!bucket || !key) {
      return NextResponse.json({ error: "bucket and key are required" }, { status: 400 });
    }
    await s3Client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}
