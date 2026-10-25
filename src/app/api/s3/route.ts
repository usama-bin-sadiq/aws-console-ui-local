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
 * [x] Added PUT handlers for bucket versioning, policy, public access block, ACL
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
  GetBucketLocationCommand,
  CopyObjectCommand,
  GetPublicAccessBlockCommand,
  PutPublicAccessBlockCommand,
  GetBucketAclCommand,
  PutBucketAclCommand,
} from "@aws-sdk/client-s3";
import { getUserClientFromRequest } from "@/lib/aws-clients";
import { requirePermission } from "@/lib/data-isolation";

// ─── Helper to resolve SDK instance using user credentials ──────────────────────
function getS3Client(request: Request): S3Client {
  return getUserClientFromRequest(S3Client, request);
}

/**
 * The four documented PublicAccessBlockConfiguration fields. Returned only when
 * the body actually carries at least one of them, so an unrelated payload is
 * rejected with a 400 rather than sent to the emulator as an empty config.
 */
function pickPublicAccessBlock(body: Record<string, unknown>): Record<string, boolean> | null {
  const fields = [
    "BlockPublicAcls",
    "IgnorePublicAcls",
    "BlockPublicPolicy",
    "RestrictPublicBuckets",
  ] as const;
  const config: Record<string, boolean> = {};
  for (const field of fields) {
    if (typeof body[field] === "boolean") config[field] = body[field] as boolean;
  }
  return Object.keys(config).length > 0 ? config : null;
}

// ─── GET ────────────────────────────────────────────────────────────────────────
export async function GET(request: Request) {
  const denied = await requirePermission(request, "GET");
  if (denied) return denied;

  try {
    const { searchParams } = new URL(request.url);
    const bucket = searchParams.get("bucket");
    const key = searchParams.get("key");
    const action = searchParams.get("action") || "list";

    const client = getS3Client(request);

    // Object download
    if (bucket && key && action === "download") {
      const res = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
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
      const res = await client.send(new ListObjectsV2Command({ Bucket: bucket }));
      return NextResponse.json({ objects: res.Contents || [], prefixes: res.CommonPrefixes || [] });
    }

    // Bucket versioning
    if (bucket && action === "versioning") {
      const res = await client.send(new GetBucketVersioningCommand({ Bucket: bucket }));
      return NextResponse.json({ versioning: res.Status, mfaDelete: res.MFADelete });
    }

    // Bucket encryption
    if (bucket && action === "encryption") {
      const res = await client.send(new GetBucketEncryptionCommand({ Bucket: bucket }));
      return NextResponse.json({ encryption: res.ServerSideEncryptionConfiguration });
    }

    // Bucket policy
    if (bucket && action === "policy") {
      const res = await client.send(new GetBucketPolicyCommand({ Bucket: bucket }));
      return NextResponse.json({ policy: res.Policy ? JSON.parse(res.Policy) : null });
    }

    // Bucket tagging
    if (bucket && action === "tags") {
      const res = await client.send(new GetBucketTaggingCommand({ Bucket: bucket }));
      return NextResponse.json({ tags: res.TagSet || [] });
    }

    // Bucket lifecycle
    if (bucket && action === "lifecycle") {
      const res = await client.send(new GetBucketLifecycleConfigurationCommand({ Bucket: bucket }));
      return NextResponse.json({ rules: res.Rules || [] });
    }

    // Bucket website
    if (bucket && action === "website") {
      const res = await client.send(new GetBucketWebsiteCommand({ Bucket: bucket }));
      return NextResponse.json({
        website: {
          IndexDocument: res.IndexDocument,
          ErrorDocument: res.ErrorDocument,
          RedirectAllRequestsTo: res.RedirectAllRequestsTo,
        },
      });
    }

    // Bucket location
    if (bucket && action === "location") {
      const res = await client.send(new GetBucketLocationCommand({ Bucket: bucket }));
      return NextResponse.json({ location: res.LocationConstraint || "us-east-1" });
    }

    // Bucket public access block
    if (bucket && action === "public-access-block") {
      const res = await client.send(new GetPublicAccessBlockCommand({ Bucket: bucket }));
      return NextResponse.json({ publicAccessBlock: res.PublicAccessBlockConfiguration });
    }

    // Bucket ACL
    if (bucket && action === "acl") {
      const res = await client.send(new GetBucketAclCommand({ Bucket: bucket }));
      return NextResponse.json({ acl: res });
    }

    // List all buckets
    const res = await client.send(new ListBucketsCommand({}));
    return NextResponse.json({ buckets: res.Buckets || [] });
  } catch (error: unknown) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}

