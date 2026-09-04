import { NextResponse } from "next/server";
import { GetResourcesCommand } from "@aws-sdk/client-resource-groups-tagging-api";
import { resourceGroupsTagging } from "@/lib/aws-clients";

export async function GET() {
  try {
    const res = await resourceGroupsTagging.send(new GetResourcesCommand({}));
    return NextResponse.json({ resources: res.ResourceTagMappingList || [] });
  } catch (error: unknown) {
    return NextResponse.json({
      resources: [],
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
