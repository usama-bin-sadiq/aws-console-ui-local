import { NextResponse } from "next/server";
import { DescribeLaunchTemplatesCommand, CreateLaunchTemplateCommand, DeleteLaunchTemplateCommand } from "@aws-sdk/client-ec2";
import { ec2 } from "@/lib/aws-clients";

export async function GET() {
  try {
    const res = await ec2.send(new DescribeLaunchTemplatesCommand({}));
    return NextResponse.json({ launchTemplates: res.LaunchTemplates || [] });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const res = await ec2.send(new CreateLaunchTemplateCommand({
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
  try {
    const { searchParams } = new URL(request.url);
    await ec2.send(new DeleteLaunchTemplateCommand({ LaunchTemplateId: searchParams.get("ltId")! }));
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
