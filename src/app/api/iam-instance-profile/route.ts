import { NextResponse } from "next/server";
import {
    AddRoleToInstanceProfileCommand,
    CreateInstanceProfileCommand,
    DeleteInstanceProfileCommand,
    ListInstanceProfilesCommand,
    RemoveRoleFromInstanceProfileCommand,
} from "@aws-sdk/client-iam";
import { iam } from "@/lib/aws-clients";

export async function GET(): Promise<NextResponse> {
    try {
        const response = await iam.send(new ListInstanceProfilesCommand({}));
        return NextResponse.json({ instanceProfiles: response.InstanceProfiles || [] });
    } catch (error: unknown) {
        return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to list instance profiles" }, { status: 500 });
    }
}

export async function POST(request: Request): Promise<NextResponse> {
    try {
        const body = await request.json() as { action?: string; name?: string; profileName?: string; roleName?: string };
        if (body.action === "addRole") {
            await iam.send(new AddRoleToInstanceProfileCommand({ InstanceProfileName: body.profileName, RoleName: body.roleName }));
            return NextResponse.json({ success: true, action: "addRole" });
        }
        if (body.action === "removeRole") {
            await iam.send(new RemoveRoleFromInstanceProfileCommand({ InstanceProfileName: body.profileName, RoleName: body.roleName }));
            return NextResponse.json({ success: true, action: "removeRole" });
        }
        if (!body.name?.trim()) {
            return NextResponse.json({ error: "Instance profile name is required" }, { status: 400 });
        }
        const response = await iam.send(new CreateInstanceProfileCommand({ InstanceProfileName: body.name.trim() }));
        return NextResponse.json({ instanceProfile: response.InstanceProfile }, { status: 201 });
    } catch (error: unknown) {
        return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to update instance profile" }, { status: 500 });
    }
}

export async function DELETE(request: Request): Promise<NextResponse> {
    try {
        const name = new URL(request.url).searchParams.get("name")?.trim();
        if (!name) return NextResponse.json({ error: "Instance profile name is required" }, { status: 400 });
        await iam.send(new DeleteInstanceProfileCommand({ InstanceProfileName: name }));
        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to delete instance profile" }, { status: 500 });
    }
}
