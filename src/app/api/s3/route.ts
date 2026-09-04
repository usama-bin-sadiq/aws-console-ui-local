import { NextResponse } from "next/server";
import { getAdapterStatus, handleAdapterError } from "@/lib/adapter-error-handler";
import { ListBucketsCommand, CreateBucketCommand, DeleteBucketCommand, ListObjectsV2Command, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { s3 } from "@/lib/aws-clients";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const bucket = searchParams.get("bucket");
    if (bucket) {
      const res = await s3.send(new ListObjectsV2Command({ Bucket: bucket }));
      return NextResponse.json({ objects: res.Contents || [] });
    }
    const res = await s3.send(new ListBucketsCommand({}));
    return NextResponse.json({ buckets: res.Buckets || [] });
  } catch (error: any) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const bucket = formData.get("bucket");
    if (bucket) {
      await s3.send(new CreateBucketCommand({ Bucket: bucket.toString() }));
      return NextResponse.json({ success: true });
    }
    const file = formData.get("file") as File;
    const bucketName = formData.get("bucketName");
    if (file && bucketName) {
      const buffer = Buffer.from(await file.arrayBuffer());
      await s3.send(new PutObjectCommand({
        Bucket: bucketName.toString(),
        Key: file.name,
        Body: buffer,
      }));
      return NextResponse.json({ success: true, file: file.name });
    }
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  } catch (error: any) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const bucket = searchParams.get("bucket");
    const key = searchParams.get("key");
    if (key && bucket) {
      await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
      return NextResponse.json({ success: true });
    }
    if (bucket) {
      await s3.send(new DeleteBucketCommand({ Bucket: bucket }));
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}
