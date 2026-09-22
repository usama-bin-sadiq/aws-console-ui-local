import { NextResponse } from "next/server";
import { GetResourcesCommand, ResourceGroupsTaggingAPIClient } from "@aws-sdk/client-resource-groups-tagging-api";
import { getUserClientFromRequest } from "@/lib/aws-clients";
import { requirePermission } from "@/lib/data-isolation";

export async function GET(request: Request) {
  const denied = await requirePermission(request, "GET");
  if (denied) return denied;

  try {
    const resourceGroupsTaggingClient = getUserClientFromRequest(ResourceGroupsTaggingAPIClient, request);
    const res = await resourceGroupsTaggingClient.send(new GetResourcesCommand({}));
    return NextResponse.json({ resources: res.ResourceTagMappingList || [] });
  } catch (error: unknown) {
    return NextResponse.json({
      resources: [],
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
