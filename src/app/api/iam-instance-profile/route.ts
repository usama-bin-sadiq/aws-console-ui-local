import { NextResponse } from "next/server";
import {
    IAMClient,
    AddRoleToInstanceProfileCommand,
    CreateInstanceProfileCommand,
    DeleteInstanceProfileCommand,
    ListInstanceProfilesCommand,
    RemoveRoleFromInstanceProfileCommand,
} from "@aws-sdk/client-iam";
import { getUserClientFromRequest } from "@/lib/aws-clients";
import { requirePermission } from "@/lib/data-isolation";

export async function GET(request: Request): Promise<NextResponse> {
    const denied = await requirePermission(request, "GET");
    if (denied) return denied;
    try {
        const iamClient = getUserClientFromRequest(IAMClient, request);
    const response = await iamClient.send(new ListInstanceProfilesCommand({}));
        return NextResponse.json({ instanceProfiles: response.InstanceProfiles || [] });
    } catch (error: unknown) {
        return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to list instance profiles" }, { status: 500 });
    }
}

export async function POST(request: Request): Promise<NextResponse> {
    const denied = await requirePermission(request, "POST");
    if (denied) return denied;
    try {
        const iamClient = getUserClientFromRequest(IAMClient, request);
    const body = await request.json() as { action?: string; name?: string; profileName?: string; roleName?: string };
        if (body.action === "addRole") {
            await iamClient.send(new AddRoleToInstanceProfileCommand({ InstanceProfileName: body.profileName, RoleName: body.roleName }));
            return NextResponse.json({ success: true, action: "addRole" });
        }
        if (body.action === "removeRole") {
            await iamClient.send(new RemoveRoleFromInstanceProfileCommand({ InstanceProfileName: body.profileName, RoleName: body.roleName }));
            return NextResponse.json({ success: true, action: "removeRole" });
        }
        if (!body.name?.trim()) {
            return NextResponse.json({ error: "Instance profile name is required" }, { status: 400 });
        }
        const response = await iamClient.send(new CreateInstanceProfileCommand({ InstanceProfileName: body.name.trim() }));
        return NextResponse.json({ instanceProfile: response.InstanceProfile }, { status: 201 });
    } catch (error: unknown) {
        return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to update instance profile" }, { status: 500 });
    }
}

export async function DELETE(request: Request): Promise<NextResponse> {
    const denied = await requirePermission(request, "DELETE");
    if (denied) return denied;
    try {
        const iamClient = getUserClientFromRequest(IAMClient, request);
    const name = new URL(request.url).searchParams.get("name")?.trim();
        if (!name) return NextResponse.json({ error: "Instance profile name is required" }, { status: 400 });
        await iamClient.send(new DeleteInstanceProfileCommand({ InstanceProfileName: name }));
        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to delete instance profile" }, { status: 500 });
    }
}
