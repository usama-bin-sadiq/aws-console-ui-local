// Amazon Rekognition — collections and image analysis workflows.
// Commands: @aws-sdk/client-rekognition (ListCollections, CreateCollection,
// DeleteCollection, DescribeCollection, DetectLabels, DetectFaces,
// DetectModerationLabels, CompareFaces, IndexFaces, SearchFacesByImage)
import { NextResponse } from "next/server";
import {
  RekognitionClient,
  ListCollectionsCommand,
  CreateCollectionCommand,
  DeleteCollectionCommand,
  DescribeCollectionCommand,
  DetectLabelsCommand,
  DetectFacesCommand,
  DetectModerationLabelsCommand,
  CompareFacesCommand,
  IndexFacesCommand,
  SearchFacesByImageCommand,
} from "@aws-sdk/client-rekognition";
import { getUserClientFromRequest } from "@/lib/aws-clients";
import { requirePermission } from "@/lib/data-isolation";
import { getAdapterStatus, handleAdapterError } from "@/lib/adapter-error-handler";

type ImageInput = {
  Bytes?: Uint8Array;
  S3Object?: { Bucket: string; Name: string; Version?: string };
};

function parseImage(body: Record<string, unknown>): ImageInput | undefined {
  const s3 = body.s3Object as ImageInput["S3Object"];
  if (s3?.Bucket && s3.Name) return { S3Object: s3 };
  const base64 = (body.imageBase64 ?? body.image) as string | undefined;
  if (typeof base64 === "string" && base64.length > 0) {
    const cleaned = base64.includes(",") ? base64.split(",")[1] : base64;
    return { Bytes: Buffer.from(cleaned, "base64") };
  }
  return undefined;
}

function unavailable(error: unknown) {
  const adapter = getAdapterStatus();
  return handleAdapterError(error, adapter.mode, adapter.endpoint);
}

export async function GET(request: Request) {
  const denied = await requirePermission(request, "GET");
  if (denied) return denied;

  try {
    const client = getUserClientFromRequest(RekognitionClient, request);
    const res = await client.send(new ListCollectionsCommand({}));
    const collectionIds = res.CollectionIds || [];
    const collections = collectionIds.map((id, i) => ({
      CollectionId: id,
      FaceModelVersion: res.FaceModelVersions?.[i],
    }));
    return NextResponse.json({
      items: collections,
      collections,
      collectionIds,
      count: collections.length,
    });
  } catch (error: unknown) {
    return unavailable(error);
  }
}