// ─── POST ──────────────────────────────────────────────────────────────────────
export async function POST(request: Request) {
  const denied = await requirePermission(request, "POST");
  if (denied) return denied;

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
      body = await request.json().catch(() => ({}) as any);
    }

    const action = actionParam || body.action || "";
    const bucket = body.bucket || searchParams.get("bucket") || "";
    const client = getS3Client(request);

    // Upload object (via form data or JSON)
    if ((body.file || body.fileName || (body.key && body.buffer)) && !action) {
      const buffer = body.buffer
        ? Buffer.from(body.buffer, body.encoding || "base64")
        : body.content
          ? Buffer.from(String(body.content))
          : null;
      await client.send(
        new PutObjectCommand({
          Bucket: String(body.bucketName || body.bucket || bucket || ""),
          Key: String(body.fileName || body.key || body.file?.name || "unknown"),
          Body: (buffer || body.content || "") as any,
        }),
      );
      return NextResponse.json({
        success: true,
        key: String(body.fileName || body.key || body.file?.name || "unknown"),
      });
    }

    // Create bucket
    if (action === "create-bucket" || (!action && bucket)) {
      const regionVal = (body.region || "us-east-1") as any;
      const config = regionVal === "us-east-1" ? undefined : { LocationConstraint: regionVal };
      await client.send(
        new CreateBucketCommand({
          Bucket: String(bucket || body.bucket || body.name || ""),
          ...(config ? { CreateBucketConfiguration: config } : {}),
        }),
      );
      return NextResponse.json({
        success: true,
        bucket: String(bucket || body.bucket || body.name || ""),
      });
    }

    // Put bucket versioning
    if (action === "versioning" && bucket) {
      await client.send(
        new PutBucketVersioningCommand({
          Bucket: String(bucket),
          VersioningConfiguration: {
            Status: (body.status || body.versioning || "Enabled") as any,
          },
        }),
      );
      return NextResponse.json({ success: true });
    }

    // Put bucket encryption
    if (action === "encryption" && bucket) {
      const config = body.encryption ||
        body.config || {
          Rules: [
            { ApplyServerSideEncryptionByDefault: { SSEAlgorithm: body.algorithm || "AES256" } },
          ],
        };
      await client.send(
        new PutBucketEncryptionCommand({
          Bucket: String(bucket),
          ServerSideEncryptionConfiguration: config as any,
        }),
      );
      return NextResponse.json({ success: true });
    }

    // Put bucket policy
    if (action === "policy" && bucket) {
      const policyStr =
        typeof body.policy === "string" ? body.policy : JSON.stringify(body.policy || {});
      await client.send(
        new PutBucketPolicyCommand({
          Bucket: String(bucket),
          Policy: policyStr,
        }),
      );
      return NextResponse.json({ success: true });
    }

    // Put bucket tagging
    if (action === "tags" && bucket) {
      await client.send(
        new PutBucketTaggingCommand({
          Bucket: String(bucket),
          Tagging: { TagSet: (body.tags || body.TagSet || []) as any },
        }),
      );
      return NextResponse.json({ success: true });
    }

    // Put bucket lifecycle
    if (action === "lifecycle" && bucket) {
      await client.send(
        new PutBucketLifecycleConfigurationCommand({
          Bucket: String(bucket),
          LifecycleConfiguration: { Rules: (body.rules || body.Rules || []) as any },
        }),
      );
      return NextResponse.json({ success: true });
    }

    // Put bucket website
    if (action === "website" && bucket) {
      await client.send(
        new PutBucketWebsiteCommand({
          Bucket: String(bucket),
          WebsiteConfiguration: body.website || body.config || body.WebsiteConfiguration || {},
        }),
      );
      return NextResponse.json({ success: true });
    }

    // Copy object
    if (action === "copy-object" && bucket) {
      const sourceKey = body.sourceKey || body.source;
      const destKey = body.destKey || body.destination;
      if (!sourceKey || !destKey) {
        return NextResponse.json({ error: "sourceKey and destKey are required" }, { status: 400 });
      }
      await client.send(
        new CopyObjectCommand({
          Bucket: String(bucket),
          CopySource: `${bucket}/${sourceKey}`,
          Key: String(destKey),
        }),
      );
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid request", action, bucket }, { status: 400 });
  } catch (error: unknown) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}

