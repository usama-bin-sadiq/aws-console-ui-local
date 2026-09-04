import { NextResponse } from "next/server";
import { DescribeRepositoriesCommand, CreateRepositoryCommand, DeleteRepositoryCommand } from "@aws-sdk/client-ecr";
import { ecr } from "@/lib/aws-clients";

export async function GET() {
  try {
    const res = await ecr.send(new DescribeRepositoriesCommand({}));
    return NextResponse.json({ repositories: res.repositories || [] });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
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
