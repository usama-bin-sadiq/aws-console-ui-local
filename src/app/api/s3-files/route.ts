import { NextResponse } from "next/server";
import {
  ListObjectsV2Command,
  PutObjectCommand,
  CopyObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { s3 } from "@/lib/aws-clients";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const bucket = searchParams.get("bucket")!;
    const prefix = searchParams.get("prefix") || "";
    const res = await s3.send(new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: prefix,
      Delimiter: "/",
    }));
    return NextResponse.json({
      objects: res.Contents || [],
      prefixes: res.CommonPrefixes || [],
    });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (body.action === "copy") {
      await s3.send(new CopyObjectCommand({
        Bucket: body.destinationBucket,
        Key: body.destinationKey,
        CopySource: `${body.sourceBucket}/${body.sourceKey}`,
      }));
      return NextResponse.json({ success: true });
    }
    // default: upload (expects body.bucket, body.key, body.content as base64 or string)
    await s3.send(new PutObjectCommand({
      Bucket: body.bucket,
      Key: body.key,
      Body: body.content,
    }));
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const bucket = searchParams.get("bucket")!;
    const key = searchParams.get("key")!;
    await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
