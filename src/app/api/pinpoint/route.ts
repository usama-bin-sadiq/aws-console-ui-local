import { NextResponse } from "next/server";
import { GetAppsCommand, PinpointClient } from "@aws-sdk/client-pinpoint";
import { getUserClientFromRequest } from "@/lib/aws-clients";
import { requirePermission } from "@/lib/data-isolation";

export async function GET(request: Request): Promise<NextResponse> {
  const denied = await requirePermission(request, "GET");
  if (denied) return denied;
  try {
    const pinpointClient = getUserClientFromRequest(PinpointClient, request);
    const response = await pinpointClient.send(new GetAppsCommand({}));
    return NextResponse.json({ apps: response.ApplicationsResponse?.Item ?? [] });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to list Pinpoint apps" },
      { status: 502 },
    );
  }
}
