import { NextResponse } from "next/server";
import { ListAppsCommand, AmplifyClient } from "@aws-sdk/client-amplify";
import { getUserClientFromRequest } from "@/lib/aws-clients";
import { requirePermission } from "@/lib/data-isolation";

export async function GET(request: Request): Promise<NextResponse> {
    const denied = await requirePermission(request, "GET");
    if (denied) return denied;
    try {
        const amplifyClient = getUserClientFromRequest(AmplifyClient, request);
        const response = await amplifyClient.send(new ListAppsCommand({ maxResults: 100 }));
        return NextResponse.json({ apps: response.apps ?? [] });
    } catch (error: unknown) {
        return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to list Amplify apps" }, { status: 502 });
    }
}
