import { NextResponse } from "next/server";
import {
    CreateChannelCommand,
    DeleteChannelCommand,
    ListChannelsCommand,
} from "@aws-sdk/client-iotanalytics";
import { iotAnalytics } from "@/lib/aws-clients";

export async function GET(): Promise<NextResponse> {
    try {
        const response = await iotAnalytics.send(new ListChannelsCommand({}));
        return NextResponse.json({ channels: response.channelSummaries ?? [] });
    } catch (error: unknown) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to list IoT Analytics channels" },
            { status: 502 },
        );
    }
}

export async function POST(request: Request): Promise<NextResponse> {
    try {
        const body = (await request.json()) as { name?: string; retentionPeriod?: number };
        const name = body.name?.trim();
        if (!name) {
            return NextResponse.json({ error: "Channel name is required" }, { status: 400 });
        }

        const response = await iotAnalytics.send(
            new CreateChannelCommand({
                channelName: name,
                retentionPeriod: body.retentionPeriod
                    ? { numberOfDays: body.retentionPeriod, unlimited: false }
                    : undefined,
            }),
        );
        return NextResponse.json(
            {
                channel: {
                    name: response.channelName ?? name,
                    arn: response.channelArn,
                },
            },
            { status: 201 },
        );
    } catch (error: unknown) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to create IoT Analytics channel" },
            { status: 502 },
        );
    }
}

export async function DELETE(request: Request): Promise<NextResponse> {
    try {
        const name = new URL(request.url).searchParams.get("name")?.trim();
        if (!name) {
            return NextResponse.json({ error: "Channel name is required" }, { status: 400 });
        }

        await iotAnalytics.send(new DeleteChannelCommand({ channelName: name }));
        return NextResponse.json({ deleted: name });
    } catch (error: unknown) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to delete IoT Analytics channel" },
            { status: 502 },
        );
    }
}
