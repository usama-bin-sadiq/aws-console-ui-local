import { NextResponse } from "next/server";
import { DescribeLaunchTemplatesCommand, CreateLaunchTemplateCommand, DeleteLaunchTemplateCommand, EC2Client } from "@aws-sdk/client-ec2";
import { getUserClientFromRequest } from "@/lib/aws-clients";
import { requirePermission } from "@/lib/data-isolation";

export async function GET(request: Request) {
  const denied = await requirePermission(request, "GET");
  if (denied) return denied;

  try {
    const ec2Client = getUserClientFromRequest(EC2Client, request);
    const res = await ec2Client.send(new DescribeLaunchTemplatesCommand({}));
    return NextResponse.json({ launchTemplates: res.LaunchTemplates || [] });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const denied = await requirePermission(request, "POST");
  if (denied) return denied;

  try {
    const ec2Client = getUserClientFromRequest(EC2Client, request);
    const body = await request.json();
    const res = await ec2Client.send(new CreateLaunchTemplateCommand({
      LaunchTemplateName: body.name,
      LaunchTemplateData: {
        ImageId: body.imageId || "ami-12345678",
        InstanceType: body.instanceType || "t3.micro",
      },
    }));
    return NextResponse.json({ launchTemplate: res.LaunchTemplate });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const denied = await requirePermission(request, "DELETE");
  if (denied) return denied;

  try {
    const ec2Client = getUserClientFromRequest(EC2Client, request);
    const { searchParams } = new URL(request.url);
    await ec2Client.send(new DeleteLaunchTemplateCommand({ LaunchTemplateId: searchParams.get("ltId")! }));
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
