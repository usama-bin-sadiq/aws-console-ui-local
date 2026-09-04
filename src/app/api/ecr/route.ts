import { NextResponse } from "next/server";
import {
  DescribeRepositoriesCommand,
  CreateRepositoryCommand,
  DeleteRepositoryCommand,
  DescribeImagesCommand,
  PutLifecyclePolicyCommand,
  GetLifecyclePolicyCommand,
  DeleteLifecyclePolicyCommand,
} from "@aws-sdk/client-ecr";
import { ecr } from "@/lib/aws-clients";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const repositoryName = searchParams.get("repositoryName");
    const action = searchParams.get("action");

    if (action === "describeImages" && repositoryName) {
      const res = await ecr.send(new DescribeImagesCommand({ repositoryName }));
      return NextResponse.json({ imageDetails: res.imageDetails || [] });
    }
    if (action === "getLifecyclePolicy" && repositoryName) {
      const res = await ecr.send(new GetLifecyclePolicyCommand({ repositoryName }));
      return NextResponse.json({ lifecyclePolicyText: res.lifecyclePolicyText, repositoryName: res.repositoryName });
    }

    const res = await ecr.send(new DescribeRepositoriesCommand({}));
    return NextResponse.json({ repositories: res.repositories || [] });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (body.action === "putLifecyclePolicy") {
      const res = await ecr.send(new PutLifecyclePolicyCommand({
        repositoryName: body.repositoryName,
        lifecyclePolicyText: body.lifecyclePolicyText,
      }));
      return NextResponse.json({ lifecyclePolicyText: res.lifecyclePolicyText, repositoryName: res.repositoryName });
    }
    if (body.action === "deleteLifecyclePolicy") {
      await ecr.send(new DeleteLifecyclePolicyCommand({ repositoryName: body.repositoryName }));
      return NextResponse.json({ success: true });
    }
    const res = await ecr.send(new CreateRepositoryCommand({ repositoryName: body.repositoryName, imageTagMutability: "MUTABLE" }));
    return NextResponse.json({ repository: res.repository });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const body = await request.json().catch(() => ({}));
    const name = (body as { repositoryName?: string }).repositoryName || searchParams.get("name")!;
    await ecr.send(new DeleteRepositoryCommand({ repositoryName: name, force: true }));
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
