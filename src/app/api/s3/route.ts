import { NextResponse } from "next/server";

/**
 * VERIFICATION GATE CHECKLIST (Phase 5 — S3 Buckets + Objects)
 * [x] Uses @aws-sdk/client-s3 commands (ListBuckets, CreateBucket, DeleteBucket, etc.)
 * [x] Uses adapter SDK singleton (s3 from @/lib/aws-clients)
 * [x] Added versioning APIs: GetBucketVersioning, PutBucketVersioning
 * [x] Added encryption APIs: GetBucketEncryption, PutBucketEncryption
 * [x] Added policy APIs: GetBucketPolicy, PutBucketPolicy
 * [x] Added tagging APIs: GetBucketTagging, PutBucketTagging
 * [x] Added lifecycle APIs: GetBucketLifecycleConfiguration, PutBucketLifecycleConfiguration
 * [x] Added website APIs: GetBucketWebsite, PutBucketWebsite
 * [x] Added object download endpoint (action=download)
 * [x] No hardcoded *.amazonaws.com endpoints
 * [x] Uses adapter error handler (getAdapterStatus, handleAdapterError)
 */
import { getAdapterStatus, handleAdapterError } from "@/lib/adapter-error-handler";
import {
  S3Client,
  ListBucketsCommand,
  CreateBucketCommand,
  DeleteBucketCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  GetBucketVersioningCommand,
  PutBucketVersioningCommand,
  GetBucketEncryptionCommand,
  PutBucketEncryptionCommand,
  GetBucketPolicyCommand,
  PutBucketPolicyCommand,
  GetBucketWebsiteCommand,
  PutBucketWebsiteCommand,
  GetBucketTaggingCommand,
  PutBucketTaggingCommand,
  GetBucketLifecycleConfigurationCommand,
  PutBucketLifecycleConfigurationCommand,
} from "@aws-sdk/client-s3";
import { s3 } from "@/lib/aws-clients";

// ─── Helper to resolve SDK instance ─────────────────────────────────────────────
function getS3Client(): S3Client {
  return s3 as S3Client;
}

// ─── GET ────────────────────────────────────────────────────────────────────────
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const bucket = searchParams.get("bucket");
    const key = searchParams.get("key");
    const action = searchParams.get("action") || "list";

    // Object download
    if (bucket && key && action === "download") {
      const res = await getS3Client().send(new GetObjectCommand({ Bucket: bucket, Key: key }));
      const body = await res.Body?.transformToByteArray();
      return new NextResponse(body ? Buffer.from(body) : null, {
        status: 200,
        headers: {
          "Content-Type": res.ContentType || "application/octet-stream",
          "Content-Disposition": `attachment; filename="${key}"`,
        },
      });
    }

    // List objects in bucket
    if (bucket && !key && action === "list") {
      const res = await getS3Client().send(new ListObjectsV2Command({ Bucket: bucket }));
      return NextResponse.json({ objects: res.Contents || [], prefixes: res.CommonPrefixes || [] });
    }

    // Bucket versioning
    if (bucket && action === "versioning") {
      const res = await getS3Client().send(new GetBucketVersioningCommand({ Bucket: bucket }));
      return NextResponse.json({ versioning: res.Status, mfaDelete: res.MFADelete });
    }

    // Bucket encryption
    if (bucket && action === "encryption") {
      const res = await getS3Client().send(new GetBucketEncryptionCommand({ Bucket: bucket }));
      return NextResponse.json({ encryption: res.ServerSideEncryptionConfiguration });
    }

    // Bucket policy
    if (bucket && action === "policy") {
      const res = await getS3Client().send(new GetBucketPolicyCommand({ Bucket: bucket }));
      return NextResponse.json({ policy: res.Policy ? JSON.parse(res.Policy) : null });
    }

    // Bucket tagging
    if (bucket && action === "tags") {
      const res = await getS3Client().send(new GetBucketTaggingCommand({ Bucket: bucket }));
      return NextResponse.json({ tags: res.TagSet || [] });
    }

    // Bucket lifecycle
    if (bucket && action === "lifecycle") {
      const res = await getS3Client().send(new GetBucketLifecycleConfigurationCommand({ Bucket: bucket }));
      return NextResponse.json({ rules: res.Rules || [] });
    }

    // Bucket website
    if (bucket && action === "website") {
      const res = await getS3Client().send(new GetBucketWebsiteCommand({ Bucket: bucket }));
      return NextResponse.json({
        website: {
          IndexDocument: res.IndexDocument,
          ErrorDocument: res.ErrorDocument,
          RedirectAllRequestsTo: res.RedirectAllRequestsTo,
        },
      });
    }

    // List all buckets
    const res = await getS3Client().send(new ListBucketsCommand({}));
    return NextResponse.json({ buckets: res.Buckets || [] });
  } catch (error: any) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}

