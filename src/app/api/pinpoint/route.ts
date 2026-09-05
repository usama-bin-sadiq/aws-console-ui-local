import { NextResponse } from "next/server";
import { GetAppsCommand } from "@aws-sdk/client-pinpoint";
import { pinpoint } from "@/lib/aws-clients";

export async function GET(): Promise<NextResponse> {
    try {
        const response = await pinpoint.send(new GetAppsCommand({}));
        return NextResponse.json({ apps: response.ApplicationsResponse?.Item ?? [] });
    } catch (error: unknown) {
        return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to list Pinpoint apps" }, { status: 502 });
    }
}
