import { NextResponse } from "next/server";
import { ListAppsCommand } from "@aws-sdk/client-amplify";
import { amplify } from "@/lib/aws-clients";

export async function GET(): Promise<NextResponse> {
    try {
        const response = await amplify.send(new ListAppsCommand({ maxResults: 100 }));
        return NextResponse.json({ apps: response.apps ?? [] });
    } catch (error: unknown) {
        return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to list Amplify apps" }, { status: 502 });
    }
}