// ─── POST ──────────────────────────────────────────────────────────────────────
export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const actionParam = searchParams.get("action");
    let body: any = {};
    const contentType = request.headers.get("content-type") || "";

    // Try form data first (for file uploads from wizard/pages)
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      body = Object.fromEntries(formData.entries());
      body.fileName = formData.get("fileName") || body.file?.name || body.key || "unknown";
      // If there's an actual File object
      const fileObj = formData.get("file");
      if (fileObj instanceof File) {
        const buffer = Buffer.from(await fileObj.arrayBuffer());
        body.buffer = buffer.toString("base64");
        body.encoding = "base64";
        body.fileName = fileObj.name;
      }
    } else {
      body = await request.json().catch(() => ({}));
    }

    const action = actionParam || body.action || "";
    const bucket = body.bucket || searchParams.get("bucket") || "";

    // Upload object (via form data or JSON)
    if ((body.file || body.fileName || (body.key && body.buffer)) && !action) {
      const buffer = body.buffer ? Buffer.from(body.buffer, body.encoding || "base64") : (body.content ? Buffer.from(String(body.content)) : null);
      await getS3Client().send(new PutObjectCommand({
        Bucket: String(body.bucketName || body.bucket || bucket || ""),
        Key: String(body.fileName || body.key || body.file?.name || "unknown"),
        Body: buffer || body.content || "",
      }));
      return NextResponse.json({ success: true, key: String(body.fileName || body.key || body.file?.name || "unknown") });
    }

    // Create bucket
    if (action === "create-bucket" || (!action && bucket)) {
      const regionVal = body.region || 'us-east-1';
      const config = regionVal === 'us-east-1' ? undefined : { LocationConstraint: regionVal };
      await getS3Client().send(new CreateBucketCommand({ Bucket: String(bucket || body.bucket || body.name || ""), ...(config ? { CreateBucketConfiguration: config } : {}) }));
      return NextResponse.json({ success: true, bucket: String(bucket || body.bucket || body.name || "") });
    }

    // Put bucket versioning
    if (action === "versioning" && bucket) {
      await getS3Client().send(new PutBucketVersioningCommand({
        Bucket: String(bucket),
        VersioningConfiguration: { Status: body.status || body.versioning || "Enabled" },
      }));
      return NextResponse.json({ success: true });
    }

    // Put bucket encryption
    if (action === "encryption" && bucket) {
      const config = body.encryption || body.config || {
        Rules: [{ ApplyServerSideEncryptionByDefault: { SSEAlgorithm: body.algorithm || "AES256" } }],
      };
      await getS3Client().send(new PutBucketEncryptionCommand({
        Bucket: String(bucket),
        ServerSideEncryptionConfiguration: config,
      }));
      return NextResponse.json({ success: true });
    }

    // Put bucket policy
    if (action === "policy" && bucket) {
      const policyStr = typeof body.policy === "string" ? body.policy : JSON.stringify(body.policy || {});
      await getS3Client().send(new PutBucketPolicyCommand({
        Bucket: String(bucket),
        Policy: policyStr,
      }));
      return NextResponse.json({ success: true });
    }

    // Put bucket tagging
    if (action === "tags" && bucket) {
      await getS3Client().send(new PutBucketTaggingCommand({
        Bucket: String(bucket),
        Tagging: { TagSet: body.tags || body.TagSet || [] },
      }));
      return NextResponse.json({ success: true });
    }

    // Put bucket lifecycle
    if (action === "lifecycle" && bucket) {
      await getS3Client().send(new PutBucketLifecycleConfigurationCommand({
        Bucket: String(bucket),
        LifecycleConfiguration: { Rules: body.rules || body.Rules || [] },
      }));
      return NextResponse.json({ success: true });
    }

    // Put bucket website
    if (action === "website" && bucket) {
      await getS3Client().send(new PutBucketWebsiteCommand({
        Bucket: String(bucket),
        WebsiteConfiguration: body.website || body.config || body.WebsiteConfiguration || {},
      }));
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid request", action, bucket }, { status: 400 });
  } catch (error: any) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}

// ─── DELETE ─────────────────────────────────────────────────────────────────────
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const bucket = searchParams.get("bucket");
    const key = searchParams.get("key");
    const action = searchParams.get("action") || "";

    if (key && bucket && action !== "bucket") {
      await getS3Client().send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
      return NextResponse.json({ success: true });
    }
    if (bucket) {
      await getS3Client().send(new DeleteBucketCommand({ Bucket: bucket }));
      return NextResponse.json({ success: true, bucket });
    }
    return NextResponse.json({ error: "Invalid delete request" }, { status: 400 });
  } catch (error: any) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}
