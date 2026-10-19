import { NextResponse } from "next/server";
import {
  ListGroupsCommand,
  CreateGroupCommand,
  DeleteGroupCommand,
  ListGroupResourcesCommand,
  ResourceGroupsClient,
} from "@aws-sdk/client-resource-groups";
import { getUserClientFromRequest } from "@/lib/aws-clients";
import { requirePermission } from "@/lib/data-isolation";
import { getAdapterStatus, handleAdapterError } from "@/lib/adapter-error-handler";

export async function GET(request: Request) {
  const denied = await requirePermission(request, "GET");
  if (denied) return denied;

  try {
    const resourceGroupsClient = getUserClientFromRequest(ResourceGroupsClient, request);
    const res = await resourceGroupsClient.send(new ListGroupsCommand({}));
    return NextResponse.json({ groups: res.Groups || [] });
  } catch (error) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}

export async function POST(request: Request) {
  const denied = await requirePermission(request, "POST");
  if (denied) return denied;

  try {
    const resourceGroupsClient = getUserClientFromRequest(ResourceGroupsClient, request);
    const body = await request.json();
    if (body.action === "listResources") {
      const res = await resourceGroupsClient.send(
        new ListGroupResourcesCommand({ GroupName: body.groupName }),
      );
      return NextResponse.json({ resources: res.Resources || [] });
    }
    const res = await resourceGroupsClient.send(
      new CreateGroupCommand({
        Name: body.name,
        ResourceQuery: body.resourceQuery || {
          Type: "TAG_FILTERS_1_0",
          Query: JSON.stringify({ ResourceTypeFilters: ["AWS::AllSupported"], TagFilters: [] }),
        },
      }),
    );
    return NextResponse.json({ group: res.Group });
  } catch (error) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}

export async function DELETE(request: Request) {
  const denied = await requirePermission(request, "DELETE");
  if (denied) return denied;

  try {
    const resourceGroupsClient = getUserClientFromRequest(ResourceGroupsClient, request);
    const { searchParams } = new URL(request.url);
    await resourceGroupsClient.send(
      new DeleteGroupCommand({ GroupName: searchParams.get("name")! }),
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}
