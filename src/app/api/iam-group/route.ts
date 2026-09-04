import { NextResponse } from "next/server";
import { ListGroupsCommand, CreateGroupCommand, DeleteGroupCommand } from "@aws-sdk/client-iam";
import { iam } from "@/lib/aws-clients";

export async function GET() {
  try {
    const res = await iam.send(new ListGroupsCommand({}));
    return NextResponse.json({ groups: res.Groups || [] });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const res = await iam.send(new CreateGroupCommand({ GroupName: body.groupName }));
    return NextResponse.json({ group: res.Group });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    await iam.send(new DeleteGroupCommand({ GroupName: searchParams.get("groupName")! }));
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
