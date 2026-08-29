import { NextResponse } from "next/server";
import { ListGroupsCommand, CreateGroupCommand, DeleteGroupCommand, ListGroupResourcesCommand } from "@aws-sdk/client-resource-groups";
import { resourceGroups } from "@/lib/aws-clients";

export async function GET() {
  try {
    const res = await resourceGroups.send(new ListGroupsCommand({}));
    return NextResponse.json({ groups: res.Groups || [] });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (body.action === "listResources") {
      const res = await resourceGroups.send(new ListGroupResourcesCommand({ GroupName: body.groupName }));
      return NextResponse.json({ resources: res.Resources || [] });
    }
    const res = await resourceGroups.send(new CreateGroupCommand({
      Name: body.name,
      ResourceQuery: body.resourceQuery || {
        Type: "TAG_FILTERS_1_0",
        Query: JSON.stringify({ ResourceTypeFilters: ["AWS::AllSupported"], TagFilters: [] }),
      },
    }));
    return NextResponse.json({ group: res.Group });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    await resourceGroups.send(new DeleteGroupCommand({ GroupName: searchParams.get("name")! }));
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