// ─── PUT ────────────────────────────────────────────────────────────────────────
/**
 * Bucket configuration writes. The bucket detail page saves versioning, policy,
 * public access block and ACL with `PUT ?bucket=...&action=<name>`, so each of
 * those needs a PUT handler alongside the matching GET read.
 */
export async function PUT(request: Request) {
  const denied = await requirePermission(request, "PUT");
  if (denied) return denied;

  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action") || "";
    const bucket = searchParams.get("bucket") || searchParams.get("Bucket") || "";
    if (!bucket) {
      return NextResponse.json({ error: "bucket is required" }, { status: 400 });
    }
    const body = await request.json().catch(() => ({}));
    const client = getS3Client(request);

    // Put bucket versioning
    if (action === "versioning") {
      const status = body.Status || body.status;
      if (status !== "Enabled" && status !== "Suspended") {
        return NextResponse.json({ error: "Status must be Enabled or Suspended" }, { status: 400 });
      }
      await client.send(
        new PutBucketVersioningCommand({
          Bucket: bucket,
          VersioningConfiguration: {
            Status: status,
            MFADelete: body.MFADelete || body.mfaDelete,
          },
        }),
      );
      return NextResponse.json({ success: true, versioning: status });
    }

    // Put bucket policy
    if (action === "policy") {
      const policy = body.Policy ?? body.policy;
      if (policy === undefined) {
        return NextResponse.json({ error: "policy is required" }, { status: 400 });
      }
      await client.send(
        new PutBucketPolicyCommand({
          Bucket: bucket,
          Policy: typeof policy === "string" ? policy : JSON.stringify(policy),
        }),
      );
      return NextResponse.json({ success: true });
    }

    // Put bucket public access block. Accepts the documented
    // PublicAccessBlockConfiguration object either wrapped or inline, which is
    // what the bucket detail page posts.
    if (action === "public-access-block") {
      const config =
        body.PublicAccessBlockConfiguration ||
        body.publicAccessBlockConfiguration ||
        body.config ||
        pickPublicAccessBlock(body);
      if (!config) {
        return NextResponse.json(
          { error: "PublicAccessBlockConfiguration is required" },
          { status: 400 },
        );
      }
      await client.send(
        new PutPublicAccessBlockCommand({
          Bucket: bucket,
          PublicAccessBlockConfiguration: config,
        }),
      );
      return NextResponse.json({ success: true, publicAccessBlock: config });
    }

    // Put bucket ACL. Accepts a canned ACL name, a full documented
    // AccessControlPolicy, or a bare Grants array (which is wrapped into the
    // documented AccessControlPolicy the API expects).
    if (action === "acl") {
      const accessControlPolicy = body.AccessControlPolicy || body.accessControlPolicy;
      const grants = body.Grants || body.grants;
      const canned = body.ACL || body.acl;
      if (!accessControlPolicy && !grants && !canned) {
        return NextResponse.json(
          { error: "AccessControlPolicy, Grants or ACL is required" },
          { status: 400 },
        );
      }
      let policy =
        accessControlPolicy ??
        (grants ? { Grants: grants, Owner: body.Owner || body.owner } : undefined);
      if (policy && !policy.Owner) {
        // The documented AccessControlPolicy makes Owner optional, but the
        // emulator rejects a grants document without one, so resolve the
        // bucket owner rather than surfacing a MalformedACLError.
        const current = await client.send(new GetBucketAclCommand({ Bucket: bucket }));
        policy = { ...policy, Owner: current.Owner };
      }
      await client.send(
        new PutBucketAclCommand({
          Bucket: bucket,
          AccessControlPolicy: policy,
          ACL: canned,
        }),
      );
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      {
        error: `Unknown PUT action: ${action || "(none)"}. Supported: versioning, policy, public-access-block, acl`,
      },
      { status: 400 },
    );
  } catch (error: unknown) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}

// ─── DELETE ─────────────────────────────────────────────────────────────────────
export async function DELETE(request: Request) {
  const denied = await requirePermission(request, "DELETE");
  if (denied) return denied;

  try {
    const { searchParams } = new URL(request.url);
    const bucket = searchParams.get("bucket");
    const key = searchParams.get("key");
    const action = searchParams.get("action") || "";
    const client = getS3Client(request);

    if (key && bucket && action !== "bucket") {
      await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
      return NextResponse.json({ success: true });
    }
    if (bucket) {
      await client.send(new DeleteBucketCommand({ Bucket: bucket }));
      return NextResponse.json({ success: true, bucket });
    }
    return NextResponse.json({ error: "Invalid delete request" }, { status: 400 });
  } catch (error: unknown) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}
