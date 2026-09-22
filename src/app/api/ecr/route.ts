import { NextResponse } from "next/server";
import {
  ECRClient,
  DescribeRepositoriesCommand,
  CreateRepositoryCommand,
  DeleteRepositoryCommand,
  DescribeImagesCommand,
  PutLifecyclePolicyCommand,
  GetLifecyclePolicyCommand,
  DeleteLifecyclePolicyCommand,
} from "@aws-sdk/client-ecr";
import { getUserClientFromRequest } from "@/lib/aws-clients";
import { requirePermission } from "@/lib/data-isolation";

export async function GET(request: Request) {
  const denied = await requirePermission(request, "GET");
  if (denied) return denied;

  try {
    const ecrClient = getUserClientFromRequest(ECRClient, request);
    const { searchParams } = new URL(request.url);
    const repositoryName = searchParams.get("repositoryName");
    const action = searchParams.get("action");

    if (action === "describeImages" && repositoryName) {
      const res = await ecrClient.send(new DescribeImagesCommand({ repositoryName }));
      return NextResponse.json({ imageDetails: res.imageDetails || [] });
    }
    if (action === "getLifecyclePolicy" && repositoryName) {
      const res = await ecrClient.send(new GetLifecyclePolicyCommand({ repositoryName }));
      return NextResponse.json({ lifecyclePolicyText: res.lifecyclePolicyText, repositoryName: res.repositoryName });
    }

    const res = await ecrClient.send(new DescribeRepositoriesCommand({}));
    return NextResponse.json({ repositories: res.repositories || [] });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const denied = await requirePermission(request, "POST");
  if (denied) return denied;

  try {
    const ecrClient = getUserClientFromRequest(ECRClient, request);
    const body = await request.json();
    if (body.action === "putLifecyclePolicy") {
      const res = await ecrClient.send(new PutLifecyclePolicyCommand({
        repositoryName: body.repositoryName,
        lifecyclePolicyText: body.lifecyclePolicyText,
      }));
      return NextResponse.json({ lifecyclePolicyText: res.lifecyclePolicyText, repositoryName: res.repositoryName });
    }
    if (body.action === "deleteLifecyclePolicy") {
      await ecrClient.send(new DeleteLifecyclePolicyCommand({ repositoryName: body.repositoryName }));
      return NextResponse.json({ success: true });
    }
    const res = await ecrClient.send(new CreateRepositoryCommand({ repositoryName: body.repositoryName, imageTagMutability: "MUTABLE" }));
    return NextResponse.json({ repository: res.repository });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const denied = await requirePermission(request, "DELETE");
  if (denied) return denied;

  try {
    const ecrClient = getUserClientFromRequest(ECRClient, request);
    const { searchParams } = new URL(request.url);
    const body = await request.json().catch(() => ({}));
    const name = (body as { repositoryName?: string }).repositoryName || searchParams.get("name")!;
    await ecrClient.send(new DeleteRepositoryCommand({ repositoryName: name, force: true }));
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