export async function POST(request: Request) {
  const denied = await requirePermission(request, "POST");
  if (denied) return denied;

  try {
    const client = getUserClientFromRequest(RekognitionClient, request);
    const body = await request.json();

    switch (body.action) {
      case "createCollection": {
        const res = await client.send(
          new CreateCollectionCommand({ CollectionId: body.collectionId || body.name }),
        );
        return NextResponse.json({ collectionArn: res.CollectionArn, status: res.StatusCode });
      }
      case "describeCollection": {
        const res = await client.send(
          new DescribeCollectionCommand({ CollectionId: body.collectionId }),
        );
        return NextResponse.json({
          collection: {
            CollectionId: body.collectionId,
            CollectionARN: res.CollectionARN,
            CreationTimestamp: res.CreationTimestamp,
            FaceCount: res.FaceCount,
            UserCount: res.UserCount,
            FaceModelVersion: res.FaceModelVersion,
          },
          faceCount: res.FaceCount,
        });
      }
      case "detectLabels": {
        const image = parseImage(body);
        if (!image)
          return NextResponse.json(
            { error: "imageBase64 or s3Object is required" },
            { status: 400 },
          );
        const res = await client.send(
          new DetectLabelsCommand({
            Image: image,
            MaxLabels: body.maxLabels,
            MinConfidence: body.minConfidence,
          }),
        );
        return NextResponse.json({ items: res.Labels || [], labels: res.Labels || [] });
      }
      case "detectFaces": {
        const image = parseImage(body);
        if (!image)
          return NextResponse.json(
            { error: "imageBase64 or s3Object is required" },
            { status: 400 },
          );
        const res = await client.send(
          new DetectFacesCommand({ Image: image, Attributes: body.attributes || ["ALL"] }),
        );
        return NextResponse.json({
          items: res.FaceDetails || [],
          faceDetails: res.FaceDetails || [],
        });
      }
      case "detectModerationLabels": {
        const image = parseImage(body);
        if (!image)
          return NextResponse.json(
            { error: "imageBase64 or s3Object is required" },
            { status: 400 },
          );
        const res = await client.send(new DetectModerationLabelsCommand({ Image: image }));
        return NextResponse.json({
          items: res.ModerationLabels || [],
          moderationLabels: res.ModerationLabels || [],
        });
      }
      case "compareFaces": {
        const sourceImage = parseImage({
          imageBase64: body.sourceImageBase64,
          s3Object: body.sourceS3Object,
          image: body.sourceImage,
        });
        const targetImage = parseImage({
          imageBase64: body.targetImageBase64,
          s3Object: body.targetS3Object,
          image: body.targetImage,
        });
        if (!sourceImage || !targetImage) {
          return NextResponse.json(
            { error: "source and target images are required (…ImageBase64 or …S3Object)" },
            { status: 400 },
          );
        }
        const res = await client.send(
          new CompareFacesCommand({
            SourceImage: sourceImage,
            TargetImage: targetImage,
            SimilarityThreshold: body.similarityThreshold,
          }),
        );
        return NextResponse.json({
          items: res.FaceMatches || [],
          faceMatches: res.FaceMatches || [],
          unmatchedFaces: res.UnmatchedFaces || [],
        });
      }
      case "indexFaces": {
        const image = parseImage(body);
        if (!image)
          return NextResponse.json(
            { error: "imageBase64 or s3Object is required" },
            { status: 400 },
          );
        const res = await client.send(
          new IndexFacesCommand({
            CollectionId: body.collectionId,
            Image: image,
            ExternalImageId: body.externalImageId,
            MaxFaces: body.maxFaces,
            DetectionAttributes: body.attributes || ["ALL"],
          }),
        );
        return NextResponse.json({
          items: res.FaceRecords || [],
          faceRecords: res.FaceRecords || [],
        });
      }
      case "searchFacesByImage": {
        const image = parseImage(body);
        if (!image)
          return NextResponse.json(
            { error: "imageBase64 or s3Object is required" },
            { status: 400 },
          );
        const res = await client.send(
          new SearchFacesByImageCommand({
            CollectionId: body.collectionId,
            Image: image,
            MaxFaces: body.maxFaces,
            FaceMatchThreshold: body.faceMatchThreshold,
          }),
        );
        return NextResponse.json({
          items: res.FaceMatches || [],
          faceMatches: res.FaceMatches || [],
        });
      }
      default:
        return NextResponse.json(
          {
            error: `Unsupported action "${body.action}". Supported: createCollection, describeCollection, detectLabels, detectFaces, detectModerationLabels, compareFaces, indexFaces, searchFacesByImage`,
          },
          { status: 400 },
        );
    }
  } catch (error: unknown) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}

export async function DELETE(request: Request) {
  const denied = await requirePermission(request, "DELETE");
  if (denied) return denied;

  try {
    const client = getUserClientFromRequest(RekognitionClient, request);
    const { searchParams } = new URL(request.url);
    const collectionId = searchParams.get("collectionId");
    if (!collectionId) {
      return NextResponse.json({ error: "Missing ?collectionId=" }, { status: 400 });
    }
    const res = await client.send(new DeleteCollectionCommand({ CollectionId: collectionId }));
    return NextResponse.json({ success: true, collectionId, status: res.StatusCode });
  } catch (error: unknown) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}
