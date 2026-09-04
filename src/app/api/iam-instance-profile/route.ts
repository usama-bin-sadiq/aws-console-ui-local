import { NextResponse } from "next/server";
import {
  ListInstanceProfilesCommand,
  CreateInstanceProfileCommand,
  DeleteInstanceProfileCommand,
} from "@aws-sdk/client-iam";
import { iam } from "@/lib/aws-clients";

export async function GET() {
  try {
    const res = await iam.send(new ListInstanceProfilesCommand({}));
    return NextResponse.json({ instanceProfiles: res.InstanceProfiles || [] });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const res = await iam.send(new CreateInstanceProfileCommand({ InstanceProfileName: body.name }));
    return NextResponse.json({ instanceProfile: res.InstanceProfile });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    await iam.send(new DeleteInstanceProfileCommand({ InstanceProfileName: searchParams.get("name")! }));
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
